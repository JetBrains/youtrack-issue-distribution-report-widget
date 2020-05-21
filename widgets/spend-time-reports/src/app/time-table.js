import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Link from '@jetbrains/ring-ui/components/link/link';

import UserLink from '../../../../components/src/user-link/user-link';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';
import SpentTimeValue from './spent-time-value';
import ReportTimeScalesFormatters from './report-time-scales-header-formatters';

class TimeTable extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    grouping: PropTypes.object,
    scaleId: PropTypes.string,
    fetchHub: PropTypes.func,
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

  renderGroupTitle(group) {
    const {linkedUser, linkedIssue} = group.meta || {};

    if (linkedUser) {
      const user = {
        ringId: linkedUser.ringId,
        login: linkedUser.visibleName
      };

      return (
        <span>
          <UserLink user={user} fetchHub={this.props.fetchHub}/>
          <span>{linkedUser.postfix}</span>
        </span>
      );
    }

    if (linkedIssue) {
      return (
        <span>
          <Link href={`issue/${linkedIssue.idReadable}`}>
            {linkedIssue.idReadable}
          </Link>
          <span>{linkedIssue.summary}</span>
        </span>
      );
    }

    return (<span>{group.name}</span>);
  }

  renderGroup(group, idx, grouping, isIssueView) {
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <tbody
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
              <span className="yt-report-group_wrapper">
                {this.renderGroupTitle(group)}
              </span>
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
            <td className="yt-table__cell yt-table__cell_text yt-table__cell_right-border yt-bold">
              <SpentTimeValue value={group.spentTime}/>
            </td>
          </tr>
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

    const getGroupingPresentation = field =>
      i18n('groupped by {{value}}', {value: field.presentation});

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
            data.groups.map((group, idx) =>
              this.renderGroup(group, idx, grouping, isIssueView)
            )
          }
        </table>
      </div>
    );
  }

  renderDetailedTableHeaders(headers, scaleId, lastDayOfWeek) {

    const getTitleClasses = (header, idx) => classNames(
      'yt-table__cell yt-table__cell_header yt-table__cell_header_workday',
      {
        'yt-table__cell_header_holiday':
          ReportTimeScalesFormatters.isHoliday(scaleId, header),
        'yt-table__cell_right-border':
          ReportTimeScalesFormatters.hasTitleSeparator(
            scaleId, headers, idx, lastDayOfWeek
          )
      }
    );

    const getSpentTimeClasses = (header, idx) => classNames(
      'yt-table__cell yt-bold',
      {
        'yt-table__cell_header_holiday':
          ReportTimeScalesFormatters.isHoliday(scaleId, header),
        'yt-table__cell_right-border':
          ReportTimeScalesFormatters.hasTitleSeparator(
            scaleId, headers, idx, lastDayOfWeek
          )
      }
    );

    return (
      <thead>
        <tr className="yt-table__row yt-table__row-data">
          {
            headers.map((header, idx) => (
              <th
                className="yt-table__cell yt-table__cell_header yt-table__cell_header_legend"
                key={`header-legend-${header.start}`}
              >
                <div className="header-legend">
                  {ReportTimeScalesFormatters.getLegend(scaleId, headers, idx)}
                </div>
              </th>
            ))
          }
        </tr>
        <tr className="yt-table__row yt-table__row-data">
          {
            headers.map((header, idx) => (
              <th
                key={`header-title-${header.start}`}
                className={getTitleClasses(header, idx)}
              >
                <span className="header-date-title">
                  {ReportTimeScalesFormatters.getTitle(scaleId, header)}
                </span>
              </th>
            ))
          }
        </tr>
        <tr className="yt-table__row yt-table__total yt-table__row-data">
          {
            headers.map((header, idx) => (
              <td
                className={getSpentTimeClasses(header, idx)}
                key={`header-spent-time-${header.start}`}
              >
                <SpentTimeValue
                  value={header.spentTime}
                  showZero={
                    !ReportTimeScalesFormatters.isHoliday(scaleId, header)
                  }
                />
              </td>
            ))
          }
        </tr>
      </thead>
    );
  }

  renderGroupingSpentTimesLine(
    groupingSpentTimes, headers, scaleId, lastDayOfWeek
  ) {
    const getSpentTimeClasses = idx =>
      classNames('yt-table__cell', {
        'yt-table__cell_header_holiday':
          ReportTimeScalesFormatters.isHoliday(
            scaleId, headers[idx]
          ),
        'yt-table__cell_right-border':
          ReportTimeScalesFormatters.hasTitleSeparator(
            scaleId, headers, idx, lastDayOfWeek
          )
      });

    return (
      groupingSpentTimes.map((spentTime, idx) => (
        <td
          key={`grouping-spent-time-${headers[idx].start}`}
          className={getSpentTimeClasses(idx)}
        >
          <SpentTimeValue
            value={spentTime}
            show-zero={
              !ReportTimeScalesFormatters.isHoliday(scaleId, headers[idx])
            }
          />
        </td>
      ))
    );
  }

  renderSpentTimesLineCells(dataLines, headers, scaleId, lastDayOfWeek) {
    const getCellClasses = idx => classNames(
      'yt-table__cell yt-table__cell_time-sheet-value',
      {
        'yt-table__cell_header_holiday':
            ReportTimeScalesFormatters.isHoliday(scaleId, headers[idx]),
        'yt-table__cell_right-border':
            ReportTimeScalesFormatters.hasTitleSeparator(
              scaleId, headers, idx, lastDayOfWeek
            )
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
                key={`data-line-cell-${headers[idx].start}`}
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


  renderDetailedTableBody(groups, hasGroupping, isIssueView, headers, scaleId) {
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
                group.lineSpentTime || [], headers, scaleId
              )}
            </tr>
          }
          {
            this.renderSpentTimesLineCells(
              (isIssueView ? group.issueLines : group.userLines) || [],
              headers,
              scaleId
            )
          }
        </tbody>
      ))
    );
  }

  renderDetailedTablePart(data, grouping, isIssueView, scaleId) {

    //todo: yt-sticky-wide-table="" (+check why does it broken in youtrack-frontend)

    return (
      <div className="time-sheet-body__data">
        <table className="report yt-table">
          { this.renderDetailedTableHeaders(
            data.headers || [], scaleId
          ) }
          { this.renderDetailedTableBody(
            data.groups || [],
            !!grouping,
            isIssueView,
            data.headers || [],
            scaleId
          ) }
        </table>
      </div>
    );
  }

  render() {
    const {data} = this.state;
    const {grouping, scaleId} = this.props;
    const isIssueView = true;

    return (
      <div className="time-sheet-body__wrapper">
        {this.renderGeneralTablePart(data, grouping, isIssueView)}
        {this.renderDetailedTablePart(data, grouping, isIssueView, scaleId)}
      </div>
    );
  }
}

export default TimeTable;
