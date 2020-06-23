import React from 'react';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Select from '@jetbrains/ring-ui/components/select/select';
import PropTypes from 'prop-types';

import ReportGroupingControl from '../../../../components/src/report-form-controls/report-grouping-control';

const YAxisSelector = (
  {changeXAxis, isIssueView}
) => {
  const userOption = {
    key: 'user',
    label: i18n('Users')
  };

  const issueOption = {
    key: 'issue',
    label: i18n('Issues')
  };

  return (
    <Select
      data={[userOption, issueOption]}
      selected={isIssueView ? issueOption : userOption}
      onSelect={changeXAxis}
      type={Select.Type.INLINE}
    />
  );
};

YAxisSelector.propTypes = {
  changeXAxis: PropTypes.func.isRequired,
  isIssueView: PropTypes.bool
};

const TimeTableSettingsToolbar = (
  {
    grouping, projects, isIssueView, youTrack, dashboardApi,
    onChangeYAxis, onChangeReportGrouping, disabled
  }
) => {
  const fetchYouTrack = (url, args) =>
    dashboardApi.fetch(youTrack.id, url, args);

  const onChange = ({key}) => onChangeYAxis(key);

  return (
    <div>
      <YAxisSelector
        isIssueView={isIssueView}
        changeXAxis={onChange}
      />
      <div className="time-report-widget__legend-group-by">
        <span>{i18n('group by {{field}}', {field: ''})}</span>
        <ReportGroupingControl
          projects={projects}
          onChange={onChangeReportGrouping}
          group={grouping}
          disabled={disabled}
          fetchYouTrack={fetchYouTrack}
        />
      </div>
    </div>
  );
};

TimeTableSettingsToolbar.propTypes = {
  grouping: PropTypes.object,
  projects: PropTypes.array,
  youTrack: PropTypes.object,
  dashboardApi: PropTypes.object,
  onChangeYAxis: PropTypes.func.isRequired,
  onChangeReportGrouping: PropTypes.func.isRequired,
  isIssueView: PropTypes.bool,
  disabled: PropTypes.bool
};

export default TimeTableSettingsToolbar;
