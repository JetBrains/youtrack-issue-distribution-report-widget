import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import UserLink from '../../../../components/src/user-link/user-link';
import SpentTimeValue from '../../../../components/src/spent-time-value/spent-time-value';
import SpentTimeProgress from '../../../../components/src/spent-time-progress/spent-time-progress';
import IssueLink from '../../../../components/src/issue-link/issue-link';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

const TimeTableGeneralGroupLine = ({
  line, fetchHub, isSubTitle, lineIdx,
  activeLineIdx, onActivateLine, homeUrl, fetchYouTrack
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
          fetchYouTrack={fetchYouTrack}
          homeUrl={homeUrl}
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
  fetchYouTrack: PropTypes.func.isRequired,
  isSubTitle: PropTypes.bool,
  homeUrl: PropTypes.string
};


const TimeTableGeneralGroupTitle = ({
  meta, fetchHub, fetchYouTrack, defaultText, homeUrl
}) => {

  if (!meta) {
    return (
      <span className="yt-table__cell_link-identifier">
        {defaultText}
      </span>
    );
  }

  const link = meta.isIssue
    ? (
      <IssueLink
        issue={{
          id: meta.id,
          idReadable: meta.title,
          summary: meta.description
        }}
        homeUrl={homeUrl}
        fetchYouTrack={fetchYouTrack}
        className="yt-table__cell_link-identifier"
      />
    ) : (
      <UserLink
        className="yt-table__cell_link-identifier"
        user={
          {ringId: meta.id, login: meta.title}
        }
        fetchHub={fetchHub}
        homeUrl={homeUrl}
      />
    );

  return (
    <span>
      {link}
      <span>{meta.description}</span>
    </span>
  );
};

TimeTableGeneralGroupTitle.propTypes = {
  fetchHub: PropTypes.func.isRequired,
  fetchYouTrack: PropTypes.func.isRequired,
  meta: PropTypes.object,
  defaultText: PropTypes.string,
  homeUrl: PropTypes.string
};


const TimeTableGeneralGroup = ({
  group, linesStartIdx, grouping, fetchHub,
  fetchYouTrack, activeLineIdx, onActivateLine, homeUrl
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
        fetchYouTrack={fetchYouTrack}
        homeUrl={homeUrl}
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
          homeUrl={homeUrl}
          fetchHub={fetchHub}
          fetchYouTrack={fetchYouTrack}
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
  fetchYouTrack: PropTypes.func.isRequired,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func,
  homeUrl: PropTypes.string
};


const TimeTableGeneral = ({
  grouping, generalGroups, totalSpentTime,
  fetchHub, fetchYouTrack, presentationControlsPanel, homeUrl, fixedHeader,
  onActivateLine, activeLineIdx, sumOfGroupSizesBeforeCurrentGroup,
  width
}) =>
  (
    <div
      className={classNames({
        'time-sheet-body-general': true,
        'time-sheet-body-general_fixed': fixedHeader
      })}
    >
      <div
        className={classNames({
          'time-sheet-body-general__header': true,
          'time-sheet-body-general__header_fixed': fixedHeader
        })}
        style={(fixedHeader && width) ? {width} : null}
      >
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
      </div>
      {
        generalGroups.map((group, idx) => (
          <TimeTableGeneralGroup
            key={`data-group-${group.id}`}
            group={group}
            homeUrl={homeUrl}
            linesStartIdx={
              grouping
                ? (sumOfGroupSizesBeforeCurrentGroup[idx] + idx)
                : sumOfGroupSizesBeforeCurrentGroup[idx]
            }
            grouping={grouping}
            fetchYouTrack={fetchYouTrack}
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
  fetchYouTrack: PropTypes.func.isRequired,
  presentationControlsPanel: PropTypes.node,
  activeLineIdx: PropTypes.number,
  onActivateLine: PropTypes.func,
  sumOfGroupSizesBeforeCurrentGroup: PropTypes.array,
  fixedHeader: PropTypes.bool,
  homeUrl: PropTypes.string,
  width: PropTypes.number
};

export default TimeTableGeneral;
