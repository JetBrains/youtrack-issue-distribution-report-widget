import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import withWidgetLoaderHOC from '@jetbrains/hub-widget-ui/dist/widget-loader';

import '../../../../components/src/report-widget/report-widget.scss';
import {
  loadReportWithData,
  recalculateReport,
  getYouTrackService,
  loadIndependentBurnDownReports,
  loadSprint,
  saveReportSettings,
  loadAgileReportSettings,
  loadUserGeneralProfile
} from '../../../../components/src/resources/resources';
import ReportModel
  from '../../../../components/src/report-model/report-model';
import BackendTypes from '../../../../components/src/backend-types/backend-types';

import Configuration
  from './configuration';
import Content from './content';

class AgileProgressDiagramWidget extends React.Component {
  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_REFRESH_PERIOD = 900;
  // eslint-disable-next-line no-magic-numbers
  static PROGRESS_BAR_REFRESH_PERIOD = 0.5;

  static getDefaultWidgetTitle = () =>
    i18n('Agile Chart');

  static getAgileBoardTitle = (homeUrl, agile, sprint) => ({
    text: agile.sprintsSettings.disableSprints
      ? agile.name
      : `${agile.name}: ${sprint.name}`,
    href: homeUrl && `${homeUrl}/agiles/${agile.id}/${sprint.id}?chart`
  });

  static getReportTitle = (homeUrl, report) => ({
    text: report.name,
    href: homeUrl && `${homeUrl}/reports/burndown/${report.id}`
  });

  static getPresentationModeWidgetTitle = (report, youTrack) => {
    if (report && report.name) {
      const homeUrl = (youTrack || {}).homeUrl;
      if (report.sprint && report.sprint.agile) {
        return AgileProgressDiagramWidget.getAgileBoardTitle(
          homeUrl, report.sprint.agile, report.sprint
        );
      }
      return AgileProgressDiagramWidget.getReportTitle(
        homeUrl, report
      );
    }
    return AgileProgressDiagramWidget.getDefaultWidgetTitle();
  };

  static getSelectedReportId = async (fetchYouTrack, settings) => {
    if (settings.agileId) {
      const sprint = await loadSprint(
        fetchYouTrack, settings.agileId, settings.sprintId
      );
      if (sprint) {
        if (!sprint.report) {
          const agileReportSettings = await loadAgileReportSettings(
            fetchYouTrack, settings.agileId
          );
          const newReport = agileReportSettings.doNotUseBurndown
            ? ReportModel.NewReport.cumulativeFlow(sprint)
            : ReportModel.NewReport.burnDown(sprint);
          sprint.report = await saveReportSettings(fetchYouTrack, newReport);
        }
        return sprint.report && sprint.report.id;
      }
    }
    return settings.reportId;
  };

  static propTypes = {
    dashboardApi: PropTypes.object.isRequired,
    registerWidgetApi: PropTypes.func.isRequired,
    configWrapper: PropTypes.object.isRequired,
    editable: PropTypes.bool
  };

  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      isLoading: true,
      error: ReportModel.ErrorTypes.OK,
      refreshPeriod: AgileProgressDiagramWidget.DEFAULT_REFRESH_PERIOD,
      dateFieldFormat: {}
    };

    registerWidgetApi({
      onConfigure: () => {
        this.setState({
          isConfiguring: true,
          isLoading: false,
          error: ReportModel.ErrorTypes.OK
        });
      },
      onRefresh: async () => {
        await this.recalculateReport();
      }
    });
  }

  componentDidMount() {
    this.initialize(this.props.dashboardApi);
  }

  // eslint-disable-next-line complexity
  initialize = async dashboardApi => {
    this.setLoadingEnabled(true);
    await this.props.configWrapper.init();

    const fetchHub = dashboardApi.fetchHub.bind(dashboardApi);
    const youTrack = this.props.configWrapper.getFieldValue('youTrack');
    const youTrackService = await getYouTrackService(
      fetchHub, youTrack && youTrack.id
    );
    if (youTrackService && youTrackService.id) {
      this.setYouTrack(youTrackService);
    } else {
      this.setError(ReportModel.ErrorTypes.NO_YOUTRACK);
      return;
    }

    if (this.props.configWrapper.isNewConfig()) {
      this.openWidgetsSettings();
      this.setState({
        refreshPeriod: AgileProgressDiagramWidget.DEFAULT_REFRESH_PERIOD
      });
      return;
    }

    const configReportId =
      await AgileProgressDiagramWidget.getSelectedReportId(
        this.fetchYouTrack, this.props.configWrapper.getFieldValue('settings')
      );
    const report = (configReportId && {id: configReportId}) ||
      (await loadIndependentBurnDownReports(this.fetchYouTrack))[0];

    if (report) {
      const reportWithData = await this.loadReport(report.id, youTrackService);
      const refreshPeriod =
        this.props.configWrapper.getFieldValue('refreshPeriod') ||
        AgileProgressDiagramWidget.DEFAULT_REFRESH_PERIOD;

      const generalProfile = await loadUserGeneralProfile(
        (url, params) => this.fetchYouTrack(url, params)
      );
      const dateFieldFormat = (generalProfile || {}).dateFieldFormat || {};

      this.setState({report: reportWithData, refreshPeriod, dateFieldFormat});
    } else {
      this.setError(ReportModel.ErrorTypes.NO_REPORT);
      return;
    }

    this.setLoadingEnabled(false);
  };

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {youTrack} = this.state;
    return await dashboardApi.fetch(youTrack.id, url, params);
  };

  setYouTrack(youTrackService) {
    BackendTypes.setYtVersion(youTrackService.version);
    this.setState({
      youTrack: {
        id: youTrackService.id,
        homeUrl: youTrackService.homeUrl
      }
    });
  }

  setError(error) {
    this.setState({
      isLoading: false, error
    });
  }

  setLoadingEnabled(isLoading) {
    this.setState({isLoading});
  }

  async recalculateReport() {
    const {
      report,
      isLoading,
      refreshPeriod,
      isConfiguring
    } = this.state;

    const updatedReportEntityId =
      await AgileProgressDiagramWidget.getSelectedReportId(
        this.fetchYouTrack, this.props.configWrapper.getFieldValue('settings')
      );

    if (!report || report.id !== updatedReportEntityId) {
      const newReportEntity = await this.loadReport(updatedReportEntityId);
      this.setState({report: newReportEntity, refreshPeriod});
    } else if (!isLoading && !isConfiguring &&
      !ReportModel.isReportCalculation(report)) {
      report.status = await recalculateReport(this.fetchYouTrack, report);
      this.setState({report, refreshPeriod});
    }
  }

  onWidgetRefresh = async () => {
    const {
      isConfiguring,
      isCalculationCompleted,
      report
    } = this.state;

    if (!isConfiguring && report) {
      const reportWithData =
        await this.loadReport(report.id);

      if (reportWithData) {
        this.setState({
          report: reportWithData,
          error: ReportModel.ErrorTypes.OK,
          isLoading: false,
          isCalculationCompleted: isCalculationCompleted
            ? false
            : ReportModel.isReportCalculationCompleted(reportWithData, report)
        });
      }
    }
  }

  async loadReport(reportId, optionalYouTrack) {
    const fetchYouTrack = !optionalYouTrack
      ? this.fetchYouTrack
      : async (url, params) =>
        await this.props.dashboardApi.fetch(optionalYouTrack.id, url, params);
    try {
      return await loadReportWithData(fetchYouTrack, reportId);
    } catch (err) {
      this.setError(ReportModel.ErrorTypes.CANNOT_LOAD_REPORT);
      return undefined;
    }
  }

  saveConfig = async settings => {
    const {refreshPeriod, youTrack} = this.state;
    await this.props.configWrapper.replace({
      settings, youTrack, refreshPeriod
    });
    this.setState({
      isConfiguring: false
    });
  };

  cancelConfig = async () => {
    if (this.props.configWrapper.isNewConfig()) {
      await this.props.dashboardApi.removeWidget();
    } else {
      this.setState({isConfiguring: false});
      await this.props.dashboardApi.exitConfigMode();
      this.initialize(this.props.dashboardApi);
    }
  };

  openWidgetsSettings = () => {
    this.props.dashboardApi.enterConfigMode();
    this.setState({
      isConfiguring: true,
      isLoading: false
    });
  };

  renderConfigurationForm() {

    const submitForm = async (settings, refreshPeriod, youTrack) => {
      const reportIsChanged =
        settings.reportId !== (this.state.report || {}).id;
      this.setState({
        youTrack,
        isLoading: reportIsChanged,
        report: reportIsChanged ? null : this.state.report,
        error: ReportModel.ErrorTypes.OK
      }, async () => {
        const selectedReportId =
          await AgileProgressDiagramWidget.getSelectedReportId(
            this.fetchYouTrack, settings
          );
        const reportWithData = await this.loadReport(
          selectedReportId, youTrack
        );
        if (reportWithData) {
          this.setState({
            report: reportWithData,
            isLoading: false,
            isCalculationCompleted: false,
            refreshPeriod
          }, async () => await this.saveConfig(settings));
        }
      });
    };

    const {
      refreshPeriod, youTrack
    } = this.state;
    const settings = this.props.configWrapper.getFieldValue('settings') || {};

    return (
      <Configuration
        reportId={settings.reportId}
        agileId={settings.agileId}
        sprintId={settings.sprintId}
        refreshPeriod={refreshPeriod}
        onSubmit={submitForm}
        onCancel={this.cancelConfig}
        dashboardApi={this.props.dashboardApi}
        youTrackId={youTrack.id}
      />
    );
  }

  renderContent() {
    const {
      report, error, isLoading,
      refreshPeriod, youTrack, isCalculationCompleted,
      dateFieldFormat
    } = this.state;

    const isCalculation = ReportModel.isReportCalculation(report);
    const tickPeriodSec = (isCalculation || isCalculationCompleted)
      ? AgileProgressDiagramWidget.PROGRESS_BAR_REFRESH_PERIOD
      : refreshPeriod;
    const millisInSec = 1000;

    if (isCalculationCompleted) {
      const COMPLETED_PROGRESS = 100;
      const shouldShowCompletedProgress =
        report.status.progress < COMPLETED_PROGRESS &&
        !ReportModel.isReportError(report);

      if (shouldShowCompletedProgress) {
        report.status.calculationInProgress = true;
        report.status.progress = COMPLETED_PROGRESS;
      }
    }

    return (
      <Content
        report={report}
        error={error}
        youTrack={youTrack}
        dashboardApi={this.props.dashboardApi}
        widgetLoader={isLoading || isCalculation}
        tickPeriod={tickPeriodSec * millisInSec}
        editable={this.props.editable}

        datePattern={dateFieldFormat.datePattern}
        dateNoYearPattern={dateFieldFormat.dateNoYearPattern}

        onTick={this.onWidgetRefresh}
        onOpenSettings={this.openWidgetsSettings}
      />
    );
  }

  render() {
    const widgetTitle = this.state.isConfiguring
      ? AgileProgressDiagramWidget.getDefaultWidgetTitle()
      : AgileProgressDiagramWidget.getPresentationModeWidgetTitle(
        this.state.report, this.state.youTrack
      );
    const configuration = () => this.renderConfigurationForm();
    const content = withWidgetLoaderHOC(() => this.renderContent());

    return (
      <div className="agile-chart-widget">
        <ConfigurableWidget
          isConfiguring={this.state.isConfiguring}
          dashboardApi={this.props.dashboardApi}
          widgetTitle={widgetTitle}
          Configuration={configuration}
          Content={content}
        />
      </div>
    );
  }
}

export default AgileProgressDiagramWidget;
