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
    isIssueView: PropTypes.object,
    totalSpentTime: PropTypes.object
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

  renderGeneralLine = line => {
    const {meta} = line;
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <div
        className="time-sheet-body-general__row"
        key={`issue-line-${line.id}-${line.entityId}`}
      >
        <div className="time-sheet-body-general__row-left">
          {
            meta &&
            <Link href={meta.url}>
              {meta.id}
            </Link>
          }
          <span rg-tooltip="line.presentation">
            {line.text}
          </span>
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
  }

  renderIssueLine(line) {
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <tr
        className="yt-table__row yt-table__row_hovered"
        key={`issue-line-${line.id}-${line.entityId}`}
      >
        <td className="yt-table__cell yt-table__cell_link-identifier">
          <Link href={`issue/${line.entityId}`}>
            {line.entityId}
          </Link>
        </td>
        <td
          className="yt-table__cell yt-table__cell_issue-summary"
          colSpan="2"
        >
          <span rg-tooltip="line.presentation">
            {line.presentation}
          </span>
        </td>
        <td className="yt-table__cell yt-table__cell_progress-bar">
          {
            line.estimation && line.estimation.value &&
            <SpentTimeProgress
              spent={line.totalSpentTime}
              estimated={line.estimation}
            />
          }
        </td>
        <td className="yt-table__cell yt-table__cell_right-border">
          <SpentTimeValue value={line.spentTime}/>
        </td>
      </tr>
    );
  }

  renderUserLine(line) {
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <tr
        className="yt-table__row yt-table__row_hovered"
        key={`user-line-${line.id}-${line.entityId}`}
      >
        <td className="yt-table__cell yt-table__cell_user-avatar">
          {
            line.avatarUrl &&
            <img
              className="avatar"
              src={line.avatarUrl}
            />
          }
        </td>
        <td
          className="yt-table__cell yt-table__cell_user-name"
          colSpan="2"
        >
          <Link href={`issues/${line.name}`}>
            {line.presentation}
          </Link>
        </td>
        <td className="yt-table__cell yt-table__cell_right-border">
          <SpentTimeValue value={line.spentTime}/>
        </td>
      </tr>
    );
  }

  renderGroupTitle(group, isIssueView) {
    const {meta} = group;

    if (!meta) {
      return (
        <span className="yt-table__cell_link-identifier">
          {group.text}
        </span>
      );
    }

    if (isIssueView) {
      return (
        <span>
          <Link
            className="yt-table__cell_link-identifier"
            href={`issue/${meta.idReadable}`}
          >
            {meta.idReadable}
          </Link>
          <span>{meta.summary}</span>
        </span>
      );
    }

    return (
      <span>
        <UserLink
          className="yt-table__cell_link-identifier"
          user={
            {ringId: meta.ringId, login: meta.visibleName}
          }
          fetchHub={this.props.fetchHub}
        />
        <span>{meta.postfix}</span>
      </span>
    );
  }

  renderGroup(group, idx, grouping, isIssueView) {
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <div
        key={`data-group-${group.id}-${idx}`}
        className={classNames(
          'yt-table__group',
          {'yt-table__group_not-bordered': (idx === 0)}
        )}
      >
        {
          !!grouping &&
          <div className="time-sheet-body-general__row">
            <div className="time-sheet-body-general__row-left">
              {this.renderGroupTitle(group, isIssueView)}
            </div>
            <div className="time-sheet-body-general__row-right">
              <strong>
                {!!group.estimation && group.estimation.presentation || ''}
              </strong>
              <strong>
                <SpentTimeValue value={group.spentTime}/>
              </strong>
            </div>
          </div>
        }
        {
          group.childrenLines.map(line => this.renderGeneralLine(line))
        }
      </div>
    );
  }

  renderGeneralTablePart(grouping, isIssueView, generalGroups, totalSpentTime) {

    const getGroupingPresentation = field =>
      i18n('groupped by {{value}}', {value: field.presentation});

    const title = [
      isIssueView ? i18n('Issues') : i18n('Users'),
      grouping && grouping.field ? getGroupingPresentation(grouping.field) : ''
    ].filter(it => !!it).join(', ');

    return (
      <div className="time-sheet-body-general">
        <div className="time-sheet-body-general__axys-title">
          { title }
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
          generalGroups.map((group, idx) =>
            this.renderGroup(group, idx, grouping, isIssueView)
          )
        }
      </div>
    );
  }

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
            {this.renderGeneralTablePart(
              grouping, isIssueView, generalGroups, totalSpentTime
            )}
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
