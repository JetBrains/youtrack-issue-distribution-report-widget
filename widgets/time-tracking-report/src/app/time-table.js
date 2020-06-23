import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import {DoubleChevronRightIcon} from '@jetbrains/ring-ui/components/icon';
import throttle from 'mout/function/throttle';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

import TimeTableGeneral from './time-table-general';
import TimeTableDetailed from './time-table-detailed';

const SidebarToggler = ({
  onToggleSidebar, visibleSidebar, ...restProps
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
      {...restProps}
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
  totalSpentTime, detailedGroups, fetchHub, fetchYouTrack, withDetails,
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
    let subscribed = true;

    const calculateWidth = () => {
      const margins = 56;
      const width = window.innerWidth - margins;
      const detailsTableWidth =
        (withDetails && (detailedTableContainer || {}).current)
          ? detailedTableContainer.current.getBoundingClientRect().width
          : 0;
      const newGeneralTableWidth = detailsTableWidth < width
        ? width - detailsTableWidth
        : undefined;

      if (subscribed) {
        setGeneralTableWidth(newGeneralTableWidth);
      }
    };

    const checkScroll = () => {
      const bodyHeight = window.document.body.getBoundingClientRect().height;
      const hasScroll = window.innerHeight < bodyHeight;
      if (subscribed) {
        setHasVerticalScroll(hasScroll);
      }
    };

    const throttleDelay = 100;
    const throttleOnResize = throttle(
      () => {
        if (!withDetails) {
          calculateWidth();
        }
        checkScroll();
      }, throttleDelay
    );

    calculateWidth();
    checkScroll();
    window.addEventListener('resize', throttleOnResize);

    return () => unbind();

    function unbind() {
      subscribed = false;
      window.removeEventListener('scroll', throttleOnResize);
    }
  }, [tableContainer, withDetails, detailedTableContainer]);

  const togglerMargin = 12;
  const sidebarTogglerStyles = (hasVerticalScroll && generalTableWidth) ? {
    position: 'fixed',
    left: generalTableWidth + togglerMargin,
    top: togglerMargin,
    height: window.innerHeight
  } : {};

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
          fetchYouTrack={fetchYouTrack}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          sumOfGroupSizesBeforeCurrentGroup={sumOfGroupSizesBeforeCurrentGroup}
          fixedHeader={hasVerticalScroll}
          width={generalTableWidth}
        />
      </div>
      <SidebarToggler
        style={sidebarTogglerStyles}
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
  fetchYouTrack: PropTypes.func,
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
