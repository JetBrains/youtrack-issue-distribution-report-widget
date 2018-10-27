import React from 'react';
import PropTypes from 'prop-types';
import {RerenderableSelect} from '@jetbrains/ring-ui/components/select/select';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import classNames from 'classnames';
import List from '@jetbrains/ring-ui/components/list/list';
import guid from 'mout/random/guid';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {loadReportsFilterFields} from './resources';

class ReportFilterFieldsSelector extends React.Component {
  static propTypes = {
    projects: PropTypes.array,
    onChange: PropTypes.func,
    fetchYouTrack: PropTypes.func,
    selectedField: PropTypes.object,
    canBeEmpty: PropTypes.bool,
    disabled: PropTypes.bool
  };

  static EMPTY_OPTION = {
    key: '-1',
    label: i18n('No value'),
    model: null
  };

  static toSelectOption = filterField => (
    filterField &&
    {
      key: filterField.id,
      label: filterField.presentation,
      model: filterField
    }
  );

  static getFilterFieldsOptions = (filterFields, canBeEmpty) => {
    const options = filterFields.map(ReportFilterFieldsSelector.toSelectOption);
    if (canBeEmpty) {
      options.unshift({
        rgItemType: List.ListProps.Type.MARGIN,
        key: guid()
      });
      options.unshift(ReportFilterFieldsSelector.EMPTY_OPTION);
    }
    return options;
  };

  constructor(props) {
    super(props);

    this.state = {
      projects: props.projects,
      selectedField: props.selectedField,
      fetchYouTrack: props.fetchYouTrack,
      disabled: props.disabled,
      canBeEmpty: props.canBeEmpty,
      currentFieldIsValid: true,
      filterFields: []
    };
  }

  componentDidMount() {
    this.loadFilterFields(this.state.projects);
  }

  componentWillReceiveProps(props) {
    const projectsAreChanged =
      (props.projects || []).length !== (this.state.projects || []).length;
    const selectedFieldIsChanged =
      (props.selectedField || {}).id !== (this.state.selectedField || []).id;

    this.setState({
      projects: props.projects,
      selectedField: props.selectedField,
      canBeEmpty: props.canBeEmpty,
      disabled: props.disabled
    }, async () => {
      if (projectsAreChanged || selectedFieldIsChanged) {
        await this.loadFilterFields(props.projects);
      }
    });
  }

  loadFilterFields = async projects => {
    const filterFields = await loadReportsFilterFields(
      this.state.fetchYouTrack, projects
    );
    const {selectedField} = this.state;
    const currentFieldIsValid = selectedField
      ? (filterFields || []).some(
        field => field.id === selectedField.id
      ) : true;
    this.setState({filterFields, currentFieldIsValid});
  };

  openFilterFieldsSelector = async () => {
    if (!this.state.filterFields.length) {
      await this.loadFilterFields(this.state.projects);
    }
  };

  changeFilterField = selected => {
    const selectedField = selected.model;
    if ((selectedField || {}).id !== (this.state.selectedField || {}).id) {
      this.props.onChange(selectedField);
      this.setState({selectedField});
    }
  };

  render() {
    const {
      filterFields,
      disabled,
      canBeEmpty,
      selectedField,
      currentFieldIsValid
    } = this.state;

    if (disabled) {
      return (
        <span>
          { selectedField ? selectedField.presentation : '' }
        </span>
      );
    }

    const filterFieldSelect = (
      <RerenderableSelect
        className={classNames({
          'distribution-reports-widget__action': !selectedField,
          'distribution-reports-widget__filter-field-presentation': true,
          'distribution-reports-widget__filter-field-presentation_error': !currentFieldIsValid
        })}
        data={ReportFilterFieldsSelector.getFilterFieldsOptions(
          filterFields, canBeEmpty
        )}
        selected={ReportFilterFieldsSelector.toSelectOption(selectedField)}
        loading={!filterFields.length}
        onSelect={this.changeFilterField}
        onOpen={this.openFilterFieldsSelector}
        filter={true}
        label={'＋Add field'}
        type={RerenderableSelect.Type.INLINE}
      />
    );

    if (currentFieldIsValid) {
      return filterFieldSelect;
    }

    return (
      <Tooltip
        title={
          i18n('This field does not exist in some of the selected projects')
        }
      >
        {filterFieldSelect}
      </Tooltip>
    );
  }
}

export default ReportFilterFieldsSelector;
