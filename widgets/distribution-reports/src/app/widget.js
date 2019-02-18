import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import withWidgetLoaderHOC from '@jetbrains/hub-widget-ui/dist/widget-loader';
import 'd3/d3';
import 'nvd3/nv.d3';
import 'nvd3/nv.d3.css';

import {
  loadReportWithData,
  recalculateReport,
  getYouTrackService,
  loadIssuesDistributionReports,
  saveReportSettings
} from './resources';
import Configuration
  from './configuration';
import {REPORT_TYPES} from './distribution-report-types';
import ReportModel from './report-model';
import DistributionReportAxises from './distribution-report-axises';
import Content from './content';
import './style/distribution-reports-widget.scss';

class DistributionReportsWidget extends React.Component {
  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_REFRESH_PERIOD = 900;
  // eslint-disable-next-line no-magic-numbers
  static PROGRESS_BAR_REFRESH_PERIOD = 0.5;

  static applyReportSettingsFromWidgetConfig = (report, config) => {
    if (!config || config.reportId !== report.id) {
      return report;
    }
    if (!DistributionReportAxises.SortOrder.isEditable(report)) {
      if (config.mainAxisSortOrder) {
        DistributionReportAxises.SortOrder.setMainAxisSortOrder(
          report, config.mainAxisSortOrder
        );
      }
      if (config.secondaryAxisSortOrder) {
        DistributionReportAxises.SortOrder.setSecondaryAxisSortOrder(
          report, config.secondaryAxisSortOrder
        );
      }
      if (config.presentation) {
        report.presentation = config.presentation;
      }
    }
    return report;
  };

  static getDefaultWidgetTitle = () =>
    i18n('Issue Distribution Report');

  static getPresentationModeWidgetTitle = (report, youTrack) => {
    if (report && report.name) {
      const homeUrl = (youTrack || {}).homeUrl;
      const pathReportType = (REPORT_TYPES[report.$type] || {}).pathPrefix;
      return {
        text: report.name,
        href: homeUrl && `${homeUrl}/reports/${pathReportType}/${report.id}`
      };
    }
    return DistributionReportsWidget.getDefaultWidgetTitle();
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
      refreshPeriod: DistributionReportsWidget.DEFAULT_REFRESH_PERIOD
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
        refreshPeriod: DistributionReportsWidget.DEFAULT_REFRESH_PERIOD
      });
      return;
    }

    this.setState({config});

    const configReportId = config.reportId;
    const report = (configReportId && {id: configReportId}) ||
      (await loadIssuesDistributionReports(this.fetchYouTrack))[0];

    if (report) {
      const reportWithData = await this.loadReportWithAppliedConfigSettings(
        report.id, ytTrackService, config
      );
      const refreshPeriod = config.refreshPeriod ||
        DistributionReportsWidget.DEFAULT_REFRESH_PERIOD;
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

  async loadReportWithAppliedConfigSettings(
    reportId, optionalYouTrack, optionalConfig
  ) {
    return DistributionReportsWidget.
      applyReportSettingsFromWidgetConfig(
        await this.loadReport(reportId, optionalYouTrack),
        optionalConfig || this.state.config
      );
  }

  saveConfig = async () => {
    const {report, refreshPeriod, youTrack} = this.state;
    await this.props.dashboardApi.storeConfig({
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
      const {SortOrder} = DistributionReportAxises;
      const {report, config} = this.state;

      SortOrder.setMainAxisSortOrder(report, mainAxisSortOrder);
      SortOrder.setSecondaryAxisSortOrder(report, secondaryAxisSortOrder);

      config.mainAxisSortOrder = mainAxisSortOrder;
      config.secondaryAxisSortOrder = secondaryAxisSortOrder;

      this.setState({report, config});

      if (SortOrder.isEditable(report)) {
        return await saveReportSettings(this.fetchYouTrack, report, true);
      }

      return await this.props.dashboardApi.storeConfig({
        reportId: report.id, mainAxisSortOrder, secondaryAxisSortOrder
      });
    };

  onChangeReportPresentation = async presentation => {
    const {report, config} = this.state;
    config.presentation = report.presentation = presentation;
    this.setState({report, config});

    if (report.own) {
      return await saveReportSettings(this.fetchYouTrack, report, true);
    }
    return await this.props.dashboardApi.storeConfig({
      reportId: report.id, presentation
    });
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
      report, error, isLoading, refreshPeriod, youTrack, isCalculationCompleted
    } = this.state;

    const isCalculation = ReportModel.isReportCalculation(report);
    const tickPeriodSec = (isCalculation || isCalculationCompleted)
      ? DistributionReportsWidget.PROGRESS_BAR_REFRESH_PERIOD
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
        onChangeReportSortOrders={this.onChangeReportSortOrders}
        onChangePresentationMode={this.onChangeReportPresentation}
      />
    );
  }

  render() {
    const widgetTitle = this.state.isConfiguring
      ? DistributionReportsWidget.getDefaultWidgetTitle()
      : DistributionReportsWidget.getPresentationModeWidgetTitle(
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

export default DistributionReportsWidget;
