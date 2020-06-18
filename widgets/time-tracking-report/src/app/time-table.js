import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react';
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
  totalSpentTime, detailedGroups, fetchHub, withDetails,
  presentationControlsPanel, homeUrl, onChangeDetailsVisibility
}) => {

  const [activeLineIdx, onActivateLine] = useState(undefined);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const [generalTableWidth, setGeneralTableWidth] = useState(undefined);
  const tableContainer = useRef(null);
  const detailedTableContainer = useRef(null);

  const resetActiveLineIdx = useCallback(
    () => onActivateLine(undefined), []
  );

  const generalTableClasses = classNames('time-sheet-body__general-table', {
    'time-sheet-body__general-table_auto-width': !generalTableWidth && withDetails,
    'time-sheet-body__general-table_expanded': !withDetails
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

  useEffect(() => {
    const detectScroll = () => {
      setHasVerticalScroll(true);
      unbind();
    };
    window.addEventListener('scroll', detectScroll);

    return () => unbind();

    function unbind() {
      window.removeEventListener('scroll', detectScroll);
    }
  }, [tableContainer, withDetails]);

  useEffect(() => {
    const margins = 56;
    const width = window.innerWidth - margins;
    const detailsTableWidth =
      (withDetails && (detailedTableContainer || {}).current)
        ? detailedTableContainer.current.getBoundingClientRect().width
        : 0;
    const newGeneralTableWidth = detailsTableWidth < width
      ? width - detailsTableWidth
      : undefined;
    setGeneralTableWidth(newGeneralTableWidth);
  }, [tableContainer, withDetails, detailedTableContainer]);

  return (
    <div
      className="time-sheet-body__wrapper"
      onMouseLeave={resetActiveLineIdx}
      ref={tableContainer}
    >
      <div
        className={generalTableClasses}
        style={generalTableWidth && {width: generalTableWidth}}
      >
        <TimeTableGeneral
          grouping={grouping}
          homeUrl={homeUrl}
          generalGroups={generalGroups}
          totalSpentTime={totalSpentTime}
          presentationControlsPanel={presentationControlsPanel}
          fetchHub={fetchHub}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          sumOfGroupSizesBeforeCurrentGroup={sumOfGroupSizesBeforeCurrentGroup}
          fixedHeader={hasVerticalScroll}
          width={generalTableWidth}
        />
      </div>
      <SidebarToggler
        onToggleSidebar={onChangeDetailsVisibility}
        visibleSidebar={withDetails}
      />
      {
        withDetails &&
        <TimeTableDetailed
          forwardRef={detailedTableContainer}
          hasGrouping={!!grouping}
          legend={columnsLegend}
          headers={columnsHeader}
          groups={detailedGroups}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          sumOfGroupSizesBeforeCurrentGroup={sumOfGroupSizesBeforeCurrentGroup}
          fixedHeader={hasVerticalScroll}
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
  homeUrl: PropTypes.string,
  withDetails: PropTypes.bool,
  onChangeDetailsVisibility: PropTypes.func.isRequired,
  presentationControlsPanel: PropTypes.node
};


export default TimeTable;
