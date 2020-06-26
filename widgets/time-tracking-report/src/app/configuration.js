import React from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import WidgetRefreshPeriod from '@jetbrains/hub-widget-ui/dist/refresh-period';
import HttpErrorHandler from '@jetbrains/hub-widget-ui/dist/http-error-handler';
import ConfigurationForm from '@jetbrains/hub-widget-ui/dist/configuration-form';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import Link from '@jetbrains/ring-ui/components/link/link';

import '@jetbrains/ring-ui/components/form/form.scss';

import NoEditPermissionsWarning
  from '../../../../components/src/report-form-controls/no-edit-permissions-warning';
import {
  getYouTrackServices,
  saveReportSettings,
  loadTimeReports,
  loadCurrentUser,
  loadTimeTrackingReportWithSettings
} from '../../../../components/src/resources/resources';
import ReportConfigurationTabs from '../../../../components/src/report-form-controls/report-configuration-tabs';
import ReportModel from '../../../../components/src/report-model/report-model';
import fetcher from '../../../../components/src/fetcher/fetcher';

import TimeTrackingReportForm from './time-tracking-report-form';

class Configuration extends React.Component {
  static propTypes = {
    reportId: PropTypes.string,
    refreshPeriod: PropTypes.number.isRequired,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    onGetReportDraft: PropTypes.func.isRequired,
    dashboardApi: PropTypes.object,
    youTrackId: PropTypes.string
  };

  static getReportsSource = (youtrackId, onConnectionError) => {
    fetcher().setYouTrack(youtrackId);

    return async () => {
      try {
        return await (loadTimeReports(
          async (url, params) =>
            await fetcher().fetchYouTrack(url, params)
        ));
      } catch (e) {
        onConnectionError(HttpErrorHandler.getMessage(e));
        return [];
      }
    };
  };


  constructor(props) {
    super(props);

    const selectedYouTrack = props.youTrackId && {
      id: props.youTrackId
    };
    const selectedReport = props.reportId
      ? {id: props.reportId}
      : props.onGetReportDraft();

    this.state = {
      selectedYouTrack,
      selectedReport,
      youTracks: [selectedYouTrack],
      currentUser: null,
      refreshPeriod: props.refreshPeriod,
      loadReports: props.youTrackId
        ? Configuration.getReportsSource(
          props.youTrackId, e => this.setConnectionError(e)
        ) : () => []
    };
  }

  componentDidMount() {
    this.loadYouTrackList();
    this.initCurrentUser();
  }

  componentWillReceiveProps(props) {
    this.setState({refreshPeriod: props.refreshPeriod});
  }

  setConnectionError(error) {
    this.setState({
      connectionError: error
    });
  }

  async removeWidget() {
    return await this.props.dashboardApi.removeWidget();
  }

  async loadYouTrackList() {
    const {
      selectedYouTrack,
      selectedReport
    } = this.state;
    const youTracks = await getYouTrackServices(
      fetcher().fetchHub
    );
    const selectedYouTrackWithAllFields = youTracks.filter(
      yt => yt.id === (selectedYouTrack || {}).id
    )[0];

    if (selectedYouTrackWithAllFields) {
      this.setState({
        youTracks, selectedYouTrack: selectedYouTrackWithAllFields
      }, () => this.setSelectedReport(selectedReport));
    } else {
      this.setState({
        connectionError: i18n('Failed to find proper YouTrack installation')
      });
    }
  }

  changeReport = async report => {
    const {selectedReport} = this.state;
    if (selectedReport && report.id === selectedReport.id) {
      return;
    }
    this.setSelectedReport(report);
  };

  setSelectedReport(report) {
    const hasSettings = ReportModel.hasSettings(report);
    this.setState({
      selectedReport: report,
      selectedReportSettingsAreChanged: false
    }, () => {
      if (!hasSettings) {
        this.loadReportSettings(report.id);
      }
    });
  }

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

  async loadReportSettings(reportId) {
    let reportWithSettings;
    try {
      reportWithSettings = await loadTimeTrackingReportWithSettings(
        fetcher().fetchYouTrack, reportId
      );
    } catch (err) {
      if (
        err.status === ReportModel.ResponseStatus.NOT_FOUND ||
        err.status === ReportModel.ResponseStatus.NO_ACCESS
      ) {
        reportWithSettings = ReportModel.NewReport.timeTracking();
      } else {
        this.setState({
          reportSettingsLoadingError: HttpErrorHandler.getMessage(err)
        });
        return null;
      }
    }
    if (
      reportWithSettings.id === (this.state.selectedReport || {}).id ||
      reportWithSettings.id === ReportModel.NewReport.NEW_REPORT_ID
    ) {
      this.setState({
        selectedReport: reportWithSettings,
        reportSettingsLoadingError: null
      });
    }
    return reportWithSettings;
  }

  changeYouTrack = selected => {
    this.setState({
      selectedYouTrack: selected.model,
      selectedReport: {},
      errorMessage: '',
      isLoading: true,
      connectionError: null,
      loadReports: Configuration.getReportsSource(
        selected.model.id, e => this.setConnectionError(e)
      )
    }, () => this.setState({
      isLoading: false,
      selectedReport: ReportModel.NewReport.timeTracking()
    }));
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
          fetcher().fetchYouTrack, selectedReport
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

  renderTab(reportWithSettings) {
    const {
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
          fetchYouTrack={fetcher().fetchYouTrack}
          fetchHub={fetcher().fetchHub}
        />
      </div>
    );
  }

  renderReportsSettings(reportWithSettings) {
    return (
      <div>
        {
          (!!reportWithSettings) &&
          <ReportConfigurationTabs
            report={reportWithSettings}
            onChange={this.changeReport}
            onCreateReport={this.props.onGetReportDraft}
            reportsSource={this.state.loadReports}
          >
            {this.renderTab(reportWithSettings)}
          </ReportConfigurationTabs>
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

  renderYouTrackSelect() {
    const {
      youTracks,
      selectedYouTrack
    } = this.state;

    const youTrackServiceToSelectItem = it => it && {
      key: it.id,
      label: it.name,
      description: it.homeUrl,
      model: it
    };

    return youTracks.length > 1 && (
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
    );
  }

  renderConnectionError() {
    const {
      youTracks,
      connectionError
    } = this.state;

    return (
      <div>
        {
          this.renderYouTrackSelect()
        }
        <EmptyWidget
          face={EmptyWidgetFaces.ERROR}
          message={
            youTracks.length > 1
              ? i18n('Failed to load data from selected YouTrack')
              : connectionError
          }
        >
          <Link
            pseudo={true}
            onClick={this.removeWidget}
          >
            {i18n('Remove widget')}
          </Link>
        </EmptyWidget>
      </div>
    );
  }

  renderConfigurationOptions() {
    const {
      errorMessage,
      selectedReport,
      reportSettingsLoadingError,
      selectedReportIsValid
    } = this.state;

    const reportWithSettings =
      ReportModel.hasSettings(selectedReport)
        ? selectedReport
        : undefined;

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
          this.renderYouTrackSelect()
        }
        {
          this.renderReportsSettings(reportWithSettings)
        }
        {
          !reportWithSettings &&
          (
            reportSettingsLoadingError
              ? (
                <div className="ring-form__group">
                  {reportSettingsLoadingError}
                </div>
              ) : <LoaderInline/>
          )
        }
      </ConfigurationForm>
    );
  }

  render() {
    const {connectionError} = this.state;

    if (connectionError) {
      return this.renderConnectionError();
    }
    return this.renderConfigurationOptions();
  }
}


export default Configuration;
