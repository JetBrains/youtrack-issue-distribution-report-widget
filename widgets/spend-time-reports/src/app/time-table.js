import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import './style/report-time-sheet.scss';
import './style/time-sheet-body.scss';
import SpentTimeValue from './spent-time-value';

class TimeTable extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
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

  renderTableCell(row, rowIdx) {
    const onMouseOver = () =>
      this.onActivateLine(rowIdx);

    const isActiveIdx = this.props.activeLineIdx === rowIdx;

    return (
      <div
        key={`column-row-key-${rowIdx}`}
        className={classNames(
          'report-chart__table-cell',
          {'report-chart__table-cell_active': isActiveIdx})
        }
        onMouseOver={onMouseOver}
      >
        <span>{`Cell${rowIdx}`}</span>
      </div>
    );
  }

  renderGroupLine(row, rowIdx) {
    const onMouseOver = () =>
      this.onActivateLine(rowIdx);

    const isActiveIdx = this.props.activeLineIdx === rowIdx;

    return (
      <div
        key={`column-row-key-${rowIdx}`}
        className={classNames(
          'report-chart__table-cell',
          {'report-chart__table-cell_active': isActiveIdx}
        )}
        onMouseOver={onMouseOver}
      >
        <span>{`Cell${rowIdx}`}</span>
      </div>
    );
  }

  renderColumn(column) {
    return (
      <div
        key={`column-value-${column.name}`}
        className="report-chart__table-column"
      >
        {
          column.values.map((row, idx) =>
            this.renderTableCell(row, idx)
          )
        }
      </div>
    );
  }

  renderIssueLine(line) {
    //TODO: implement yt-sync-hover, yt-sync-select

    return (
      <tr className="yt-table__row yt-table__row_hovered">
        <td className="yt-table__cell yt-table__cell_issue-id">
          <a
            className="ring-link"
            ng-href="{{activeView.getUrl(line)}}"
          >
            {line.entityId}
          </a>
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
          <a
            className="ring-link"
            ng-href="{{activeView.getUrl(line)}}"
          >
            {line.presentation}
          </a>
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

  render() {
    const {data} = this.state;
    const isIssueView = true;
    const hasGroupping = false;

    const activeView = {
      title: 'Active view title'
    };

    const getGroupingPresentation = () => 'groupping presentation';

    const title = [activeView.title];
    if (hasGroupping) {
      title.push(i18n('grouped by {{presentation}}', {
        presentation: getGroupingPresentation()
      }));
    }

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
                { title.join(', ') }
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
}

export default TimeTable;
