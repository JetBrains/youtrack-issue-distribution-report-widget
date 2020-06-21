import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  loadWorkItemTypes
} from '../resources/resources';

import ReportTagsInput from './report-tags-input';

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


export default ReportWorkTypes;
