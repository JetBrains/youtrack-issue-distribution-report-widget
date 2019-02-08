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
  loadAgileReportSettings
} from '../../../../components/src/resources/resources';
import ReportModel
  from '../../../../components/src/report-model/report-model';

import Configuration
  from './configuration';
import Content from './content';
import './style/agile-chart-widget.scss';

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
    dashboardApi: PropTypes.object,
    registerWidgetApi: PropTypes.func
  };

  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      isLoading: true,
      error: ReportModel.ErrorTypes.OK,
      refreshPeriod: AgileProgressDiagramWidget.DEFAULT_REFRESH_PERIOD
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
    const fetchHub = dashboardApi.fetchHub.bind(dashboardApi);
    const config = await dashboardApi.readConfig();
    const ytTrackService = await getYouTrackService(
      fetchHub, config && config.youTrack && config.youTrack.id
    );
    if (ytTrackService && ytTrackService.id) {
      this.setYouTrack(ytTrackService);
    } else {
      this.setError(ReportModel.ErrorTypes.NO_YOUTRACK);
      return;
    }
    const isNewWidget = !config;
    if (isNewWidget) {
      this.openWidgetsSettings();
      this.setState({
        isNewWidget,
        refreshPeriod: AgileProgressDiagramWidget.DEFAULT_REFRESH_PERIOD
      });
      return;
    }

    this.setState({config});

    const configReportId =
      await AgileProgressDiagramWidget.getSelectedReportId(
        this.fetchYouTrack, config.settings
      );
    const report = (configReportId && {id: configReportId}) ||
      (await loadIndependentBurnDownReports(this.fetchYouTrack))[0];

    if (report) {
      const reportWithData = await this.loadReport(
        report.id, ytTrackService, config
      );
      const refreshPeriod = config.refreshPeriod ||
        AgileProgressDiagramWidget.DEFAULT_REFRESH_PERIOD;
      this.setState({report: reportWithData, refreshPeriod});
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
      config,
      isLoading,
      refreshPeriod,
      isConfiguring
    } = this.state;

    const updatedReportEntityId =
      await AgileProgressDiagramWidget.getSelectedReportId(
        this.fetchYouTrack, config.settings
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
          isNewWidget: false,
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
    const newConfig = {
      settings, youTrack, refreshPeriod
    };
    await this.props.dashboardApi.storeConfig(newConfig);
    this.setState({
      isConfiguring: false, config: newConfig
    });
  };

  cancelConfig = async () => {
    const {isNewWidget} = this.state;
    if (isNewWidget) {
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
            isNewWidget: false,
            isCalculationCompleted: false,
            refreshPeriod
          }, async () => await this.saveConfig(settings));
        }
      });
    };

    const {
      config, refreshPeriod, youTrack
    } = this.state;
    const settings = config && config.settings || {};

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
      report, error, isLoading, refreshPeriod, youTrack, isCalculationCompleted
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
