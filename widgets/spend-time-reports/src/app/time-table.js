import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Link from '@jetbrains/ring-ui/components/link/link';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';
import SpentTimeValue from './spent-time-value';

class TimeTable extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    grouping: PropTypes.object,
    onActivateLine: PropTypes.func,
    onResetActiveLine: PropTypes.func,
    activeLineIdx: PropTypes.number
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

  isHoliday = idx => false;

  isLastWeekDay = idx => true;

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
      <tr className="yt-table__row yt-table__row_hovered">
        <td className="yt-table__cell yt-table__cell_issue-id">
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
            <yt-report-time-progress
              progress="line.totalSpentTime"
              estimation="line.estimation"
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
      <tr className="yt-table__row yt-table__row_hovered">
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

  renderGroup(group, idx, linesName = 'issueLines') {
    const isIssueView = linesName === 'issueLines';
    const hasGrouping = false;

    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <tbody
        className={classNames(
          'yt-table__group',
          {'yt-table__group_not-bordered': (idx === 0)}
        )}
      >
        {
          hasGrouping && 'todo'
        }
        {
          isIssueView &&
          group.issueLines.map(line => this.renderIssueLine(line))
        }
        {
          !isIssueView &&
          group.issueLines.map(line => this.renderUserLine(line))
        }
      </tbody>
    );
  }

  renderGeneralTablePart(data, grouping, isIssueView) {

    const getGroupingPresentation = (field) =>
      i18n('groupped by {{value}}', {value: field.presentation})

    const title = [
      isIssueView ? i18n('Issues') : i18n('Users'),
      grouping && grouping.field ? getGroupingPresentation(grouping.field) : ''
    ].join(', ');

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
            data.groups.map((group, idx) => this.renderGroup(group, idx))
          }
        </table>
      </div>
    );
  }

  renderDetailedTableHeaders(headers) {
    const getLegend = () => 'legend';
    const getTitle = () => 'title';

    const getTitleClasses = (header, idx) => classNames(
      'yt-table__cell yt-table__cell_header yt-table__cell_header_workday',
      {
        'yt-table__cell_header_holiday': this.isHoliday(idx),
        'yt-table__cell_right-border': this.isLastWeekDay(idx)
      }
    );

    const getSpentTimeClasses = (header, idx) => classNames(
      'yt-table__cell yt-bold',
      {
        'yt-table__cell_header_holiday': this.isHoliday(idx),
        'yt-table__cell_right-border': this.isLastWeekDay(idx)
      }
    );

    return (
      <thead>
        <tr className="yt-table__row yt-table__row-data">
          {
            headers.map((header, idx) =>
              <th className="yt-table__cell yt-table__cell_header yt-table__cell_header_legend">
                <div className="header-legend">{getLegend(header, idx)}</div>
              </th>
            )
          }
        </tr>
        <tr className="yt-table__row yt-table__row-data">
          {
            headers.map((header, idx) =>
              <th className={getTitleClasses(header, idx)}>
                <span className="header-date-title">
                  {getTitle(header, idx)}
                </span>
              </th>
            )
          }
        </tr>
        <tr className="yt-table__row yt-table__total yt-table__row-data">
          {
            headers.map((header, idx) =>
              <td className={getSpentTimeClasses(header, idx)}>
                <SpentTimeValue
                  value={header.spentTime}
                  showZero={!this.isHoliday(idx)}
                />
              </td>
            )
          }
        </tr>
      </thead>
    );
  }

  renderGroupingSpentTimesLine(groupingSpentTimes) {
    const getSpentTimeClasses = idx =>
      classNames('yt-table__cell yt-table__cell_text', {
        'yt-table__cell_header_holiday': this.isHoliday(idx),
        'yt-table__cell_right-border': this.isLastWeekDay(idx)
      });

    return (
      groupingSpentTimes.map((spentTime, idx) =>
        <td className={getSpentTimeClasses(idx)}>
          <SpentTimeValue
            value={spentTime}
            show-zero={!this.isHoliday(idx)}
          />
        </td>
      )
    );
  }

  renderSpentTimesLineCells(dataLines) {
    const getCellClasses = idx => classNames(
        'yt-table__cell yt-table__cell_time-sheet-value',
        {
          'yt-table__cell_header_holiday': this.isHoliday(idx),
          'yt-table__cell_right-border': this.isLastWeekDay(idx)
        }
      );

    return (
      dataLines.map(line =>
        <tr className="yt-table__row yt-table__row_hovered yt-table__row-data">
          {
            (line.cells || []).map((cell, idx) =>
              <td className={getCellClasses(idx)}>
                <SpentTimeValue value={cell}/>
              </td>
            )
          }
        </tr>
      )
    )
  }


  renderDetailedTableBody(groups, hasGroupping, isIssueView) {

    return (
      groups.map((group, idx) =>
        <tbody className={classNames(
          'yt-table__group', {'yt-table__group_not-bordered' : !idx}
          )}
        >
        {
          hasGroupping &&
          <tr className="yt-table__row yt-table__row_hovered yt-table__row-data">
            {this.renderGroupingSpentTimesLine(group.lineSpentTime || [])}
          </tr>
        }
        {
          this.renderSpentTimesLineCells(
            (isIssueView ? group.issueLines : group.userLines) || []
          )
        }
        </tbody>
      )
    );
  }

  renderDetailedTablePart(data, grouping, isIssueView) {

    //todo: yt-sticky-wide-table="" (+check why does it broken in youtrack-frontend)

    console.log('data.headers', data.headers);
    return (
      <div className="time-sheet-body__data">
        <table className="report yt-table">
          { this.renderDetailedTableHeaders(data.headers || []) }
          { this.renderDetailedTableBody(data.groups || [], !!grouping, isIssueView) }
        </table>
      </div>
    );
  }

  render() {
    const {data} = this.state;
    const {grouping} = this.props;
    const isIssueView = true;

    return (
      <div className="time-sheet-body__wrapper">
        {this.renderGeneralTablePart(data, grouping, isIssueView)}
        {this.renderDetailedTablePart(data, grouping, isIssueView)}
      </div>
    )
  }
}

export default TimeTable;
