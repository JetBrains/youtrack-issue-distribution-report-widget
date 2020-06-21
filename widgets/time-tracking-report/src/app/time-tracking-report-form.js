import React from 'react';
import PropTypes from 'prop-types';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import {
  InfoIcon,
  EyeIcon,
  PencilIcon
} from '@jetbrains/ring-ui/components/icon';
import Select from '@jetbrains/ring-ui/components/select/select';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import BackendTypes from '../../../../components/src/backend-types/backend-types';
import SharingSetting from
  '../../../../components/src/sharing-setting/sharing-setting';
import {
  loadUsers,
  loadVisibilityUserGroups
} from '../../../../components/src/resources/resources';
import ReportTimeScales
  from '../../../../components/src/report-model/report-time-scales';
import EnumButtonGroup from '../../../../components/src/enum-button-group/enum-button-group';
import ReportGroupingControl from '../../../../components/src/report-form-controls/report-grouping-control';
import StandardFormGroup from '../../../../components/src/report-form-controls/standard-form-group';
import ReportIssuesFilter from '../../../../components/src/report-form-controls/report-issues-filter';
import ReportProjects from '../../../../components/src/report-form-controls/report-projects';
import ReportUsers from '../../../../components/src/report-form-controls/report-users';
import ReportWorkTypes from '../../../../components/src/report-form-controls/report-work-types';
import ReportPeriod from '../../../../components/src/report-form-controls/report-period';


class TimeTrackingReportForm extends React.Component {
  static propTypes = {
    report: PropTypes.object,
    onValidStateChange: PropTypes.func,
    onReportSettingsChange: PropTypes.func,
    disabled: PropTypes.bool,
    currentUser: PropTypes.object,
    fetchYouTrack: PropTypes.func,
    fetchHub: PropTypes.func
  };

  static isNewReport = report => !report.id;

  static getReportOwner = (report, currentUser) =>
    report && report.owner || currentUser;

  static checkReportValidity = report =>
    !!report && !!report.name;

  constructor(props) {
    super(props);

    this.state = {
      report: props.report,
      disabled: props.disabled,
      fetchYouTrack: props.fetchYouTrack,
      fetchHub: props.fetchHub,
      currentUser: props.currentUser,
      userGroups: [],
      users: []
    };
    this.props.onValidStateChange(
      TimeTrackingReportForm.checkReportValidity(props.report)
    );
  }

  componentWillReceiveProps(props) {
    this.setState({
      disabled: props.disabled,
      currentUser: props.currentUser,
      fetchYouTrack: props.fetchYouTrack,
      fetchHub: props.fetchHub
    });
    if ((props.report || {}).id !== (this.state.report || {}).id) {
      this.updateReport(props.report);
    }
  }

  changeReportName = evt => {
    const {report} = this.state;
    report.name = evt.target.value;
    this.onReportEditOperation(report);
  };

  getReportEditOperationHandler = propertyName =>
    value => {
      const {report} = this.state;
      report[propertyName] = value;
      this.onReportEditOperation(report);
    };

  getSharingSettingsOptions = async (query = '') => {
    const {report, currentUser, fetchYouTrack} = this.state;

    const groups = await loadVisibilityUserGroups(fetchYouTrack, {query});

    const projectId = ((report || {}).projects || []).
      map(project => project.id);
    const users = await loadUsers(fetchYouTrack, {
      query, permissionId: 'JetBrains.YouTrack.READ_REPORT', projectId
    });

    return {groups, users, currentUser};
  };

  changeSharingSettings = (settingName, value) => {
    const {report} = this.state;
    report[settingName] = value;
    this.onReportEditOperation(report);
  };

  changeReadSharingSettings = options => {
    this.changeSharingSettings('readSharingSettings', options);
  };

  changeUpdateSharingSettings = options => {
    this.changeSharingSettings('updateSharingSettings', options);
  };

  changeReportType = async ({key}) => {
    const {report} = this.props;
    const reportSelectedKey = report.scale ? 'time' : 'work-types';

    if (reportSelectedKey !== key) {
      const keyToSettingsMap = {
        time: {
          $type: BackendTypes.get().TimeSheetReport,
          scale: {
            id: ReportTimeScales.Day.id,
            $type: BackendTypes.get().TimeSheetReportScale
          }
        },
        'work-types': {
          $type: BackendTypes.get().TimeReport,
          scale: undefined
        }
      };

      const {$type, scale} = keyToSettingsMap[key];
      report.$type = $type;
      report.scale = scale;
      this.onReportEditOperation(report);
    }
  };

  updateReport(report) {
    this.setState({report});
    const reportIsValid =
      TimeTrackingReportForm.checkReportValidity(report);
    this.props.onValidStateChange(reportIsValid);
    return reportIsValid;
  }

  onReportEditOperation(report) {
    if (this.updateReport(report)) {
      this.props.onReportSettingsChange(report);
    }
  }

  renderGroupByBlock() {
    const {report, fetchYouTrack, disabled} = this.state;

    return (
      <StandardFormGroup
        label={i18n('Group by {{field}}', {field: ''})}
      >
        <ReportGroupingControl
          group={report.grouping}
          projects={report.projects}
          disabled={disabled}
          fetchYouTrack={fetchYouTrack}
          onChange={this.getReportEditOperationHandler('grouping')}
        />
      </StandardFormGroup>
    );
  }

  renderXAxisBlock(report, disabled) {
    const reportScale = report.scale;

    const scales = Object.keys(ReportTimeScales).
      map(key => ({
        id: ReportTimeScales[key].id,
        label: ReportTimeScales[key].text()
      }));

    const timeOption = {
      key: 'time',
      label: i18n('Time')
    };

    const workTypesOption = {
      key: 'work-types',
      label: i18n('Work types')
    };

    return (
      <StandardFormGroup label={i18n('X axis')}>
        <span>
          {
            TimeTrackingReportForm.isNewReport(report) &&
            <Select
              data={[timeOption, workTypesOption]}
              selected={reportScale ? timeOption : workTypesOption}
              onSelect={this.changeReportType}
              type={Select.Type.INLINE}
            />
          }
          {
            !TimeTrackingReportForm.isNewReport(report) &&
            <span>
              {reportScale ? i18n('Time') : i18n('Work types')}
            </span>
          }
          {
            reportScale &&
            <span className="time-report-widget__sub-control">
              <EnumButtonGroup
                values={scales}
                selected={reportScale}
                onChange={this.getReportEditOperationHandler('scale')}
                disabled={disabled}
              />
            </span>
          }
        </span>
      </StandardFormGroup>
    );
  }

  renderPeriodBlock(reportRange, disabled) {
    return (
      <StandardFormGroup label={i18n('Period')}>
        <ReportPeriod
          period={reportRange}
          disabled={disabled}
          onChange={this.getReportEditOperationHandler('range')}
        />
      </StandardFormGroup>
    );
  }


  renderSharingSettingBlock(settingName, label, IconElement, title) {
    const {
      disabled,
      report
    } = this.state;

    const sharingSetting = report && report[settingName] || {};
    const implicitSelected = [TimeTrackingReportForm.getReportOwner(
      report, this.props.currentUser
    )].filter(user => !!user);

    return (
      <StandardFormGroup label={title}>
        <span>
          <IconElement
            className="time-report-widget__icon time-report-widget__label"
            color={InfoIcon.Color.GRAY}
            size={InfoIcon.Size.Size14}
          />
          <span className="time-report-widget__label">
            {label}
          </span>
          <SharingSetting
            getOptions={this.getSharingSettingsOptions}
            value={sharingSetting}
            onChange={this.getReportEditOperationHandler(settingName)}
            disabled={disabled}
            implicitSelected={implicitSelected}
          />
        </span>
      </StandardFormGroup>
    );
  }

  renderVisibleToBlock() {
    return this.renderSharingSettingBlock(
      'readSharingSettings',
      i18n('Can view and use'),
      EyeIcon,
      i18n('Sharing settings')
    );
  }

  renderUpdateableByBlock() {
    return this.renderSharingSettingBlock(
      'updateSharingSettings',
      i18n('Can edit'),
      PencilIcon
    );
  }

  renderProjectsSelectorBlock() {
    const {
      report, disabled, fetchYouTrack, fetchHub
    } = this.state;

    return (
      <StandardFormGroup
        label={i18n('Projects')}
        noIndentation={true}
      >
        <ReportProjects
          projects={report.projects}
          reportId={(report || {}).id}
          disabled={disabled}
          fetchYouTrack={fetchYouTrack}
          fetchHub={fetchHub}
          onChange={this.getReportEditOperationHandler('projects')}
        />
      </StandardFormGroup>
    );
  }

  renderAuthorsSelectorBlock() {
    const {
      report, disabled, fetchYouTrack
    } = this.state;

    return (
      <StandardFormGroup
        label={i18n('Work author')}
        noIndentation={true}
      >
        <ReportUsers
          projects={report.projects}
          users={report.authors}
          disabled={disabled}
          fetchYouTrack={fetchYouTrack}
          onChange={this.getReportEditOperationHandler('authors')}
        />
      </StandardFormGroup>
    );
  }

  renderWorkTypesSelectorBlock() {
    const {
      report, disabled, fetchYouTrack
    } = this.state;

    return (
      <StandardFormGroup
        label={i18n('Work type')}
        noIndentation={true}
      >
        <ReportWorkTypes
          workTypes={report.workTypes || []}
          projects={report.projects || []}
          disabled={disabled}
          fetchYouTrack={fetchYouTrack}
          onChange={this.getReportEditOperationHandler('workTypes')}
        />
      </StandardFormGroup>
    );
  }

  renderFilterIssuesBlock() {
    const {
      report,
      fetchYouTrack,
      disabled
    } = this.state;

    return (
      <StandardFormGroup label={i18n('Issue filter')}>
        <ReportIssuesFilter
          disabled={disabled}
          query={report.query}
          fetchYouTrack={fetchYouTrack}
          onChange={this.getReportEditOperationHandler('query')}
        />
      </StandardFormGroup>
    );
  }

  render() {
    const {
      report, disabled
    } = this.state;

    return (
      <div className="ring-form">
        {
          !disabled &&
          <div>
            <div className="ring-form__label report-widget__input-label-compensation-hack">
              { i18n('Name') }
            </div>
            <div className="ring-form__control">
              <Input
                size={InputSize.FULL}
                value={report.name}
                placeholder={i18n('Report name')}
                onChange={this.changeReportName}
                compact={true}
              />
            </div>
          </div>
        }
        {this.renderXAxisBlock(report, disabled)}
        {this.renderFilterIssuesBlock()}
        {this.renderProjectsSelectorBlock()}
        {this.renderAuthorsSelectorBlock()}
        {this.renderWorkTypesSelectorBlock()}
        {this.renderPeriodBlock(report.range, disabled)}
        {this.renderGroupByBlock()}
        {this.renderVisibleToBlock()}
        {this.renderUpdateableByBlock()}
      </div>
    );
  }
}

export default TimeTrackingReportForm;
