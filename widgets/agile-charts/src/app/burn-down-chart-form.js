import React from 'react';
import PropTypes from 'prop-types';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import {RerenderableTagsInput} from '@jetbrains/ring-ui/components/tags-input/tags-input';
import {RerenderableSelect} from '@jetbrains/ring-ui/components/select/select';
import {
  PermissionIcon
} from '@jetbrains/ring-ui/components/icon';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import FilterFieldsSelector
  from '../../../../components/src/filter-fields-selector/filter-fields-selector';
import {
  loadProjects,
  loadUserGroups,
  underlineAndSuggest,
  loadReportsAggregationFilterFields
} from '../../../../components/src/resources/resources';

class BurnDownChartForm extends React.Component {
  static propTypes = {
    report: PropTypes.object,
    onValidStateChange: PropTypes.func,
    onReportSettingsChange: PropTypes.func,
    disabled: PropTypes.bool,
    currentUser: PropTypes.object,
    fetchYouTrack: PropTypes.func
  };

  static isNewReport = report => !report.id;

  static checkReportValidity = report =>
    !!report && !!report.name;

  static toProjectTag = project => ({
    key: project.id,
    label: project.name,
    description: project.shortName,
    model: project
  });

  static toVisibilityOption = userGroup => ({
    key: userGroup.id,
    label: userGroup.name,
    icon: userGroup.icon,
    model: userGroup
  });

  static ME_ONLY_VISIBILITY_OPTION = {
    key: '-1',
    label: i18n('Me only'),
    model: null
  };

  static getVisibilityOptions = (userGroups, currentUser) => {
    const visibilityOptions = userGroups.map(
      BurnDownChartForm.toVisibilityOption
    );
    visibilityOptions.unshift(Object.assign({
      icon: currentUser && currentUser.avatar && currentUser.avatar.url
    }, BurnDownChartForm.ME_ONLY_VISIBILITY_OPTION));
    return visibilityOptions;
  };

  constructor(props) {
    super(props);

    this.state = {
      report: props.report,
      disabled: props.disabled,
      fetchYouTrack: props.fetchYouTrack,
      currentUser: props.currentUser,
      userGroups: []
    };
    this.props.onValidStateChange(
      BurnDownChartForm.checkReportValidity(props.report)
    );
  }

  componentWillReceiveProps(props) {
    this.setState({
      disabled: props.disabled,
      currentUser: props.currentUser,
      fetchYouTrack: props.fetchYouTrack
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
  };

  changeVisibility = selected => {
    const {report} = this.state;
    report.visibleTo = selected.model;
    this.onReportEditOperation(report);
  };

  changeAggregationPolicy = selected => {
    const {report} = this.state;
    if (selected) {
      report.customField = {
        id: selected.id,
        name: selected.name
      };
    } else {
      report.customField = null;
    }
    this.onReportEditOperation(report);
  };

  projectsInputDataSource = async tagsInputModel => {
    let {projects} = this.state;
    if (!projects) {
      projects = await loadProjects(this.state.fetchYouTrack);
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
      map(BurnDownChartForm.toProjectTag);
  };

  updateReport(report) {
    this.setState({report});
    const reportIsValid =
      BurnDownChartForm.checkReportValidity(report);
    this.props.onValidStateChange(reportIsValid);
    return reportIsValid;
  }

  onReportEditOperation(report) {
    if (this.updateReport(report)) {
      this.props.onReportSettingsChange(report);
    }
  }

  renderAggregationPolicyBlock() {
    const {report, disabled, fetchYouTrack} = this.state;

    const aggregationFilterFieldsSource = async projects =>
      await loadReportsAggregationFilterFields(fetchYouTrack, projects);

    return (
      <div className="filter-fields-selector-wrapper">
        {
          i18n('Show totals for {{aggregationPolicy}}', {aggregationPolicy: ''})
        }
        <FilterFieldsSelector
          selectedField={report.customField}
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

  renderVisibilityBlock() {
    const {
      report,
      disabled,
      userGroups,
      currentUser
    } = this.state;

    const visibilityPresentation = report.visibleTo
      ? report.visibleTo.name
      : BurnDownChartForm.ME_ONLY_VISIBILITY_OPTION.label;

    const renderVisibilityIcon = () => (
      <Tooltip
        title={
          report.visibleTo
            ? i18n('Report is visible to members of {{visibilityPresentation}}', {visibilityPresentation})
            : i18n('Report is private')
        }
      >
        <PermissionIcon
          className="report-widget__icon"
          color={PermissionIcon.Color.GRAY}
          size={PermissionIcon.Size.Size14}
        />&nbsp;
      </Tooltip>
    );

    if (disabled) {
      return (
        <div className="ring-form__group">
          { renderVisibilityIcon() }
          <span>{ visibilityPresentation }</span>
        </div>
      );
    }

    return (
      <div className="ring-form__group">
        { renderVisibilityIcon() }
        <RerenderableSelect
          data={BurnDownChartForm.getVisibilityOptions(
            userGroups, currentUser
          )}
          label={visibilityPresentation}
          loading={!userGroups.length}
          onSelect={this.changeVisibility}
          onOpen={this.openVisibilitySelector}
          filter={true}
          type={RerenderableSelect.Type.INLINE}
        />
      </div>
    );
  }

  renderProjectsSelectorBlock() {
    const {
      report, disabled
    } = this.state;

    return (
      <RerenderableTagsInput
        disabled={disabled}
        tags={report.projects.map(BurnDownChartForm.toProjectTag)}
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
      return BurnDownChartForm.isNewReport(report)
        ? i18n('New report')
        : i18n('Edit report');
    };

    return (
      <div className="ring-form">
        <span className="ring-form__title">
          { getReportFormTitle() }
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
        {this.renderAggregationPolicyBlock()}
        {
          this.renderFilterIssuesBlock()
        }
        {
          this.renderVisibilityBlock()
        }
      </div>
    );
  }
}

export default BurnDownChartForm;
