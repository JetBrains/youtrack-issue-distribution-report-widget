import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import withWidgetLoaderHOC from '@jetbrains/hub-widget-ui/dist/widget-loader';
import 'd3/d3';
import 'nvd3/nv.d3';
import 'nvd3/nv.d3.css';

import ReportModel from '../../../../components/src/report-model/report-model';
import BackendTypes from '../../../../components/src/backend-types/backend-types';
import {loadReportWithData} from '../../../../components/src/resources/resources';
import '../../../../components/src/report-widget/report-widget.scss';

import {
  recalculateReport,
  getYouTrackService,
  loadIssuesDistributionReports,
  saveReportSettings
} from './resources';
import Configuration
  from './configuration';
import {getReportTypePathPrefix} from './spend-time-report-types';
import Content from './content';
import './style/spend-time-report-widget.scss';

class SpendTimeReportsWidget extends React.Component {
  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_REFRESH_PERIOD = 900;
  // eslint-disable-next-line no-magic-numbers
  static PROGRESS_BAR_REFRESH_PERIOD = 0.5;

  static applyReportSettingsFromWidgetConfig = (report, config) => {
    if (!config || config.reportId !== report.id) {
      return report;
    }
    if (config.presentation) {
      report.presentation = config.presentation;
    }
    return report;
  };

  static getDefaultWidgetTitle = () =>
    i18n('Issue Distribution Report');

  static getPresentationModeWidgetTitle = (report, youTrack) => {
    if (report && report.name) {
      const homeUrl = (youTrack || {}).homeUrl;
      const pathReportType = getReportTypePathPrefix(report);
      return {
        text: report.name,
        href: homeUrl && `${homeUrl}/reports/${pathReportType}/${report.id}`
      };
    }
    return SpendTimeReportsWidget.getDefaultWidgetTitle();
  };

  static getConfigAsObject = (configWrapper, fieldsToOverwrite) => {
    return {
      reportId: getFieldValue('reportId'),
      mainAxisSortOrder: getFieldValue('mainAxisSortOrder'),
      secondaryAxisSortOrder: getFieldValue('secondaryAxisSortOrder'),
      presentation: getFieldValue('presentation'),
      youTrack: getFieldValue('youTrack'),
      refreshPeriod: getFieldValue('refreshPeriod')
    };

    function getFieldValue(name) {
      return (fieldsToOverwrite && fieldsToOverwrite[name]) ||
        configWrapper.getFieldValue(name);
    }
  };

  static propTypes = {
    dashboardApi: PropTypes.object.isRequired,
    registerWidgetApi: PropTypes.func.isRequired,
    editable: PropTypes.bool,
    configWrapper: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      isLoading: true,
      error: ReportModel.ErrorTypes.OK,
      refreshPeriod: SpendTimeReportsWidget.DEFAULT_REFRESH_PERIOD
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
    const ytTrackService = await getYouTrackService(
      fetchHub, youTrack && youTrack.id
    );
    if (ytTrackService && ytTrackService.id) {
      this.setYouTrack(ytTrackService);
    } else {
      this.setError(ReportModel.ErrorTypes.NO_YOUTRACK);
      return;
    }
    if (this.props.configWrapper.isNewConfig()) {
      this.openWidgetsSettings();
      this.setState({
        isNewWidget: true,
        refreshPeriod: SpendTimeReportsWidget.DEFAULT_REFRESH_PERIOD
      });
      return;
    }

    const configReportId = this.props.configWrapper.getFieldValue('reportId');
    const report = (configReportId && {id: configReportId}) ||
      (await loadIssuesDistributionReports(this.fetchYouTrack))[0];

    if (report) {
      const reportWithData = await this.loadReportWithAppliedConfigSettings(
        report.id,
        ytTrackService
      );
      const refreshPeriod =
        this.props.configWrapper.getFieldValue('refreshPeriod') ||
        SpendTimeReportsWidget.DEFAULT_REFRESH_PERIOD;
      const yAxis = this.props.configWrapper.getFieldValue('yAxis') || 'issue';
      this.setState({report: reportWithData, refreshPeriod, yAxis});
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

    if (isLoading || isConfiguring || !report || !report.status ||
      ReportModel.isReportCalculation(report)) {
      return;
    }

    report.status = await recalculateReport(this.fetchYouTrack, report);
    this.setState({report, refreshPeriod});
  }

  onWidgetRefresh = async () => {
    const {
      isConfiguring,
      isCalculationCompleted,
      report
    } = this.state;

    if (!isConfiguring && report) {
      const reportWithData =
        await this.loadReportWithAppliedConfigSettings(report.id);

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
  };

  async loadReport(reportId, optionalYouTrack) {
    const fetchYouTrack = !optionalYouTrack
      ? this.fetchYouTrack
      : async (url, params) =>
        await this.props.dashboardApi.fetch(optionalYouTrack.id, url, params);
    const line = this.state.yAxis;
    try {
      return await loadReportWithData(fetchYouTrack, reportId, {line});
    } catch (err) {
      this.setError(ReportModel.ErrorTypes.CANNOT_LOAD_REPORT);
      return undefined;
    }
  }

  async loadReportWithAppliedConfigSettings(
    reportId, optionalYouTrack
  ) {
    return SpendTimeReportsWidget.
      applyReportSettingsFromWidgetConfig(
        await this.loadReport(reportId, optionalYouTrack),
        SpendTimeReportsWidget.getConfigAsObject(this.props.configWrapper)
      );
  }

  saveConfig = async () => {
    const {report, refreshPeriod, youTrack} = this.state;
    await this.props.configWrapper.replace({
      reportId: report.id, youTrack, refreshPeriod
    });
    this.setState({isConfiguring: false});
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

  onChangeReportSortOrders =
    async (mainAxisSortOrder, secondaryAxisSortOrder) => {
      const {report} = this.state;

      this.setState({report});

      if (this.props.editable) {
        return report.own
          ? await saveReportSettings(this.fetchYouTrack, report, true)
          : await this.props.configWrapper.update({
            reportId: report.id, mainAxisSortOrder, secondaryAxisSortOrder
          });
      }

      return null;
    };

  onChangeYAxis = async yAxis => {
    debugger;
    this.setState({yAxis});

    if (this.props.editable) {
      return await this.props.configWrapper.
        update({reportId: report.id, yAxis});
    }

    return null;
  };

  renderConfigurationForm() {
    const submitForm = async (selectedReportId, refreshPeriod, youTrack) => {
      const reportIsChanged = selectedReportId !== (this.state.report || {}).id;
      this.setState({
        youTrack,
        isLoading: reportIsChanged,
        report: reportIsChanged ? null : this.state.report,
        error: ReportModel.ErrorTypes.OK
      }, async () => {
        const reportWithData = await this.loadReportWithAppliedConfigSettings(
          selectedReportId, youTrack
        );
        if (reportWithData) {
          this.setState({
            report: reportWithData,
            isLoading: false,
            isNewWidget: false,
            refreshPeriod
          }, async () => await this.saveConfig());
        }
      });
    };

    const {
      report, refreshPeriod, youTrack
    } = this.state;

    return (
      <Configuration
        reportId={(report || {}).id}
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
      report,
      error,
      isLoading,
      refreshPeriod,
      youTrack,
      isCalculationCompleted,
      yAxis
    } = this.state;

    const isCalculation = ReportModel.isReportCalculation(report);
    const tickPeriodSec = (isCalculation || isCalculationCompleted)
      ? SpendTimeReportsWidget.PROGRESS_BAR_REFRESH_PERIOD
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
        isIssueView={ yAxis === 'issue' }
        editable={this.props.editable}
        onTick={this.onWidgetRefresh}
        onOpenSettings={this.openWidgetsSettings}
        onChangeReportSortOrders={this.onChangeReportSortOrders}
        onChangeYAxis={this.onChangeYAxis}
      />
    );
  }

  render() {
    const widgetTitle = this.state.isConfiguring
      ? SpendTimeReportsWidget.getDefaultWidgetTitle()
      : SpendTimeReportsWidget.getPresentationModeWidgetTitle(
        this.state.report, this.state.youTrack
      );
    const configuration = () => this.renderConfigurationForm();
    const content = withWidgetLoaderHOC(() => this.renderContent());

    return (
      <div className="distribution-reports-widget">
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

export default SpendTimeReportsWidget;
