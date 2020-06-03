import React, {useCallback, useState, useMemo} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import {DoubleChevronRightIcon} from '@jetbrains/ring-ui/components/icon';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

import TimeTableGeneral from './time-table-general';
import TimeTableDetailed from './time-table-detailed';

const SidebarToggler = ({
  onToggleSidebar, visibleSidebar
}) => {
  const iconClasses = classNames('time-sheet-body__sideber-togger-icon', {
    'time-sheet-body__sideber-togger-icon_expanded': !visibleSidebar
  });

  const onClick = useCallback(
    () => onToggleSidebar(!visibleSidebar),
    [visibleSidebar]
  );

  return (
    <div
      onClick={onClick}
      className="time-sheet-body__sidebar-toggler"
      title={visibleSidebar ? i18n('Hide details') : i18n('Show details')}
    >
      <DoubleChevronRightIcon
        size={DoubleChevronRightIcon.Size.Size14}
        className={iconClasses}
      />
    </div>
  );
};

SidebarToggler.propTypes = {
  onToggleSidebar: PropTypes.func,
  visibleSidebar: PropTypes.bool
};


const TimeTable = ({
  grouping, columnsLegend, columnsHeader, generalGroups,
  totalSpentTime, detailedGroups, fetchHub,
  presentationControlsPanel
}) => {

  const [visibleSidebar, setVisibleSidebar] = useState(true);
  const [activeLineIdx, onActivateLine] = useState(undefined);

  const resetActiveLineIdx = useCallback(
    () => onActivateLine(undefined), []
  );

  const generalTableClasses = classNames('time-sheet-body__general-table', {
    'time-sheet-body__general-table_expanded': !visibleSidebar
  });

  const sumOfGroupSizesBeforeCurrentGroup = useMemo(
    () => (generalGroups || []).
      map(group => (group.childrenLines || []).length).
      reduce(
        (result, groupSize) => {
          result.push(groupSize + result[result.length - 1]);
          return result;
        },
        [0]
      ),
    [generalGroups]
  );

  return (
    <div
      className="time-sheet-body__wrapper"
      onMouseLeave={resetActiveLineIdx}
    >
      <div className={generalTableClasses}>
        <TimeTableGeneral
          grouping={grouping}
          generalGroups={generalGroups}
          totalSpentTime={totalSpentTime}
          presentationControlsPanel={presentationControlsPanel}
          fetchHub={fetchHub}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          sumOfGroupSizesBeforeCurrentGroup={sumOfGroupSizesBeforeCurrentGroup}
        />
      </div>
      <SidebarToggler
        onToggleSidebar={setVisibleSidebar}
        visibleSidebar={visibleSidebar}
      />
      {
        visibleSidebar &&
        <TimeTableDetailed
          hasGrouping={!!grouping}
          legend={columnsLegend}
          headers={columnsHeader}
          groups={detailedGroups}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          sumOfGroupSizesBeforeCurrentGroup={sumOfGroupSizesBeforeCurrentGroup}
        />
      }
    </div>
  );
};

TimeTable.propTypes = {
  grouping: PropTypes.object,
  fetchHub: PropTypes.func,
  generalGroups: PropTypes.array,
  detailedGroups: PropTypes.array,
  columnsLegend: PropTypes.array,
  columnsHeader: PropTypes.array,
  totalSpentTime: PropTypes.object,
  presentationControlsPanel: PropTypes.node
};


export default TimeTable;
