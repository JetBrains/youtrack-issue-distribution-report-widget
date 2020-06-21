import React, {useCallback, useMemo, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import DatePicker from '@jetbrains/ring-ui/components/date-picker/date-picker';
import {RerenderableTagsInput} from '@jetbrains/ring-ui/components/tags-input/tags-input';
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
  loadUsers, loadVisibilityUserGroups,
  loadWorkItemTypes
} from '../../../../components/src/resources/resources';
import ReportTimeScales
  from '../../../../components/src/report-model/report-time-scales';
import ReportNamedTimeRanges
  from '../../../../components/src/report-model/report-time-ranges';
import EnumButtonGroup from '../../../../components/src/enum-button-group/enum-button-group';
import ReportGroupingControl from '../../../../components/src/report-form-controls/report-grouping-control';
import StandardFormGroup from '../../../../components/src/report-form-controls/standard-form-group';


//////TODO:::: projectBased=false !!!!!!!!!!!!
import {
  loadProjects,
  underlineAndSuggest
} from './resources';

const ReportIssuesFilter = ({
  query, disabled, fetchYouTrack, onChange
}) => {

  const queryAssistDataSource = useCallback(async model =>
    await underlineAndSuggest(
      fetchYouTrack, model.query, model.caret
    ),
  [fetchYouTrack]
  );

  const onChangeQueryAssistModel = useCallback(
    model => onChange(model.query || ''),
    [onChange]
  );

  return (
    <QueryAssist
      disabled={disabled}
      query={query}
      placeholder={i18n('Query')}
      onChange={onChangeQueryAssistModel}
      dataSource={queryAssistDataSource}
    />
  );
};

ReportIssuesFilter.propTypes = {
  query: PropTypes.string,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

const ReportTagsInput = ({
  options, optionToTag, onChange, ...restProps
}) => {

  const onAddOption = useCallback(({tag}) => {
    if (tag && tag.model) {
      onChange((options || []).concat([tag.model]));
    }
  }, [options]);

  const onRemoveOption = useCallback(({tag}) => {
    if (tag && tag.model) {
      onChange(
        (options || []).filter(option => option.id !== tag.model.id)
      );
    }
  }, [options]);

  return (
    <RerenderableTagsInput
      className="ring-form__group"
      tags={(options || []).map(optionToTag)}
      onAddTag={onAddOption}
      onRemoveTag={onRemoveOption}
      {...restProps}
    />
  );
};

ReportTagsInput.propTypes = {
  options: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  optionToTag: PropTypes.func.isRequired
};


const ReportProjects = ({
  projects, reportId, disabled, fetchYouTrack, fetchHub, onChange
}) => {

  const [loadedProjects, onLoadProjects] = useState([]);

  let subscribed = true;
  useEffect(() => {
    (async function load() {
      const newProjects = await loadProjects(
        fetchYouTrack, fetchHub, {id: reportId}
      );
      if (newProjects && subscribed) {
        onLoadProjects(newProjects);
      }
    }());
    return () => {
      subscribed = false;
    };
  }, [fetchHub, fetchYouTrack, reportId]);


  const getProjectsOptions = useCallback(({query}) => {
    const q = (query || '').toLowerCase();
    return (loadedProjects || []).
      filter(project =>
        !q ||
        (project.name.toLowerCase().indexOf(q) > -1) ||
        (project.shortName.toLowerCase().indexOf(q) === 0)
      ).
      map(toProjectTag);
  }, [loadedProjects]);

  return (
    <ReportTagsInput
      className="ring-form__group"
      disabled={disabled}
      options={projects}
      optionToTag={toProjectTag}
      onChange={onChange}
      placeholder={
        projects.length
          ? (!disabled && i18n('Add project') || '')
          : i18n('All projects')
      }
      maxPopupHeight={250}
      dataSource={getProjectsOptions}
    />
  );

  function toProjectTag(project) {
    return ({
      key: project.id,
      label: project.name,
      description: project.shortName,
      model: project
    });
  }
};

ReportProjects.propTypes = {
  projects: PropTypes.array,
  reportId: PropTypes.string,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  fetchHub: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};


const ReportUsers = ({
  users, projects, disabled, fetchYouTrack, onChange
}) => {
  const getUsersOptions = useCallback(async ({query}) => {
    const projectId = (projects || []).map(project => project.id);
    const newUsers = await loadUsers(fetchYouTrack, {query, projectId});
    return (newUsers || []).map(toUserTag);
  }, [projects]);

  return (
    <ReportTagsInput
      className="ring-form__group"
      disabled={disabled}
      options={users}
      onChange={onChange}
      optionToTag={toUserTag}
      placeholder={
        users.length
          ? (!disabled && i18n('Add user') || '')
          : i18n('All users')
      }
      maxPopupHeight={250}
      dataSource={getUsersOptions}
    />
  );

  function toUserTag(user) {
    return ({
      key: user.id,
      label: user.name,
      description: user.login,
      avatar: user.avatarUrl,
      model: user
    });
  }
};

ReportUsers.propTypes = {
  users: PropTypes.array,
  projects: PropTypes.array,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};


const ReportWorkTypes = ({
  workTypes, projects, disabled, fetchYouTrack, onChange
}) => {
  const getWorkTypesOptions = useCallback(async ({query}) => {
    const projectId = (projects).
      map(project => project.id);
    const loadedWorkTypes = await loadWorkItemTypes(
      fetchYouTrack, {query, projectId}
    );
    return (loadedWorkTypes || []).map(toWorkTypeTag);
  }, [workTypes, projects]);

  return (
    <ReportTagsInput
      className="ring-form__group"
      disabled={disabled}
      options={workTypes}
      onChange={onChange}
      optionToTag={toWorkTypeTag}
      placeholder={
        workTypes.length
          ? (!disabled && i18n('Add work type') || '')
          : i18n('All work types')
      }
      maxPopupHeight={250}
      dataSource={getWorkTypesOptions}
    />
  );

  function toWorkTypeTag(type) {
    return ({
      key: type.id,
      label: type.name,
      model: type
    });
  }
};

ReportWorkTypes.propTypes = {
  workTypes: PropTypes.array,
  projects: PropTypes.array,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};


const ReportPeriod = ({
  period, disabled, onChange
}) => {
  const namedRange = (period || {}).range;

  const ranges = useMemo(() => ReportNamedTimeRanges.allRanges().
    map(range => ({
      id: range.id,
      label: range.text(),
      description:
        (range.id === ReportNamedTimeRanges.fixedRange().id
          ? i18n('Custom dates interval') : undefined)
    })), []);

  const selected = useMemo(() => ranges.filter(range =>
    range.id === (namedRange || ReportNamedTimeRanges.fixedRange()).id
  )[0], [period]);

  const changeRangeSetting = useCallback(({id}) => {
    const newPeriod = getNewPeriod(id, (period || {}).id);
    onChange(newPeriod);

    function getNewPeriod(selectedId, periodId) {
      if (selectedId === ReportNamedTimeRanges.fixedRange().id) {
        return ({
          id: periodId,
          $type: BackendTypes.get().FixedTimeRange,
          ...ReportNamedTimeRanges.fixedRange().getDefaultTimePeriod()
        });
      }

      return ({
        id: periodId,
        $type: BackendTypes.get().NamedTimeRange,
        range: {id: selectedId}
      });
    }
  }, [period, onChange]);

  const setRangeForFixedPeriod = useCallback(({from, to}) => {
    if (period && !period.range) {
      period.from = from.valueOf();
      period.to = to.valueOf();

      onChange(period);
    }
  }, [period, onChange]);

  return (
    <span>
      <Select
        data={ranges}
        selected={selected}
        onSelect={changeRangeSetting}
        disabled={disabled}
        type={Select.Type.INLINE}
        filter={true}
      />
      {
        !namedRange &&
        <span className="time-report-widget__sub-control">
          <DatePicker
            from={period.from}
            to={period.to}
            onChange={setRangeForFixedPeriod}
            range={true}
            disabled={disabled}
          />
        </span>
      }
    </span>
  );
};

ReportPeriod.propTypes = {
  period: PropTypes.object,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};


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

  changeScaleSetting = selected => {
    const {report} = this.state;
    report.scale = {id: selected.id};
    this.onReportEditOperation(report);
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
                onChange={this.changeScaleSetting}
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
