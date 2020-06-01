import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Link from '@jetbrains/ring-ui/components/link/link';
import {DoubleChevronRightIcon} from '@jetbrains/ring-ui/components/icon';

import UserLink from '../../../../components/src/user-link/user-link';
import SpentTimeValue from '../../../../components/src/spent-time-value/spent-time-value';
import SpentTimeProgress from '../../../../components/src/spent-time-progress/spent-time-progress';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

const TimeTableGeneralGroupLine = ({
  line, fetchHub
}) =>
//TODO: implement yt-sync-hover, yt-sync-select
  (
    <div className="time-sheet-body-general__row">
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
          !line.estimation || !line.estimation.value &&
          <SpentTimeValue value={line.spentTime}/>
        }
      </div>
    </div>
  );

TimeTableGeneralGroupLine.propTypes = {
  line: PropTypes.object.isRequired,
  fetchHub: PropTypes.func.isRequired
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
  group, idx, grouping, fetchHub
}) => (
  <div
    className={classNames(
      'yt-table__group',
      {'yt-table__group_not-bordered': (idx === 0)}
    )}
  >
    {
      !!grouping &&
      <div className="time-sheet-body-general__row time-sheet-body-general__row_subtitle">
        <div className="time-sheet-body-general__row-left">
          <TimeTableGeneralGroupTitle
            defaultText={group.text}
            meta={group.meta}
            fetchHub={fetchHub}
          />
        </div>
        <div className="time-sheet-body-general__row-right">
          {!!group.estimation && group.estimation.presentation || ''}
          <SpentTimeValue value={group.spentTime}/>
        </div>
      </div>
    }
    {
      group.childrenLines.map(line => (
        <TimeTableGeneralGroupLine
          key={`general-group-line-${line.id}`}
          line={line}
          fetchHub={fetchHub}
        />
      ))
    }
  </div>
);

TimeTableGeneralGroup.propTypes = {
  group: PropTypes.object.isRequired,
  grouping: PropTypes.object,
  idx: PropTypes.number,
  fetchHub: PropTypes.func.isRequired
};


const TimeTableGeneral = ({
  grouping, generalGroups, totalSpentTime, fetchHub, presentationControlsPanel
}) => (
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
          idx={idx}
          grouping={grouping}
          fetchHub={fetchHub}
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
  presentationControlsPanel: PropTypes.node
};


class TimeTable extends React.Component {
  static propTypes = {
    grouping: PropTypes.object,
    fetchHub: PropTypes.func,
    onActivateLine: PropTypes.func,
    onResetActiveLine: PropTypes.func,
    activeLineIdx: PropTypes.number,

    generalGroups: PropTypes.array,
    detailedGroups: PropTypes.array,
    columnsLegend: PropTypes.array,
    columnsHeader: PropTypes.array,
    isIssueView: PropTypes.bool,
    totalSpentTime: PropTypes.object,
    presentationControlsPanel: PropTypes.node
  };

  constructor(props) {
    super(props);

    this.state = {
      visibleSidebar: true
    };
  }

  clearActiveLineIndex = () => {
    if (this.props.onResetActiveLine) {
      this.props.onResetActiveLine();
    }
  };

  onActivateLine = lineIdx => {
    if (this.props.onActivateLine) {
      this.props.onActivateLine(lineIdx);
    }
  };

  toggleSidebar = () => {
    const {visibleSidebar} = this.state;
    this.setState({visibleSidebar: !visibleSidebar});
  };

  renderDetailedTableHeaders(columnsHeaders, columnsLegend = []) {

    const getTitleClasses = columnHeader => classNames(
      'yt-table__cell yt-table__cell_header yt-table__cell_header_workday',
      {
        'yt-table__cell_header_holiday': columnHeader.hasHighlight,
        'yt-table__cell_right-border': columnHeader.hasRightSeparator
      }
    );

    return (
      <thead>
        <tr className="yt-table__row yt-table__row-data">
          {
            columnsLegend.map(({legendText, startColumnIdx, colSpan}) => (
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
            columnsHeaders.map((columnHeader, idx) => (
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
            columnsHeaders.map((columnHeader, idx) => (
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
  }

  renderGroupingSpentTimesLine(
    groupingSpentTimes, columnsHeader
  ) {
    const getSpentTimeClasses = idx =>
      classNames('yt-table__cell', {
        'yt-table__cell_header_holiday': columnsHeader[idx].hasHighlight,
        'yt-table__cell_right-border': columnsHeader[idx].hasRightSeparator
      });

    return (
      groupingSpentTimes.map((spentTime, idx) => (
        <td
          key={`grouping-spent-time-${columnsHeader[idx].id}`}
          className={getSpentTimeClasses(idx)}
        >
          <SpentTimeValue
            value={spentTime}
            show-zero={columnsHeader[idx].showZero}
          />
        </td>
      ))
    );
  }

  renderSpentTimesLineCells(dataLines, columnsHeaders) {
    const getCellClasses = idx => classNames(
      'yt-table__cell yt-table__cell_time-sheet-value',
      {
        'yt-table__cell_header_holiday': columnsHeaders[idx].hasHighlight,
        'yt-table__cell_right-border': columnsHeaders[idx].hasRightSeparator
      }
    );

    return (
      dataLines.map(line => (
        <tr
          className="yt-table__row yt-table__row_hovered yt-table__row-data"
          key={`data-line-${line.id}`}
        >
          {
            (line.cells || []).map((cell, idx) => (
              <td
                key={`data-line-cell-${columnsHeaders[idx].id}`}
                className={getCellClasses(idx)}
              >
                <SpentTimeValue value={cell}/>
              </td>
            ))
          }
        </tr>)
      )
    );
  }


  renderDetailedTableBody(
    hasGroupping, isIssueView, columnsHeader, detailedGroups
  ) {
    const getGroupClassNames = idx =>
      classNames(
        'yt-table__group',
        {'yt-table__group_not-bordered': !idx}
      );

    return (
      detailedGroups.map((group, idx) => (
        <tbody
          className={getGroupClassNames(idx)}
          key={`detailed-table-group-${group.id}`}
        >
          {
            hasGroupping &&
            <tr className="yt-table__row yt-table__row_hovered">
              {this.renderGroupingSpentTimesLine(
                group.line || [], columnsHeader
              )}
            </tr>
          }
          {
            this.renderSpentTimesLineCells(
              group.childrenLines,
              columnsHeader
            )
          }
        </tbody>
      ))
    );
  }

  renderDetailedTablePart(
    grouping, isIssueView, columnsLegend, columnsHeader, detailedGroups
  ) {

    //todo: yt-sticky-wide-table="" (+check why does it broken in youtrack-frontend)

    return (
      <div className="time-sheet-body__data">
        <table className="report yt-table">
          { this.renderDetailedTableHeaders(
            columnsHeader, columnsLegend
          ) }
          { this.renderDetailedTableBody(
            !!grouping,
            isIssueView,
            columnsHeader,
            detailedGroups || []
          ) }
        </table>
      </div>
    );
  }

  renderSidebarToggler(visibleSidebar) {
    const iconClasses = classNames('time-sheet-body__sideber-togger-icon', {
      'time-sheet-body__sideber-togger-icon_expanded': !visibleSidebar
    });

    return (
      <div
        onClick={this.toggleSidebar}
        className="time-sheet-body__sidebar-toggler"
        title={visibleSidebar ? i18n('Hide details') : i18n('Show details')}
      >
        <DoubleChevronRightIcon
          size={DoubleChevronRightIcon.Size.Size14}
          className={iconClasses}
        />
      </div>
    );
  }

  render() {
    const {
      grouping,
      columnsLegend,
      columnsHeader,
      generalGroups,
      totalSpentTime,
      detailedGroups,
      fetchHub,
      presentationControlsPanel,
      isIssueView
    } = this.props;
    const {visibleSidebar} = this.state;

    const generalTableClasses = classNames('time-sheet-body__general-table', {
      'time-sheet-body__general-table_expanded': !visibleSidebar
    });

    return (
      <div className="time-sheet-body__wrapper">
        {
          <div className={generalTableClasses}>
            <TimeTableGeneral
              grouping={grouping}
              generalGroups={generalGroups}
              totalSpentTime={totalSpentTime}
              presentationControlsPanel={presentationControlsPanel}
              fetchHub={fetchHub}
            />
          </div>
        }
        {this.renderSidebarToggler(visibleSidebar)}
        {
          visibleSidebar &&
          this.renderDetailedTablePart(
            grouping, isIssueView, columnsLegend, columnsHeader, detailedGroups
          )
        }
      </div>
    );
  }
}

export default TimeTable;
