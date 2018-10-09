import React from 'react';
import PropTypes from 'prop-types';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui/components/link/link';
import ProgressBar from '@jetbrains/ring-ui/components/progress-bar/progress-bar';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';

import {
  loadReportWithData,
  recalculateReport,
  getYouTrackService,
  loadIssuesDistributionReports,
  saveReportSettings
} from './resources';
import ReportChart from './report-chart';
import DistributionReportsConfigurationForm from './distribution-reports-configuration-form';
import {REPORT_TYPES} from './ditribution-report-types';
import DistributionReportAxises from './distribution-report-axises';
import './style/distribution-reports-widget.scss';

class DistributionReportsWidget extends React.Component {
  static ERRORS = {
    UNKNOWN_ERROR: 1,
    NO_YOUTRACK: 2,
    NO_REPORT: 3,
    CANNOT_LOAD_REPORT: 4
  };

  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_REFRESH_PERIOD = 900;

  static isReportCalculation = report =>
    report && report.status && report.status.calculationInProgress;

  static isReportCalculationCompleted = (updatedReport, prevReport) =>
    DistributionReportsWidget.isReportCalculation(prevReport) &&
    !DistributionReportsWidget.isReportCalculation(updatedReport);

  static isReportError = report =>
    report && report.status && report.status.error;

  static isTooBigReportDataError = report =>
    (report.data || {}).tooBig;

  static isNoReportDataError = report => {
    if (DistributionReportsWidget.isTooBigReportDataError(report)) {
      return false;
    }
    const reportData = report.data || {};
    const totalColumnsSize = (reportData.columns || reportData.ycolumns || []).
      map(column => column.size).reduce((a, b) => a + b, 0);
    return !totalColumnsSize;
  };

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
    }
    return report;
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
      error: false
    };

    registerWidgetApi({
      onConfigure: () => {
        this.setState({
          isConfiguring: true,
          isLoading: false,
          error: false
        });
        this.updateTitle();
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
      this.setError(DistributionReportsWidget.ERRORS.NO_YOUTRACK);
      return;
    }
    const isNewWidget = !config;
    if (isNewWidget) {
      this.openWidgetsSettings();
      this.setState({isNewWidget});
      this.initRefreshPeriod(DistributionReportsWidget.DEFAULT_REFRESH_PERIOD);
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
      this.setState({report: reportWithData});
      const refreshPeriod = config.refreshPeriod ||
        DistributionReportsWidget.DEFAULT_REFRESH_PERIOD;
      this.initRefreshPeriod(
        refreshPeriod,
        DistributionReportsWidget.isReportCalculation(reportWithData)
      );
      this.updateTitle(reportWithData);
    } else {
      this.setError(DistributionReportsWidget.ERRORS.NO_REPORT);
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
    this.props.dashboardApi.setLoadingAnimationEnabled(isLoading);
    this.setState({isLoading});
  }

  updateTitle(report) {
    if (report && report.name) {
      const homeUrl = (this.state.youTrack || {}).homeUrl;
      const pathReportType = (REPORT_TYPES[report.$type] || {}).pathPrefix;
      this.props.dashboardApi.setTitle(
        report.name, homeUrl && `${homeUrl}/reports/${pathReportType}/${report.id}`
      );
    } else {
      this.props.dashboardApi.setTitle(i18n('Issue Distribution Report'));
    }
  }

  async recalculateReport() {
    const {
      report,
      isLoading,
      refreshPeriod,
      isConfiguring
    } = this.state;

    if (isLoading || isConfiguring || !report || !report.status ||
      DistributionReportsWidget.isReportCalculation(report)) {
      return;
    }

    report.status = await recalculateReport(this.fetchYouTrack, report);
    this.setState(report, () =>
      this.initRefreshPeriod(
        refreshPeriod, DistributionReportsWidget.isReportCalculation(report)
      )
    );
  }

  initRefreshPeriod = (newRefreshPeriod, isReportCalculation) => {
    if (!newRefreshPeriod || newRefreshPeriod !== this.state.refreshPeriod) {
      this.setState({refreshPeriod: newRefreshPeriod});
    }

    if (isReportCalculation) {
      this.props.dashboardApi.setLoadingAnimationEnabled(true);
    }

    const millisInSec = 1000;
    const reportProgressBarRefreshPeriod = 0.5;
    const currentRefreshPeriod = isReportCalculation
      ? reportProgressBarRefreshPeriod
      : (newRefreshPeriod || this.state.refreshPeriod);

    setTimeout(async () => {
      const {
        isConfiguring,
        refreshPeriod,
        report
      } = this.state;
      if (!isConfiguring && refreshPeriod === newRefreshPeriod && report) {
        const reportWithData =
          await this.loadReportWithAppliedConfigSettings(report.id);
        const isUpdatedReportVersionCalculation =
          DistributionReportsWidget.isReportCalculation(reportWithData);

        if (reportWithData) {
          this.updateTitle(reportWithData);

          const calculationCompleted = DistributionReportsWidget.
            isReportCalculationCompleted(reportWithData, report);
          let stopProgressBarAnimation;

          if (calculationCompleted) {
            this.props.dashboardApi.setLoadingAnimationEnabled(false);
            const animationTimeout =
              reportProgressBarRefreshPeriod * millisInSec;
            stopProgressBarAnimation = this.animateProgressBarCompletion(
              reportWithData, report, animationTimeout
            );
          }

          this.setState({
            report: reportWithData,
            error: false,
            isLoading: false,
            isNewWidget: false
          }, stopProgressBarAnimation);
        }

        this.initRefreshPeriod(
          refreshPeriod, isUpdatedReportVersionCalculation
        );
      }
    }, currentRefreshPeriod * millisInSec);
  };

  async loadReport(reportId, optionalYouTrack) {
    const fetchYouTrack = !optionalYouTrack
      ? this.fetchYouTrack
      : async (url, params) =>
        await this.props.dashboardApi.fetch(optionalYouTrack.id, url, params);
    try {
      return await loadReportWithData(fetchYouTrack, reportId);
    } catch (err) {
      this.setError(DistributionReportsWidget.ERRORS.CANNOT_LOAD_REPORT);
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

  animateProgressBarCompletion(updatedReport, prevReport, animationTimeout) {
    const COMPLETED_PROGRESS = 100;
    const shouldShowCompletedProgress =
      prevReport.status.progress < COMPLETED_PROGRESS &&
      !DistributionReportsWidget.isReportError(updatedReport);

    if (shouldShowCompletedProgress) {
      updatedReport.status.calculationInProgress = true;
      updatedReport.status.progress = COMPLETED_PROGRESS;
    }

    return () => {
      if (shouldShowCompletedProgress) {
        setTimeout(() => {
          updatedReport.status.calculationInProgress = false;
          this.setState({report: updatedReport}, () =>
            this.props.dashboardApi.setLoadingAnimationEnabled(false)
          );
        }, animationTimeout);
      }
    };
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
    this.updateTitle();
    this.props.dashboardApi.enterConfigMode();
    this.setState({
      isConfiguring: true,
      isLoading: false
    });
  };

  onChangeReportSortOrders =
    async (mainAxisSortOrder, secondaryAxisSortOrder) => {
      const {SortOrder} = DistributionReportAxises;
      const {report} = this.state;
      SortOrder.setMainAxisSortOrder(report, mainAxisSortOrder);
      SortOrder.setSecondaryAxisSortOrder(report, secondaryAxisSortOrder);
      this.setState({report});

      if (SortOrder.isEditable(report)) {
        return await saveReportSettings(this.fetchYouTrack, report, true);
      } else {
        return await this.props.dashboardApi.storeConfig({
          reportId: report.id, mainAxisSortOrder, secondaryAxisSortOrder
        });
      }
    };

  renderLoader() {
    return <LoaderInline/>;
  }

  renderFatalError(message) {
    const removeWidget = async () =>
      await this.props.dashboardApi.removeWidget();

    return (
      <EmptyWidget
        face={EmptyWidgetFaces.ERROR}
        message={message}
      >
        <Link
          pseudo={true}
          onClick={removeWidget}
        >
          {i18n('Remove widget')}
        </Link>
      </EmptyWidget>
    );
  }

  renderReportError(message) {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.OK}
        message={message}
      >
        <Link
          pseudo={true}
          onClick={this.openWidgetsSettings}
        >
          {i18n('Edit settings')}
        </Link>
      </EmptyWidget>
    );
  }

  renderError(error) {
    if (error === DistributionReportsWidget.ERRORS.NO_YOUTRACK) {
      return this.renderFatalError(
        i18n('Cannot find YouTrack installation')
      );
    }
    if (error === DistributionReportsWidget.ERRORS.NO_REPORT) {
      return this.renderReportError(
        i18n('Cannot find any issue distribution report')
      );
    }
    if (error === DistributionReportsWidget.ERRORS.CANNOT_LOAD_REPORT) {
      return this.renderReportError(i18n('Cannot load selected report'));
    }
    return this.renderFatalError(
      i18n('Oops... Something went wrong =(')
    );
  }

  renderConfigurationForm() {
    const submitForm = async (selectedReportId, refreshPeriod, youTrack) => {
      const reportIsChanged = selectedReportId !== (this.state.report || {}).id;
      this.setState({
        youTrack,
        isLoading: reportIsChanged,
        report: reportIsChanged ? null : this.state.report,
        error: false
      }, async () => {
        const reportWithData = await this.loadReportWithAppliedConfigSettings(
          selectedReportId, youTrack
        );
        if (reportWithData) {
          this.updateTitle(reportWithData);
          this.initRefreshPeriod(
            refreshPeriod,
            DistributionReportsWidget.isReportCalculation(reportWithData)
          );
          this.setState({
            report: reportWithData,
            isLoading: false,
            isNewWidget: false
          }, async () => await this.saveConfig());
        }
      });
    };

    const {
      report, refreshPeriod, youTrack
    } = this.state;

    return (
      <div>
        <DistributionReportsConfigurationForm
          reportId={(report || {}).id}
          refreshPeriod={refreshPeriod}
          onSubmit={submitForm}
          onCancel={this.cancelConfig}
          dashboardApi={this.props.dashboardApi}
          youTrackId={youTrack.id}
        />
      </div>
    );
  }

  renderReportBody() {
    const {report, youTrack} = this.state;

    if (DistributionReportsWidget.isReportCalculation(report)) {
      const fromPercentsCoefficient = 0.01;
      const progressValue = report.status.progress * fromPercentsCoefficient;
      return (
        <div className="distribution-reports-widget__progress">
          <div>{i18n('Calculating...')}</div>
          <ProgressBar
            className="distribution-reports-widget__progress-bar"
            value={progressValue}
          />
        </div>
      );
    }

    if (DistributionReportsWidget.isReportError(report)) {
      return this.renderReportError(report.status.errorMessage);
    }

    if (DistributionReportsWidget.isTooBigReportDataError(report)) {
      return this.renderReportError(
        i18n('The report cannot be calculated: the filters in the report settings return too many issues')
      );
    }

    if (DistributionReportsWidget.isNoReportDataError(report)) {
      return this.renderReportError(i18n('There aren\'t any issues that match the filters in the report settings'));
    }

    const {SortOrder} = DistributionReportAxises;

    return (
      <ReportChart
        reportData={report.data}
        reportMainSortOrder={SortOrder.getMainAxisSortOrder(report)}
        reportSecondarySortOrder={SortOrder.getSecondaryAxisSortOrder(report)}
        reportMainAxisLabel={
          DistributionReportAxises.getMainAxisPresentation(report)
        }
        reportSecondaryAxisLabel={
          DistributionReportAxises.getSecondaryAxisPresentation(report)
        }
        onChangeSortOrders={this.onChangeReportSortOrders}
        homeUrl={youTrack.homeUrl}
      />
    );
  }

  render() {
    const {
      report,
      isConfiguring,
      error
    } = this.state;

    if (isConfiguring) {
      return this.renderConfigurationForm();
    }
    if (error) {
      return this.renderError(error);
    }
    if (!report) {
      return this.renderLoader();
    }
    return this.renderReportBody();
  }
}

export default DistributionReportsWidget;
