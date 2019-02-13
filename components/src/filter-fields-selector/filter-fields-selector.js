import React from 'react';
import PropTypes from 'prop-types';
import {RerenderableSelect} from '@jetbrains/ring-ui/components/select/select';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import classNames from 'classnames';
import List from '@jetbrains/ring-ui/components/list/list';
import guid from 'mout/random/guid';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import './filter-fields-selector.scss';

class FilterFieldsSelector extends React.Component {
  static propTypes = {
    projects: PropTypes.array,
    onChange: PropTypes.func,
    filterFieldsSource: PropTypes.func.isRequired,
    selectedField: PropTypes.object,
    canBeEmpty: PropTypes.bool,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string
  };

  static getEmptyOption = emptyText => ({
    key: '-1',
    label: emptyText || i18n('No value'),
    model: null
  });

  static toSelectOption = filterField => (
    filterField &&
    {
      key: filterField.id,
      label: filterField.presentation || filterField.name,
      model: filterField
    }
  );

  static getFilterFieldsOptions = (filterFields, canBeEmpty, emptyText) => {
    const options = filterFields.map(FilterFieldsSelector.toSelectOption);
    if (canBeEmpty) {
      options.unshift({
        rgItemType: List.ListProps.Type.MARGIN,
        key: guid()
      });
      options.unshift(FilterFieldsSelector.getEmptyOption(emptyText));
    }
    return options;
  };

  constructor(props) {
    super(props);

    this.state = {
      projects: props.projects,
      selectedField: props.selectedField,
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
    const filterFields = await this.props.filterFieldsSource(projects);
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
          {
            selectedField
              ? selectedField.presentation
              : (this.props.placeholder || '')
          }
        </span>
      );
    }

    const filterFieldSelect = (
      <RerenderableSelect
        className={classNames({
          'filter-fields-selector': true,
          'filter-fields-selector_empty': !selectedField,
          'filter-fields-selector_error': !currentFieldIsValid
        })}
        data={FilterFieldsSelector.getFilterFieldsOptions(
          filterFields, canBeEmpty, this.props.placeholder
        )}
        selected={FilterFieldsSelector.toSelectOption(selectedField)}
        loading={!filterFields.length}
        onSelect={this.changeFilterField}
        onOpen={this.openFilterFieldsSelector}
        filter={true}
        label={this.props.placeholder || i18n('＋Add field')}
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

export default FilterFieldsSelector;
