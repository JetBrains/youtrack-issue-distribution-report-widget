import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Link from '@jetbrains/ring-ui/components/link/link';

import UserLink from '../../../../components/src/user-link/user-link';
import SpentTimeValue from '../../../../components/src/spent-time-value/spent-time-value';
import SpentTimeProgress from '../../../../components/src/spent-time-progress/spent-time-progress';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';

class TimeTable extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    grouping: PropTypes.object,
    scaleId: PropTypes.string,
    fetchHub: PropTypes.func,
    onActivateLine: PropTypes.func,
    onResetActiveLine: PropTypes.func,
    activeLineIdx: PropTypes.number,

    columnsLegend: PropTypes.array,
    columnsHeader: PropTypes.array
  };

  constructor(props) {
    super(props);

    this.state = {
      data: props.reportData
    };
  }

  componentWillReceiveProps(props) {
    if (props.reportData) {
      this.setState({
        data: props.reportData
      });
    }
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

  renderGroupTitle(group) {
    const {linkedUser, linkedIssue} = group.meta || {};

    if (linkedUser) {
      const user = {
        ringId: linkedUser.ringId,
        login: linkedUser.visibleName
      };

      return (
        <span>
          <UserLink
            className="yt-table__cell_link-identifier"
            user={user}
            fetchHub={this.props.fetchHub}
          />
          <span>{linkedUser.postfix}</span>
        </span>
      );
    }

    if (linkedIssue) {
      return (
        <span>
          <Link
            className="yt-table__cell_link-identifier"
            href={`issue/${linkedIssue.idReadable}`}
          >
            {linkedIssue.idReadable}
          </Link>
          <span>{linkedIssue.summary}</span>
        </span>
      );
    }

    return (
      <span className="yt-table__cell_link-identifier">
        {group.name}
      </span>
    );
  }

  renderGroup(group, idx, grouping, isIssueView) {
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <tbody
        key={`data-group-${group.id}-${idx}`}
        className={classNames(
          'yt-table__group',
          {'yt-table__group_not-bordered': (idx === 0)}
        )}
      >
        {
          !!grouping &&
          <tr className="yt-table__row yt-table__row_hovered">
            <td
              className="yt-table__cell yt-table__cell_text yt-bold"
              colSpan={3}
            >
              {this.renderGroupTitle(group)}
            </td>
            {
              isIssueView &&
              <td className="yt-table__cell yt-table__cell_text">
                {
                  !!group.estimation && (
                    group.estimation.minutes
                      ? ''
                      : group.estimation.presentation
                  )
                }
              </td>
            }
            <td className="yt-table__cell yt-table__cell_right-border">
              <strong>
                <SpentTimeValue value={group.spentTime}/>
              </strong>
            </td>
          </tr>
        }
        {
          isIssueView &&
          group.issueLines.map(line => this.renderIssueLine(line))
        }
        {
          !isIssueView &&
          group.userLines.map(line => this.renderUserLine(line))
        }
      </tbody>
    );
  }

  renderGeneralTablePart(data, grouping, isIssueView) {

    const getGroupingPresentation = field =>
      i18n('groupped by {{value}}', {value: field.presentation});

    const title = [
      isIssueView ? i18n('Issues') : i18n('Users'),
      grouping && grouping.field ? getGroupingPresentation(grouping.field) : ''
    ].filter(it => !!it).join(', ');

    // eslint-disable-next-line no-magic-numbers
    const colSpan = isIssueView ? 5 : 4;

    return (
      <div className="time-sheet-body__meta_wrapper">
        <table className="report yt-table">
          <thead>
            <tr className="yt-table__row">
              <th
                className="yt-table__cell yt-table__cell_header"
                colSpan={colSpan}
              />
            </tr>
            <tr className="yt-table__row">
              <th
                className="yt-table__cell yt-table__cell_header yt-table__cell_right-border yt-table__cell_header_legend"
                colSpan={colSpan}
              >
                { title }
              </th>
            </tr>
            <tr className="yt-table__row yt-table__total">
              <th
                className="yt-table__cell yt-table__cell_text"
                colSpan={colSpan - 1}
              >
                { i18n('Total time') }
              </th>
              <th className="yt-table__cell yt-table__cell_right-border yt-bold">
                <SpentTimeValue value={data.spentTime}/>
              </th>
            </tr>
          </thead>
          {
            data.groups.map((group, idx) =>
              this.renderGroup(group, idx, grouping, isIssueView)
            )
          }
        </table>
      </div>
    );
  }

  renderDetailedTableHeaders(columnsHeaders, columnsLegend = []) {

    const getTitleClasses = columnHeader => classNames(
      'yt-table__cell yt-table__cell_header yt-table__cell_header_workday',
      {
        'yt-table__cell_header_holiday': !columnHeader.showZero,
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
        'yt-table__cell_header_holiday': !columnsHeader[idx].showZero,
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
        'yt-table__cell_header_holiday': !columnsHeaders[idx].showZero,
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


  renderDetailedTableBody(groups, hasGroupping, isIssueView, columnsHeader) {
    const getGroupClassNames = idx =>
      classNames(
        'yt-table__group',
        {'yt-table__group_not-bordered': !idx}
      );

    return (
      groups.map((group, idx) => (
        <tbody
          className={getGroupClassNames(idx)}
          key={`detailed-table-group-${group.id}`}
        >
          {
            hasGroupping &&
            <tr className="yt-table__row yt-table__row_hovered">
              {this.renderGroupingSpentTimesLine(
                group.lineSpentTime || [], columnsHeader
              )}
            </tr>
          }
          {
            this.renderSpentTimesLineCells(
              (isIssueView ? group.issueLines : group.userLines) || [],
              columnsHeader
            )
          }
        </tbody>
      ))
    );
  }

  renderDetailedTablePart(
    data, grouping, isIssueView, columnsLegend, columnsHeader
  ) {

    //todo: yt-sticky-wide-table="" (+check why does it broken in youtrack-frontend)

    return (
      <div className="time-sheet-body__data">
        <table className="report yt-table">
          { this.renderDetailedTableHeaders(
            columnsHeader, columnsLegend
          ) }
          { this.renderDetailedTableBody(
            data.groups || [],
            !!grouping,
            isIssueView,
            columnsHeader
          ) }
        </table>
      </div>
    );
  }

  render() {
    const {data} = this.state;
    const {grouping, columnsLegend, columnsHeader} = this.props;
    const isIssueView = true;

    return (
      <div className="time-sheet-body__wrapper">
        {this.renderGeneralTablePart(data, grouping, isIssueView)}
        {this.renderDetailedTablePart(
          data, grouping, isIssueView, columnsLegend, columnsHeader
        )}
      </div>
    );
  }
}

export default TimeTable;
