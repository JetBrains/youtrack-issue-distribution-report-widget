import React from 'react';
import PropTypes from 'prop-types';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import Link from '@jetbrains/ring-ui/components/link/link';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import {RerenderableTagsInput} from '@jetbrains/ring-ui/components/tags-input/tags-input';
import {
  InfoIcon,
  CompareIcon,
  EyeIcon,
  PencilIcon
} from '@jetbrains/ring-ui/components/icon';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import FilterFieldsSelector
  from '../../../../components/src/filter-fields-selector/filter-fields-selector';
import BackendTypes from '../../../../components/src/backend-types/backend-types';
import SharingSetting from
  '../../../../components/src/sharing-setting/sharing-setting';
import {loadUsers} from '../../../../components/src/resources/resources';

import {
  loadProjects,
  loadUserGroups,
  underlineAndSuggest,
  loadReportsFilterFields,
  loadReportsAggregationFilterFields
} from './resources';
import {
  getReportTypeExampleLink,
  isTypeWithEditableXAxis
} from './distribution-report-types';
import DistributionReportAxises from './distribution-report-axises';

class DistributionReportForm extends React.Component {
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

  static canShowSecondaryAxisOption = report =>
    DistributionReportForm.isNewReport(report) ||
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

  static toProjectTag = project => ({
    key: project.id,
    label: project.name,
    description: project.shortName,
    model: project
  });

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
      DistributionReportForm.checkReportValidity(props.report)
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

  onReportQueryChange = evt => {
    const {report} = this.state;
    report.query = evt.query;
    this.onReportEditOperation(report);
  };

  openVisibilitySelector = async () => {
    if (!this.state.userGroups.length) {
      const userGroups = await loadUserGroups(this.state.fetchYouTrack);
      this.setState({userGroups});
    }
    if (!this.state.users.length) {
      const users = await loadUsers(this.state.fetchYouTrack, {});
      this.setState({users});
    }
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

  changeMainFilterField = selected => {
    const {report} = this.state;
    const mainAxis = DistributionReportAxises.getMainAxis(report);
    mainAxis.field = selected;
    this.onReportEditOperation(report);
  };

  changeSplittingBarsFilterField = selected => {
    const {report} = this.state;
    if (selected) {
      DistributionReportForm.
        convertOneFieldReportToTwoFieldsReportIfNeeded(report);
      DistributionReportAxises.getSecondaryAxis(report).field = selected;
    } else {
      DistributionReportForm.
        convertTwoFieldsReportToOneFieldReportIfNeeded(report);
    }
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

  changeAxisPlaces = () => {
    const {report} = this.state;
    if (!report.xaxis || !report.yaxis) {
      return;
    }
    const xaxisFieldBuff = report.xaxis.field;
    report.xaxis.field = report.yaxis.field;
    report.yaxis.field = xaxisFieldBuff;
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
      map(DistributionReportForm.toProjectTag);
  };

  updateReport(report) {
    this.setState({report});
    const reportIsValid =
      DistributionReportForm.checkReportValidity(report);
    this.props.onValidStateChange(reportIsValid);
    return reportIsValid;
  }

  onReportEditOperation(report) {
    if (this.updateReport(report)) {
      this.props.onReportSettingsChange(report);
    }
  }

  renderIssueDistributionFieldsEditableSelectors() {
    const {report, fetchYouTrack} = this.state;

    const filterFieldsSource = async projects =>
      await loadReportsFilterFields(fetchYouTrack, projects);

    return (
      <div className="distribution-reports-widget__filter-fields">
        <span className="distribution-reports-widget__filter-field-title">
          {
            i18n('Show distribution by {{field}}', {field: ''})
          }
        </span><wbr/>
        <span className="distribution-reports-widget__filter-field-controls">
          <span className="distribution-reports-widget__filter-field-selector">
            {
              report.yaxis &&
              <span className="distribution-reports-widget__axis-label">
                {'↓'}
              </span>
            }
            <FilterFieldsSelector
              selectedField={
                DistributionReportAxises.getMainAxis(report).field
              }
              projects={report.projects}
              onChange={this.changeMainFilterField}
              filterFieldsSource={filterFieldsSource}
              canBeEmpty={false}
            />
          </span>
          {
            report.yaxis &&
            <CompareIcon
              className="distribution-reports-widget__icon distribution-reports-widget__icon_btn distribution-reports-widget__transpose-icon"
              onClick={this.changeAxisPlaces}
              color={CompareIcon.Color.GRAY}
              size={CompareIcon.Size.Size16}
            />
          }
          {
            DistributionReportForm.canShowSecondaryAxisOption(report) &&
            <span className="distribution-reports-widget__filter-field-selector">
              <span className="distribution-reports-widget__axis-label">
                {report.yaxis ? '→' : ''}
              </span>
              <FilterFieldsSelector
                selectedField={
                  report.yaxis
                    ? DistributionReportAxises.
                      getSecondaryAxis(report).field
                    : undefined
                }
                projects={report.projects}
                onChange={this.changeSplittingBarsFilterField}
                filterFieldsSource={filterFieldsSource}
                canBeEmpty={DistributionReportForm.isNewReport(report)}
              />
            </span>
          }
        </span>
      </div>
    );
  }

  renderIssueDistributionFieldsReadonlyLabels() {
    const {report} = this.state;

    const mainFieldPresentation =
      DistributionReportAxises.getMainAxisPresentation(report);
    const secondaryFieldPresentation =
      DistributionReportAxises.getSecondaryAxisPresentation(report);

    return (
      <div className="distribution-reports-widget__filter-fields">
        {
          report.yaxis
            ? i18n('Show distribution by {{mainFieldPresentation}} and {{secondaryFieldPresentation}}', {mainFieldPresentation, secondaryFieldPresentation})
            : i18n('Show distribution by {{mainFieldPresentation}}', {mainFieldPresentation})
        }
      </div>
    );
  }

  renderIssueDistributionFieldsBlock() {
    const {
      report,
      disabled
    } = this.state;

    if (!disabled && isTypeWithEditableXAxis(report)) {
      return this.renderIssueDistributionFieldsEditableSelectors();
    }
    return this.renderIssueDistributionFieldsReadonlyLabels();
  }

  renderAggregationPolicyBlock() {
    const {report, disabled, fetchYouTrack} = this.state;

    const aggregationFilterFieldsSource = async projects =>
      await loadReportsAggregationFilterFields(fetchYouTrack, projects);

    return (
      <div className="distribution-reports-widget__filter-fields">
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

  renderSharingSettingBlock(settingName, label, IconElement, onChange) {
    const {
      disabled,
      report
    } = this.state;

    const sharingSetting = report && report[settingName] || {};
    const selectedOptions = [
      ...(sharingSetting.permittedUsers || []),
      ...(sharingSetting.permittedGroups || [])
    ];
    const reportOwner = report && report.owner || this.props.currentUser;

    return (
      <div className="ring-form__group">
        <IconElement
          className="distribution-reports-widget__icon distribution-reports-widget__label"
          color={InfoIcon.Color.GRAY}
          size={InfoIcon.Size.Size14}
        />
        <span className="distribution-reports-widget__label">
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
    );
  }

  renderVisibleToBlock() {
    return this.renderSharingSettingBlock(
      'readSharingSettings',
      i18n('Can view and use'),
      EyeIcon,
      this.changeReadSharingSettings
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
      <RerenderableTagsInput
        disabled={disabled}
        tags={report.projects.map(DistributionReportForm.toProjectTag)}
        placeholder={
          report.projects.length
            ? (!disabled && i18n('Add project') || '')
            : i18n('Calculate for all projects')
        }
        maxPopupHeight={250}
        dataSource={this.projectsInputDataSource}
        onAddTag={this.onAddProjectToReport}
        onRemoveTag={this.onRemoveProjectFromReport}
      />
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
        <QueryAssist
          disabled={disabled}
          query={report.query}
          placeholder={i18n('Filter issues')}
          onChange={this.onReportQueryChange}
          dataSource={queryAssistDataSource}
        />
      </div>
    );
  }

  render() {
    const {
      report, disabled
    } = this.state;

    const getReportFormTitle = () => {
      if (disabled) {
        return `${i18n('Report')} ${report.name}`;
      }
      return DistributionReportForm.isNewReport(report)
        ? i18n('New report')
        : i18n('Edit report');
    };

    return (
      <div className="ring-form distribution-reports-widget__distribution-report-form">
        <span className="ring-form__title">
          { getReportFormTitle() }
          <span>
            <Tooltip title={i18n('Learn more about this report')}>
              &nbsp;&nbsp;
              <Link
                href={getReportTypeExampleLink(report)}
                target="_blank"
              >
                <InfoIcon
                  className="distribution-reports-widget__icon"
                  color={InfoIcon.Color.GRAY}
                  size={InfoIcon.Size.Size14}
                />
              </Link>
            </Tooltip>
          </span>
        </span>
        {
          !disabled &&
          <Input
            size={InputSize.FULL}
            value={report.name}
            placeholder={i18n('Report name')}
            onChange={this.changeReportName}
          />
        }
        {this.renderProjectsSelectorBlock()}
        {this.renderIssueDistributionFieldsBlock()}
        {this.renderAggregationPolicyBlock()}
        {this.renderFilterIssuesBlock()}
        {this.renderVisibleToBlock()}
        {this.renderUpdateableByBlock()}
      </div>
    );
  }
}

export default DistributionReportForm;
