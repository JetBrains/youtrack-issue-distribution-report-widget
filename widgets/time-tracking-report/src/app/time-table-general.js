import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Link from '@jetbrains/ring-ui/components/link/link';

import UserLink from '../../../../components/src/user-link/user-link';
import SpentTimeValue from '../../../../components/src/spent-time-value/spent-time-value';
import SpentTimeProgress from '../../../../components/src/spent-time-progress/spent-time-progress';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

const TimeTableGeneralGroupLine = ({
  line, fetchHub, isSubTitle, lineIdx, activeLineIdx, onActivateLine
}) => {
  const activateLine = useCallback(
    () => onActivateLine(lineIdx), [lineIdx]
  );

  return (
    <div
      onMouseEnter={activateLine}
      className={classNames(
        'time-sheet-body-general__row', {
          'time-sheet-body-general__row_subtitle': isSubTitle,
          'time-sheet-body-general__row_hovered': activeLineIdx === lineIdx
        }
      )}
    >
      <div className="time-sheet-body-general__row-left">
        <TimeTableGeneralGroupTitle
          defaultText={line.text}
          meta={line.meta}
          fetchHub={fetchHub}
        />
      </div>
      <div className="time-sheet-body-general__row-right">
        {
          !!line.estimation && !!line.estimation.value &&
          <SpentTimeProgress
            spent={line.totalSpentTime}
            estimated={line.estimation}
          >
            <SpentTimeValue value={line.spentTime}/>
          </SpentTimeProgress>
        }
        {
          (!line.estimation || !line.estimation.value) &&
          <SpentTimeValue value={line.spentTime}/>
        }
      </div>
    </div>
  );
};

TimeTableGeneralGroupLine.propTypes = {
  line: PropTypes.object.isRequired,
  lineIdx: PropTypes.number,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func,
  fetchHub: PropTypes.func.isRequired,
  isSubTitle: PropTypes.bool
};


const TimeTableGeneralGroupTitle = ({
  meta, fetchHub, defaultText
}) => {

  if (!meta) {
    return (
      <span className="yt-table__cell_link-identifier">
        {defaultText}
      </span>
    );
  }

  if (meta.isIssue) {
    return (
      <span>
        <Link
          className="yt-table__cell_link-identifier"
          href={`issue/${meta.id}`}
        >
          {meta.title}
        </Link>
        <span>{meta.description}</span>
      </span>
    );
  }

  return (
    <span>
      <UserLink
        className="yt-table__cell_link-identifier"
        user={
          {ringId: meta.id, login: meta.title}
        }
        fetchHub={fetchHub}
      />
      <span>{meta.description}</span>
    </span>
  );
};

TimeTableGeneralGroupTitle.propTypes = {
  fetchHub: PropTypes.func.isRequired,
  meta: PropTypes.object,
  defaultText: PropTypes.string
};


const TimeTableGeneralGroup = ({
  group, linesStartIdx, grouping, fetchHub,
  activeLineIdx, onActivateLine
}) => (
  <div
    className={classNames(
      'yt-table__group',
      {'yt-table__group_not-bordered': (linesStartIdx === 0)}
    )}
  >
    {
      !!grouping &&
      <TimeTableGeneralGroupLine
        line={group}
        fetchHub={fetchHub}
        isSubTitle={true}
        lineIdx={linesStartIdx}
        activeLineIdx={activeLineIdx}
        onActivateLine={onActivateLine}
      />
    }
    {
      group.childrenLines.map((line, idx) => (
        <TimeTableGeneralGroupLine
          key={`general-group-line-${line.id}`}
          line={line}
          fetchHub={fetchHub}
          activeLineIdx={activeLineIdx}
          onActivateLine={onActivateLine}
          lineIdx={grouping ? (linesStartIdx + idx + 1) : (linesStartIdx + idx)}
        />
      ))
    }
  </div>
);

TimeTableGeneralGroup.propTypes = {
  group: PropTypes.object.isRequired,
  grouping: PropTypes.object,
  linesStartIdx: PropTypes.number,
  fetchHub: PropTypes.func.isRequired,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func
};


const TimeTableGeneral = ({
  grouping, generalGroups, totalSpentTime,
  fetchHub, presentationControlsPanel,
  onActivateLine, activeLineIdx, sumOfGroupSizesBeforeCurrentGroup
}) =>
  (
    <div className="time-sheet-body-general">
      <div className="time-sheet-body-general__axys-title">
        { presentationControlsPanel }
      </div>
      <div className="time-sheet-body-general__row time-sheet-body-general__row_total">
        <div className="time-sheet-body-general__row-left">
          { i18n('Total time') }
        </div>
        <div className="time-sheet-body-general__row-right">
          <SpentTimeValue value={totalSpentTime}/>
        </div>
      </div>
      {
        generalGroups.map((group, idx) => (
          <TimeTableGeneralGroup
            key={`data-group-${group.id}`}
            group={group}
            linesStartIdx={
              grouping
                ? (sumOfGroupSizesBeforeCurrentGroup[idx] + idx)
                : sumOfGroupSizesBeforeCurrentGroup[idx]
            }
            grouping={grouping}
            fetchHub={fetchHub}
            onActivateLine={onActivateLine}
            activeLineIdx={activeLineIdx}
          />
        ))
      }
    </div>
  );

TimeTableGeneral.propTypes = {
  generalGroups: PropTypes.array.isRequired,
  totalSpentTime: PropTypes.object,
  grouping: PropTypes.object,
  isIssueView: PropTypes.bool,
  fetchHub: PropTypes.func.isRequired,
  presentationControlsPanel: PropTypes.node,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func,
  sumOfGroupSizesBeforeCurrentGroup: PropTypes.array
};

export default TimeTableGeneral;
