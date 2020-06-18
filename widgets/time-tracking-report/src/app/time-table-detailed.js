import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import throttle from 'mout/function/throttle';

import SpentTimeValue from '../../../../components/src/spent-time-value/spent-time-value';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

const TimeTableDetailedGroupLine = ({
  cells, headers, isGroupTitle
}) => {
  const getCellClasses = idx => classNames(
    'yt-table__cell yt-table__cell_time-sheet-value',
    {
      'yt-table__cell_header_holiday': headers[idx].hasHighlight,
      'yt-table__cell_right-border': headers[idx].hasRightSeparator
    }
  );

  return (cells || []).map((cell, idx) => (
    <td
      key={`data-line-cell-${headers[idx].id}`}
      className={getCellClasses(idx)}
    >
      <SpentTimeValue
        value={cell}
        showZero={isGroupTitle ? headers[idx].showZero : false}
      />
    </td>
  ));
};


TimeTableDetailedGroupLine.propTypes = {
  cells: PropTypes.array.isRequired,
  headers: PropTypes.array.isRequired,
  isSubTitle: PropTypes.bool
};


const TimeTableDetailedHeader = (
  {legend, headers, left, fixed, hidden}
) => {

  const getTitleClasses = columnHeader => classNames(
    'yt-table__cell yt-table__cell_header yt-table__cell_header_workday',
    {
      'yt-table__cell_header_holiday': columnHeader.hasHighlight,
      'yt-table__cell_right-border': columnHeader.hasRightSeparator
    }
  );

  const style = fixed ? {left, zIndex: 0} : {};
  const classes = classNames('time-sheet-body-detailed__header', {
    'time-sheet-body-detailed__header_fixed': fixed,
    'time-sheet-body-detailed__header_hidden': hidden
  });

  return (
    <thead
      className={classes}
      style={style}
    >
      <tr className="yt-table__row yt-table__row-data">
        {
          legend.map(({legendText, startColumnIdx, colSpan}) => (
            <th
              className="yt-table__cell yt-table__cell_header yt-table__cell_header_legend"
              colSpan={colSpan}
              key={`header-legend-${startColumnIdx}`}
            >
              <div className="header-legend">{legendText}</div>
            </th>
          ))
        }
      </tr>
      <tr className="yt-table__row yt-table__row-data">
        {
          headers.map((columnHeader, idx) => (
            <th
              key={`header-title-${columnHeader.id}`}
              className={getTitleClasses(columnHeader, idx)}
            >
              <span className="header-date-title">
                {columnHeader.text}
              </span>
            </th>
          ))
        }
      </tr>
      <tr className="yt-table__row yt-table__total yt-table__row-data">
        {
          headers.map((columnHeader, idx) => (
            <td
              className={getTitleClasses(columnHeader, idx)}
              key={`header-spent-time-${columnHeader.id}`}
            >
              <strong>
                <SpentTimeValue
                  value={columnHeader.spentTime}
                  showZero={columnHeader.showZero}
                />
              </strong>
            </td>
          ))
        }
      </tr>
    </thead>
  );
};

TimeTableDetailedHeader.propTypes = {
  legend: PropTypes.array.isRequired,
  headers: PropTypes.array.isRequired,
  fixed: PropTypes.bool,
  hidden: PropTypes.bool,
  left: PropTypes.number
};

const TimeTableDetailedRow = ({
  cells, headers, activeLineIdx, onActivateLine, lineIdx, isGroupTitle
}) => {
  const activateLine = useCallback(
    () => onActivateLine(lineIdx), [lineIdx]
  );

  return (
    <tr
      className={classNames(
        'yt-table__row', {
          'yt-table__row_hovered': activeLineIdx === lineIdx,
          'yt-table__row-data': !isGroupTitle
        }
      )}
      data={`see-this-key-${lineIdx}`}
      onMouseEnter={activateLine}
    >
      <TimeTableDetailedGroupLine
        cells={cells}
        headers={headers}
        isGroupTitle={isGroupTitle}
      />
    </tr>
  );
};

TimeTableDetailedRow.propTypes = {
  cells: PropTypes.array.isRequired,
  headers: PropTypes.array.isRequired,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func.isRequired,
  lineIdx: PropTypes.number,
  isGroupTitle: PropTypes.bool
};


const TimeTableDetailedBody = ({
  groups, hasGrouping, headers, activeLineIdx,
  onActivateLine, sumOfGroupSizesBeforeCurrentGroup
}) => {
  const getGroupClassNames = idx =>
    classNames(
      'yt-table__group',
      'time-sheet-body-detailed__body',
      {'yt-table__group_not-bordered': !idx}
    );

  const getGroupStartIdx = groupIdx => (
    hasGrouping
      ? (sumOfGroupSizesBeforeCurrentGroup[groupIdx] + groupIdx)
      : sumOfGroupSizesBeforeCurrentGroup[groupIdx]
  );

  return (
    groups.map((group, groupIdx) => (
      <tbody
        className={getGroupClassNames(groupIdx)}
        key={`detailed-table-group-${group.id}`}
      >
        {
          hasGrouping &&
          <TimeTableDetailedRow
            cells={group.line || []}
            headers={headers}
            isGroupTitle={true}
            lineIdx={getGroupStartIdx(groupIdx)}
            activeLineIdx={activeLineIdx}
            onActivateLine={onActivateLine}
          />
        }
        {
          (group.childrenLines || []).map((line, childIdx) => (
            <TimeTableDetailedRow
              key={`data-line-${getGroupStartIdx(groupIdx) + childIdx}`}
              cells={line.cells}
              headers={headers}
              lineIdx={(
                hasGrouping
                  ? (getGroupStartIdx(groupIdx) + childIdx + 1)
                  : (getGroupStartIdx(groupIdx) + childIdx)
              )}
              activeLineIdx={activeLineIdx}
              onActivateLine={onActivateLine}
            />
          ))
        }
      </tbody>
    ))
  );
};

TimeTableDetailedBody.propTypes = {
  groups: PropTypes.array.isRequired,
  headers: PropTypes.array.isRequired,
  hasGrouping: PropTypes.bool,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func,
  sumOfGroupSizesBeforeCurrentGroup: PropTypes.array
};


const TimeTableDetailed = ({
  hasGrouping, legend, headers, groups,
  activeLineIdx, onActivateLine,
  sumOfGroupSizesBeforeCurrentGroup, fixedHeader, forwardRef
}) => {
  const [left, setLeft] = useState(null);

  const throttleDelay = 100;
  const onScroll = useCallback(throttle(() => {
    const {current} = forwardRef;
    setLeft(
      current.getBoundingClientRect().left - current.scrollLeft
    );
  }, throttleDelay), [forwardRef, setLeft]);

  return (
    <div
      className="time-sheet-body__data"
      ref={forwardRef}
      onScroll={onScroll}
    >
      <table className="report yt-table">
        <TimeTableDetailedHeader
          left={left}
          fixed={fixedHeader}
          legend={legend}
          headers={headers}
        />
        {
          fixedHeader &&
          <TimeTableDetailedHeader
            hidden={true}
            legend={legend}
            headers={headers}
          />
        }
        <TimeTableDetailedBody
          hasGrouping={hasGrouping}
          headers={headers}
          groups={groups}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          sumOfGroupSizesBeforeCurrentGroup={sumOfGroupSizesBeforeCurrentGroup}
        />
      </table>
    </div>
  );
};


TimeTableDetailed.propTypes = {
  groups: PropTypes.array.isRequired,
  headers: PropTypes.array.isRequired,
  legend: PropTypes.array.isRequired,
  hasGrouping: PropTypes.bool,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func,
  sumOfGroupSizesBeforeCurrentGroup: PropTypes.array,
  fixedHeader: PropTypes.bool,
  forwardRef: PropTypes.object
};

export default TimeTableDetailed;
