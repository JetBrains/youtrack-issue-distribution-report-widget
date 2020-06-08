import React from 'react';
import PropTypes from 'prop-types';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import {RerenderableTagsInput} from '@jetbrains/ring-ui/components/tags-input/tags-input';
import {
  InfoIcon,
  EyeIcon,
  PencilIcon
} from '@jetbrains/ring-ui/components/icon';
import Select from '@jetbrains/ring-ui/components/select/select';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import FilterFieldsSelector
  from '../../../../components/src/filter-fields-selector/filter-fields-selector';
import BackendTypes from '../../../../components/src/backend-types/backend-types';
import SharingSetting from
  '../../../../components/src/sharing-setting/sharing-setting';
import {
  loadUsers,
  loadWorkItemTypes
} from '../../../../components/src/resources/resources';
import ReportTimeScales
  from '../../../../components/src/report-model/report-time-scales';
import ReportNamedTimeRanges
  from '../../../../components/src/report-model/report-named-time-ranges';
import EnumButtonGroup from '../../../../components/src/enum-button-group/enum-button-group';

import {
  loadProjects,
  loadUserGroups,
  underlineAndSuggest,
  loadReportsFilterFields,
  loadReportsAggregationFilterFields
} from './resources';

class SpendTimeReportForm extends React.Component {
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

  static canShowSecondaryAxisOption = report =>
    SpendTimeReportForm.isNewReport(report) ||
    report.$type === BackendTypes.get().MatrixReport;

  static convertOneFieldReportToTwoFieldsReportIfNeeded = report => {
    if (report.$type === BackendTypes.get().MatrixReport) {
      return report;
    }
    report.$type = BackendTypes.get().MatrixReport;
    report.yaxis = {field: report.xaxis.field};
    report.xaxis.$type = undefined;
    report.ysortOrder = report.xsortOrder;
    report.presentation = 'DEFAULT';
    return report;
  };

  static convertTwoFieldsReportToOneFieldReportIfNeeded = report => {
    if (report.$type !== BackendTypes.get().MatrixReport) {
      return report;
    }
    report.$type = BackendTypes.get().FlatDistributionReport;
    report.xaxis = {field: (report.yaxis || {}).field};
    report.yaxis = undefined;
    report.ysortOrder = undefined;
    report.presentation = 'DEFAULT';
    return report;
  };

  static checkReportValidity = report =>
    !!report && !!report.name;

  static toTag = (
    item,
    getLabel = (it => it.name),
    getDescription = (() => undefined)
  ) => ({
    key: item.id,
    label: getLabel(item),
    description: getDescription(item),
    model: item
  });

  static toProjectTag = project =>
    SpendTimeReportForm.toTag(
      project,
      it => it.name,
      it => it.shortName
    );

  static toUserTag = user => ({
    ...SpendTimeReportForm.toTag(
      user,
      it => it.name,
      it => it.login
    ),
    ...{avatar: user.avatarUrl}
  });

  static toWorkTypeTag = item => SpendTimeReportForm.toTag(item);

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
      SpendTimeReportForm.checkReportValidity(props.report)
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

  onAddProjectToReport = evt => {
    if (evt.tag && evt.tag.model) {
      const {report} = this.state;
      report.projects = (report.projects || []).concat([evt.tag.model]);
      this.onReportEditOperation(report);
    }
  };

  onRemoveProjectFromReport = evt => {
    if (evt.tag && evt.tag.model) {
      const {report} = this.state;
      report.projects = report.projects.
        filter(project => project.id !== evt.tag.model.id);
      this.onReportEditOperation(report);
    }
  };

  onAddAuthorToReport = evt => {
    if (evt.tag && evt.tag.model) {
      const {report} = this.state;
      report.authors = (report.authors || []).concat([evt.tag.model]);
      this.onReportEditOperation(report);
    }
  };

  onRemoveAuthorFromReport = evt => {
    if (evt.tag && evt.tag.model) {
      const {report} = this.state;
      report.authors = report.authors.
        filter(user => user.id !== evt.tag.model.id);
      this.onReportEditOperation(report);
    }
  };

  onAddWorkTypeToReport = evt => {
    if (evt.tag && evt.tag.model) {
      const {report} = this.state;
      report.workTypes = (report.workTypes || []).concat([evt.tag.model]);
      this.onReportEditOperation(report);
    }
  };

  onRemoveWorkTypeFromReport = evt => {
    if (evt.tag && evt.tag.model) {
      const {report} = this.state;
      report.workTypes = report.workTypes.
        filter(user => user.id !== evt.tag.model.id);
      this.onReportEditOperation(report);
    }
  };

  onReportQueryChange = evt => {
    const {report} = this.state;
    report.query = evt.query;
    this.onReportEditOperation(report);
  };

  getSharingSettingsOptions = async (query = '') => {
    const {report, currentUser, fetchYouTrack} = this.state;

    const groups = await loadUserGroups(fetchYouTrack, {query});

    const projectId = ((report || {}).projects || []).
      map(project => project.id);
    const users = await loadUsers(fetchYouTrack, {
      query, permissionId: 'JetBrains.YouTrack.READ_REPORT', projectId
    });

    return {groups, users, currentUser};
  };

  changeSharingSettings = (settingName, options) => {
    const {report} = this.state;
    report[settingName] = {
      permittedUsers: (options || []).
        filter(option => option.$type === 'User'),
      permittedGroups: (options || []).
        filter(option => option.$type === 'UserGroup')
    };
    this.onReportEditOperation(report);
  };

  changeReadSharingSettings = options => {
    this.changeSharingSettings('readSharingSettings', options);
  };

  changeUpdateSharingSettings = options => {
    this.changeSharingSettings('updateSharingSettings', options);
  };

  changeGroupBySetting = selected => {
    const {report} = this.state;
    report.grouping = report.grouping || {};
    report.grouping.field = selected;
    this.onReportEditOperation(report);
  };

  changeScaleSetting = selected => {
    const {report} = this.state;
    report.scale = {id: selected.id};
    this.onReportEditOperation(report);
  };

  changeRangeSetting = selected => {
    const {report} = this.state;
    report.range = report.range || {};
    report.range.range = {id: selected.id};
    this.onReportEditOperation(report);
  };

  changeAggregationPolicy = selected => {
    const {report} = this.state;
    if (selected) {
      report.aggregationPolicy = report.aggregationPolicy || {};
      report.aggregationPolicy.field = selected;
    } else {
      report.aggregationPolicy = null;
    }
    this.onReportEditOperation(report);
  };

  projectsInputDataSource = async tagsInputModel => {
    let {projects} = this.state;
    if (!projects) {
      projects = await loadProjects(this.state.fetchYouTrack,
        this.state.fetchHub,
        this.state.report);
      if (projects) {
        this.setState({projects});
      }
    }

    const query = ((tagsInputModel && tagsInputModel.query) || '').
      toLowerCase();
    return (projects || []).
      filter(project =>
        !query ||
        (project.name.toLowerCase().indexOf(query) > -1) ||
        (project.shortName.toLowerCase().indexOf(query) === 0)
      ).
      map(SpendTimeReportForm.toProjectTag);
  };

  authorsInputDataSource = async ({query}) => {
    const {report, fetchYouTrack} = this.state;

    const projectId = ((report || {}).projects || []).
      map(project => project.id);
    const users = await loadUsers(fetchYouTrack, {query, projectId});

    return (users || []).map(SpendTimeReportForm.toUserTag);
  };

  workTypesInputDataSource = async ({query}) => {
    const {report, fetchYouTrack} = this.state;

    const projectId = ((report || {}).projects || []).
      map(project => project.id);
    const workTypes = await loadWorkItemTypes(
      fetchYouTrack, {query, projectId}
    );
    return (workTypes || []).map(SpendTimeReportForm.toWorkTypeTag);
  };

  updateReport(report) {
    this.setState({report});
    const reportIsValid =
      SpendTimeReportForm.checkReportValidity(report);
    this.props.onValidStateChange(reportIsValid);
    return reportIsValid;
  }

  onReportEditOperation(report) {
    if (this.updateReport(report)) {
      this.props.onReportSettingsChange(report);
    }
  }

  renderIssueDistributionFieldsEditableSelectors() {
    const {report, fetchYouTrack, disabled} = this.state;

    const filterFieldsSource = async projects =>
      await loadReportsFilterFields(fetchYouTrack, projects);

    return (
      <div className="ring-form__group">
        <span className="ring-form__label">
          { i18n('Group by {{field}}', {field: ''}) }
        </span>
        <div className="ring-form__control">
          <FilterFieldsSelector
            selectedField={(report.grouping || {}).field}
            projects={report.projects}
            onChange={this.changeGroupBySetting}
            filterFieldsSource={filterFieldsSource}
            canBeEmpty={true}
            disabled={disabled}
            placeholder={i18n('No grouping')}
          />
        </div>
      </div>
    );
  }

  renderIssueDistributionFieldsReadonlyLabels() {
    const {report} = this.state;
    const grouppingPresentation = report.groupping
      ? report.groupping.field.name
      : i18n('Not set');

    return (
      <div className="time-report-widget__filter-fields">
        { i18n('Group by {{mainFieldPresentation}}', {grouppingPresentation}) }
      </div>
    );
  }

  renderScaleBlock(reportScale, disabled) {
    const scales = Object.keys(ReportTimeScales).
      map(key => ({
        id: ReportTimeScales[key].id,
        label: ReportTimeScales[key].text()
      }));

    return (
      <div className="ring-form__group">
        <div className="ring-form__label">
          {i18n('Scale')}
        </div>
        <div className="ring-form__control">
          <EnumButtonGroup
            values={scales}
            selected={reportScale}
            onChange={this.changeScaleSetting}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  renderPeriodBlock(reportRange, disabled) {
    const ranges = ReportNamedTimeRanges.allRanges().
      map(range => ({
        id: range.id,
        label: range.text()
      }));

    const selected = ranges.filter(
      range => range.id === (reportRange || {}).id
    )[0];

    return (
      <div className="ring-form__group">
        <div className="ring-form__label">
          {i18n('Period')}
        </div>
        <div className="ring-form__control">
          <Select
            data={ranges}
            selected={selected}
            onSelect={this.changeRangeSetting}
            disabled={disabled}
            type={Select.Type.INLINE}
            filter={true}
          />
        </div>
      </div>
    );
  }

  renderGroupByBlock() {
    const {
      disabled
    } = this.state;

    return disabled
      ? this.renderIssueDistributionFieldsReadonlyLabels()
      : this.renderIssueDistributionFieldsEditableSelectors();
  }

  renderAggregationPolicyBlock() {
    const {report, disabled, fetchYouTrack} = this.state;

    const aggregationFilterFieldsSource = async projects =>
      await loadReportsAggregationFilterFields(fetchYouTrack, projects);

    return (
      <div className="time-report-widget__filter-fields">
        {
          i18n('Show totals for {{aggregationPolicy}}', {aggregationPolicy: ''})
        }
        <FilterFieldsSelector
          selectedField={(report.aggregationPolicy || {}).field}
          projects={report.projects}
          onChange={this.changeAggregationPolicy}
          filterFieldsSource={aggregationFilterFieldsSource}
          canBeEmpty={true}
          placeholder={i18n('Issues')}
          disabled={disabled}
        />
      </div>
    );
  }

  renderSharingSettingBlock(settingName, label, IconElement, onChange, title) {
    const {
      disabled,
      report
    } = this.state;

    const sharingSetting = report && report[settingName] || {};
    const selectedOptions = [
      ...(sharingSetting.permittedUsers || []),
      ...(sharingSetting.permittedGroups || [])
    ];
    const reportOwner = SpendTimeReportForm.getReportOwner(
      report, this.props.currentUser
    );

    return (
      <div className="ring-form__group">
        {
          !!title &&
          <div className="ring-form__label">{title}</div>
        }
        <div className="ring-form__control">
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
            selected={selectedOptions}
            onChange={onChange}
            disabled={disabled}
            implicitSelected={[reportOwner]}
          />
        </div>
      </div>
    );
  }

  renderVisibleToBlock() {
    return this.renderSharingSettingBlock(
      'readSharingSettings',
      i18n('Can view and use'),
      EyeIcon,
      this.changeReadSharingSettings,
      i18n('Sharing settings')
    );
  }

  renderUpdateableByBlock() {
    return this.renderSharingSettingBlock(
      'updateSharingSettings',
      i18n('Can edit'),
      PencilIcon,
      this.changeUpdateSharingSettings
    );
  }

  renderProjectsSelectorBlock() {
    const {
      report, disabled
    } = this.state;

    return (
      <div>
        <div className="ring-form__label">
          { i18n('Projects') }
        </div>
        <div className="ring-form__control">
          <RerenderableTagsInput
            className="ring-form__group"
            disabled={disabled}
            tags={report.projects.map(SpendTimeReportForm.toProjectTag)}
            placeholder={
              report.projects.length
                ? (!disabled && i18n('Add project') || '')
                : i18n('All projects')
            }
            maxPopupHeight={250}
            dataSource={this.projectsInputDataSource}
            onAddTag={this.onAddProjectToReport}
            onRemoveTag={this.onRemoveProjectFromReport}
          />
        </div>
      </div>
    );
  }

  renderAuthorsSelectorBlock() {
    const {
      report, disabled
    } = this.state;

    return (
      <div>
        <div className="ring-form__label">
          { i18n('Work author') }
        </div>
        <div className="ring-form__control">
          <RerenderableTagsInput
            className="ring-form__group"
            disabled={disabled}
            tags={report.authors.map(SpendTimeReportForm.toUserTag)}
            placeholder={
              report.authors.length
                ? (!disabled && i18n('Add user') || '')
                : i18n('All users')
            }
            maxPopupHeight={250}
            dataSource={this.authorsInputDataSource}
            onAddTag={this.onAddAuthorToReport}
            onRemoveTag={this.onRemoveAuthorFromReport}
          />
        </div>
      </div>
    );
  }

  renderWorkTypesSelectorBlock() {
    const {
      report, disabled
    } = this.state;

    return (
      <div>
        <div className="ring-form__label">
          {i18n('Work type')}
        </div>
        <div className="ring-form__control">
          <RerenderableTagsInput
            className="ring-form__group"
            disabled={disabled}
            tags={report.workTypes.map(SpendTimeReportForm.toWorkTypeTag)}
            placeholder={
              report.workTypes.length
                ? (!disabled && i18n('Add work type') || '')
                : i18n('All work types')
            }
            maxPopupHeight={250}
            dataSource={this.workTypesInputDataSource}
            onAddTag={this.onAddWorkTypeToReport}
            onRemoveTag={this.onRemoveWorkTypeFromReport}
          />
        </div>
      </div>
    );
  }

  renderFilterIssuesBlock() {
    const {
      report,
      fetchYouTrack,
      disabled
    } = this.state;

    const queryAssistDataSource = async queryAssistModel =>
      await underlineAndSuggest(
        fetchYouTrack, queryAssistModel.query, queryAssistModel.caret
      );

    return (
      <div className="ring-form__group">
        <div className="ring-form__label">
          {i18n('Issue filter')}
        </div>
        <div className="ring-form__control">
          <QueryAssist
            disabled={disabled}
            query={report.query}
            placeholder={i18n('Query')}
            onChange={this.onReportQueryChange}
            dataSource={queryAssistDataSource}
          />
        </div>
      </div>
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
        {this.renderFilterIssuesBlock()}
        {this.renderProjectsSelectorBlock()}
        {this.renderAuthorsSelectorBlock()}
        {this.renderWorkTypesSelectorBlock()}
        {!!report.scale && this.renderScaleBlock(report.scale, disabled)}
        {this.renderPeriodBlock((report.range || {}).range, disabled)}
        {this.renderGroupByBlock()}
        {this.renderVisibleToBlock()}
        {this.renderUpdateableByBlock()}
      </div>
    );
  }
}

export default SpendTimeReportForm;
