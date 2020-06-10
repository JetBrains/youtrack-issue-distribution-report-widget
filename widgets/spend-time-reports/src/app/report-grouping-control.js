import React, {useCallback} from 'react';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import PropTypes from 'prop-types';

import {loadReportsGroupingFilterFields} from '../../../../components/src/resources/resources';
import FilterFieldsSelector from '../../../../components/src/filter-fields-selector/filter-fields-selector';
import BackendTypes from '../../../../components/src/backend-types/backend-types';

const ReportGroupingControl = ({
  group, projects, disabled, fetchYouTrack, onChange
}) => {

  const filterFieldsSource = async () =>
    await loadReportsGroupingFilterFields(fetchYouTrack, projects);

  const changeGroupBySetting = useCallback(selected => {
    const newGroup = selected ? ({
      $type: BackendTypes.get().FieldBasedGrouping,
      id: selected.id,
      field: selected
    }) : null;
    onChange(newGroup);
  }, [group]);

  return (
    <FilterFieldsSelector
      selectedField={(group || {}).field}
      projects={projects}
      onChange={changeGroupBySetting}
      filterFieldsSource={filterFieldsSource}
      canBeEmpty={true}
      disabled={disabled}
      placeholder={i18n('No grouping')}
    />
  );
};

ReportGroupingControl.propTypes = {
  group: PropTypes.object,
  projects: PropTypes.array,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ReportGroupingControl;
