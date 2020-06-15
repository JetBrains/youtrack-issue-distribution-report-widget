import React from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import WidgetRefreshPeriod from '@jetbrains/hub-widget-ui/dist/refresh-period';
import HttpErrorHandler from '@jetbrains/hub-widget-ui/dist/http-error-handler';
import ConfigurationForm from '@jetbrains/hub-widget-ui/dist/configuration-form';

import '@jetbrains/ring-ui/components/form/form.scss';

import BackendTypes from '../../../../components/src/backend-types/backend-types';
import NoEditPermissionsWarning
  from '../../../../components/src/report-form-controls/no-edit-permissions-warning';
import {
  getYouTrackServices,
  saveReportSettings,
  loadReportWithSettings,
  loadTimeReports,
  loadCurrentUser
} from '../../../../components/src/resources/resources';
import ReportNamedTimeRanges from '../../../../components/src/report-model/report-time-ranges';
import ReportTimeScales from '../../../../components/src/report-model/report-time-scales';
import ReportConfigurationTabs from '../../../../components/src/report-form-controls/report-configuration-tabs';

import {makeYouTrackFetcher} from './components/service-resource';
import TimeTrackingReportForm from './time-tracking-report-form';

class Configuration extends React.Component {
  static propTypes = {
    reportId: PropTypes.string,
    refreshPeriod: PropTypes.number.isRequired,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    dashboardApi: PropTypes.object,
    youTrackId: PropTypes.string
  };

  static NEW_REPORT_ID = undefined;

  static createNewReport = () => ({
    id: Configuration.NEW_REPORT_ID,
    $type: BackendTypes.get().TimeSheetReport,
    name: '',
    projects: [],
    range: {
      $type: BackendTypes.get().NamedTimeRange,
      range: {
        id: ReportNamedTimeRanges.LastWeek.id
      }
    },
    scale: {
      id: ReportTimeScales.Day.id,
      $type: BackendTypes.get().TimeSheetReportScale
    },
    workTypes: [],
    authors: [],
    query: '',
    grouping: null,
    own: true,
    editable: true
  });

  static makeReportsOptionsList = reports => reports.map(
    Configuration.reportToSelectItem
  );

  static reportToSelectItem = report => {
    if (!report) {
      return {};
    }

    const getOptionDescription = currentReport => {
      const description = currentReport.owner &&
        (currentReport.owner.name || currentReport.owner.login);
      return description && currentReport.own
        ? `${description} (${i18n('me')})`
        : description;
    };

    const getOptionLabel = currentReport => (
      currentReport.id
        ? currentReport.name || i18n('Unnamed')
        : i18n('New report')
    );

    return {
      key: report.id,
      label: getOptionLabel(report),
      description: getOptionDescription(report),
      model: report
    };
  };

  static areReportSettingsLoaded = report =>
    report && report.projects;

  static getSelectedReportOption = (selectedReport, reports) => {
    if (selectedReport && selectedReport.id) {
      return Configuration.reportToSelectItem(selectedReport);
    }
    if (reports[0]) {
      return Configuration.reportToSelectItem(reports[0]);
    }
    return undefined;
  };

  constructor(props) {
    super(props);

    const selectedYouTrack = props.youTrackId && {
      id: props.youTrackId
    };
    const selectedReport = props.reportId
      ? {id: props.reportId}
      : Configuration.createNewReport();

    this.state = {
      selectedYouTrack,
      selectedReport,
      youTracks: [selectedYouTrack],
      currentUser: null,
      refreshPeriod: props.refreshPeriod
    };
  }

  componentDidMount() {
    this.loadYouTrackList();
    this.onAfterYouTrackChanged();
    this.initCurrentUser();
  }

  componentWillReceiveProps(props) {
    this.setState({refreshPeriod: props.refreshPeriod});
  }

  async loadYouTrackList() {
    const {selectedYouTrack} = this.state;
    const youTracks = await getYouTrackServices(
      this.props.dashboardApi.fetchHub
    );
    const selectedYouTrackWithAllFields = youTracks.filter(
      yt => yt.id === selectedYouTrack.id
    )[0];
    this.setState({
      youTracks, selectedYouTrack: selectedYouTrackWithAllFields
    });
  }

  changeReport = async report => {
    const {selectedReport} = this.state;
    if (selectedReport && report.id === selectedReport.id) {
      return;
    }
    this.setState({
      selectedReport: report,
      selectedReportSettingsAreChanged: false
    });
    const settingsAlreadyLoaded = Configuration.
      areReportSettingsLoaded(report);
    if (!settingsAlreadyLoaded) {
      await this.loadReportSettings(report.id);
    }
  };

  async initCurrentUser() {
    let currentUser;
    try {
      currentUser = await loadCurrentUser(
        this.props.dashboardApi.fetchHub
      );
    } catch (err) {
      return;
    }
    this.setState({currentUser});
  }

  async updateReportsSelectorModel() {
    const getUpdatedCurrentReport = async currentReportId => {
      if (currentReportId) {
        try {
          return await loadReportWithSettings(
            this.fetchYouTrack, currentReportId
          );
        } catch (err) {
          return Configuration.createNewReport();
        }
      }
      return Configuration.createNewReport();
    };

    const selectedReport = await getUpdatedCurrentReport(
      (this.state.selectedReport || {}).id
    );
    this.setState(
      {selectedReport},
      async () => await this.changeReport(selectedReport)
    );

    const reports = await loadTimeReports(
      async (url, params) => this.fetchYouTrack(url, params)
    );
    this.setState({reports});
  }

  async loadReportSettings(reportId) {
    let reportWithSettings;
    try {
      reportWithSettings = await loadReportWithSettings(
        this.fetchYouTrack, reportId
      );
    } catch (err) {
      this.setState({
        reportSettingsLoadingError: HttpErrorHandler.getMessage(err)
      });
      return null;
    }
    if (reportWithSettings.id === (this.state.selectedReport || {}).id) {
      this.setState({
        selectedReport: reportWithSettings,
        reportSettingsLoadingError: null
      });
    }
    return reportWithSettings;
  }

  loadReports = async () =>
    await loadTimeReports(
      async (url, params) => this.fetchYouTrack(url, params)
    )

  changeYouTrack = selected => {
    this.setState({
      selectedYouTrack: selected.model,
      errorMessage: ''
    }, () => this.onAfterYouTrackChanged());
  };

  onReportSettingsChange = report =>
    this.setState({
      selectedReportSettingsAreChanged: true,
      selectedReport: report
    });

  onReportValidStatusChange = selectedReportIsValid =>
    this.setState({selectedReportIsValid});

  setErrorMessage = errorMessage =>
    this.setState({
      isLoading: false, errorMessage
    });

  submitForm = async () => {
    const {
      selectedReport,
      refreshPeriod,
      selectedYouTrack
    } = this.state;
    let reportId = selectedReport.id;

    this.setState({isLoading: true});

    if (this.state.selectedReportSettingsAreChanged) {
      try {
        const savedReport = await saveReportSettings(
          this.fetchYouTrack, selectedReport
        );
        reportId = savedReport.id;
      } catch (err) {
        return this.setErrorMessage(`${i18n('Cannot save report')}: ${HttpErrorHandler.getMessage(err)}`);
      }
    }

    try {
      await this.props.onSubmit(
        reportId, refreshPeriod, selectedYouTrack
      );
    } catch (err) {
      return this.setErrorMessage(`${i18n('Cannot update widget')}: ${HttpErrorHandler.getMessage(err)}`);
    }

    return this.setState({isLoading: false});
  };

  async onAfterYouTrackChanged() {
    this.setState({isLoading: true});
    try {
      await this.updateReportsSelectorModel();
    } catch (err) {
      this.setState({
        errorMessage: HttpErrorHandler.getMessage(err)
      });
    }
    this.setState({isLoading: false});
  }

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {selectedYouTrack} = this.state;
    return await dashboardApi.fetch(selectedYouTrack.id, url, params);
  };

  renderTab(reportWithSettings) {
    const {
      selectedYouTrack,
      currentUser
    } = this.state;

    return (
      <div>
        <NoEditPermissionsWarning
          report={reportWithSettings}
          onChangeReport={this.changeReport}
        />
        <TimeTrackingReportForm
          report={reportWithSettings}
          onReportSettingsChange={this.onReportSettingsChange}
          onValidStateChange={this.onReportValidStatusChange}
          disabled={!reportWithSettings.editable}
          currentUser={currentUser}
          fetchYouTrack={
            makeYouTrackFetcher(this.props.dashboardApi, selectedYouTrack)
          }
          fetchHub={
            this.props.dashboardApi.fetchHub
          }
        />
      </div>
    );
  }

  renderReportsSettings() {
    const {
      selectedReport,
      reportSettingsLoadingError
    } = this.state;

    const reportWithSettings = Configuration.
      areReportSettingsLoaded(selectedReport) ? selectedReport : undefined;

    return (
      <div>
        {
          (!!reportWithSettings) &&
          <ReportConfigurationTabs
            report={reportWithSettings}
            onChange={this.changeReport}
            onCreateReport={Configuration.createNewReport}
            reportsSource={this.loadReports}
          >
            {this.renderTab(reportWithSettings)}
          </ReportConfigurationTabs>
        }
        {
          !reportWithSettings && !reportSettingsLoadingError && <LoaderInline/>
        }
        {
          !reportWithSettings && reportSettingsLoadingError &&
          <div className="ring-form__group">
            {reportSettingsLoadingError}
          </div>
        }
      </div>
    );
  }

  renderRefreshPeriod() {
    const {
      isLoading,
      errorMessage,
      refreshPeriod
    } = this.state;

    if (isLoading || errorMessage) {
      return '';
    }

    const changeRefreshPeriod = newValue =>
      this.setState({refreshPeriod: newValue});

    return (
      <WidgetRefreshPeriod
        seconds={refreshPeriod}
        onChange={changeRefreshPeriod}
      />
    );
  }

  render() {
    const {
      youTracks,
      selectedYouTrack,
      errorMessage,
      reports,
      selectedReport,
      selectedReportIsValid
    } = this.state;

    const youTrackServiceToSelectItem = it => it && {
      key: it.id,
      label: it.name,
      description: it.homeUrl,
      model: it
    };

    return (
      <ConfigurationForm
        warning={errorMessage}
        isInvalid={!!errorMessage || !selectedReport || !selectedReportIsValid}
        isLoading={this.state.isLoading}
        panelControls={this.renderRefreshPeriod()}
        onSave={this.submitForm}
        onCancel={this.props.onCancel}
      >
        {
          youTracks.length > 1 &&
          <div className="ring-form__group">
            <Select
              data={youTracks.map(youTrackServiceToSelectItem)}
              selected={youTrackServiceToSelectItem(selectedYouTrack)}
              onSelect={this.changeYouTrack}
              filter={true}
              label={i18n('Select YouTrack')}
              size={InputSize.FULL}
            />
          </div>
        }
        {
          reports && this.renderReportsSettings()
        }
        {
          !errorMessage && !reports && <LoaderInline/>
        }
      </ConfigurationForm>
    );
  }
}


export default Configuration;
