import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';
import Link from '@jetbrains/ring-ui/components/link/link';
import {UserCardTooltip} from '@jetbrains/ring-ui/components/user-card/user-card';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import ReportChartSortOrder from './report-chart-sort-order';

const nv = window.nv;
const GRAPH_TRANSITION_DURATION = 350;
const X_AXIS_HEIGHT = 22;

class ReportChart extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    reportMainSortOrder: PropTypes.string,
    reportSecondarySortOrder: PropTypes.string,
    reportMainAxisLabel: PropTypes.string,
    reportSecondaryAxisLabel: PropTypes.string,
    onChangeSortOrders: PropTypes.func,
    homeUrl: PropTypes.string
  };

  static Tabs = {
    Bars: 'bars',
    Table: 'table'
  };

  static LineHeight = 22; // eslint-disable-line no-magic-numbers

  static getSearchUrl = (columnUrl, homeUrl) =>
    `${homeUrl}/issues?q=${encodeURIComponent(columnUrl)}`;

  static isStackedChart = reportData =>
    !!(reportData.xcolumns && reportData.ycolumns);

  static getBarsChartModel = reportData => {
    if (ReportChart.isStackedChart(reportData)) {
      return reportData.xcolumns.map(xCol => ({
        key: xCol.name,
        values: reportData.ycolumns.map(yCol => ({
          name: yCol.name,
          issuesQuery: reportData.issuesQueries[xCol.index][yCol.index],
          size: reportData.counts[xCol.index][yCol.index]
        })),
        colorIndex: xCol.colorIndex
      }));
    }
    return [{
      values: reportData.columns || []
    }];
  };

  constructor(props) {
    super(props);

    this.state = {
      reportData: props.reportData,
      reportMainSortOrder: props.reportMainSortOrder,
      reportSecondarySortOrder: props.reportSecondarySortOrder,
      reportMainAxisLabel: props.reportMainAxisLabel,
      reportSecondaryAxisLabel: props.reportSecondaryAxisLabel,
      activeTab: ReportChart.Tabs.Bars
    };
  }

  componentWillReceiveProps(props) {
    if (props.reportData) {
      this.setState(
        {reportData: props.reportData},
        () => this.drawBarChart()
      );
    }
  }

  onChangeMainSortOrder = newMainSortOrder => {
    this.setState({
      reportMainSortOrder: newMainSortOrder
    }, () =>
      this.props.onChangeSortOrders && this.props.onChangeSortOrders(
        newMainSortOrder, this.state.reportSecondarySortOrder
      )
    );
  };

  drawBarChart = () => {
    const barChartNode = this.barChartNode;
    if (!barChartNode) {
      return;
    }

    const {reportData} = this.state;

    nv.addGraph(() => {
      const isStacked = ReportChart.isStackedChart(reportData);
      const multiBarHorizontalChart = nv.models.multiBarHorizontalChart();
      const chart = multiBarHorizontalChart.
        margin({
          left: 5,
          top: 0,
          right: X_AXIS_HEIGHT,
          bottom: X_AXIS_HEIGHT
        }).
        stacked(isStacked).
        state({
          stacked: isStacked
        }). // workaround
        x(column => column.name).
        y(column => column.size).
        tooltips(isStacked).
        showControls(false).
        showLegend(false).
        transitionDuration(GRAPH_TRANSITION_DURATION).
        showXAxis(false);

      chart.multibar.getUrl(column =>
        ReportChart.getSearchUrl(column.issuesQuery, this.props.homeUrl)
      );

      chart.xAxis.tickFormat(d => d);
      chart.yAxis.tickFormat(d3.format('d'));

      d3.select(barChartNode).
        datum(ReportChart.getBarsChartModel(reportData)).
        call(chart);

      nv.utils.windowResize(chart.update);
    });
  };

  onGetSvgNode = barChartNode => {
    this.barChartNode = barChartNode;
    this.drawBarChart();
  };

  onChangeSecondarySortOrder = newSecondarySortOrder => {
    this.setState({
      reportSecondarySortOrder: newSecondarySortOrder
    }, () =>
      this.props.onChangeSortOrders && this.props.onChangeSortOrders(
        this.state.reportMainSortOrder, newSecondarySortOrder
      )
    );
  };

  renderLineLabel(column, totalIssuesCount) {
    const toPercentsMultiplier = 100;
    const getSizeInPercents = size =>
      `${Math.round(size / totalIssuesCount * toPercentsMultiplier)}%`;

    return (
      <div
        key={`report-column-${column.index}`}
        style={{height: ReportChart.LineHeight, lineHeight: `${ReportChart.LineHeight}px`}}
      >
        <div className="report-chart__size-in-percents">
          { getSizeInPercents(column.size) }
        </div>
        <div className="report-chart__size">
          { column.size }
        </div>
        {
          !column.user &&
          <div className="report-chart__label">
            { column.name }
          </div>
        }
        {
          column.user &&
          <div className="report-chart__label">
            <UserCardTooltip user={{
              login: column.user.login,
              name: column.user.name,
              email: column.user.email,
              avatarUrl: column.user.avatarUrl,
              href: `${this.props.homeUrl}/users/${column.user.ringId}`
            }}
            >
              <Link
                href={`${this.props.homeUrl}/users/${column.user.ringId}`}
                pseudo={true}
              >
                { column.name }
              </Link>
            </UserCardTooltip>
          </div>
        }
      </div>
    );
  }

  renderBarsChart(height) {
    return (
      <div
        className="report-chart__body"
        style={{height}}
      >
        <svg ref={this.onGetSvgNode}/>
      </div>
    );
  }

  renderTable() {
    const {reportData} = this.state;
    const model = ReportChart.getBarsChartModel(reportData);

    return (
      <div
        className="report-chart__body"
      >
        <table className="report-chart__table">
          <thead>
            <tr>
              {
                model.map(column => (
                  <th
                    key={`column-key-${column.key}`}
                    className="report-chart__table-header"
                  >
                    {column.key}
                  </th>
                ))
              }
            </tr>
          </thead>

          <tbody>
            {
              model[0].values.map((row, idx) => (
                <tr
                  className="report-chart__table-row"
                  style={{height: ReportChart.LineHeight}}
                  key={`row-key-${row.name}`}
                >
                  {
                    model.map(column => (
                      <td
                        key={`column-row-key-${column.key}-${row.name}`}
                        className="report-chart__table-cell"
                      >
                        {
                          column.values[idx].size > 0 &&
                          <Link
                            pseudo={true}
                            href={ReportChart.getSearchUrl(
                              column.values[idx].issuesQuery, this.props.homeUrl
                            )}
                          >
                            { column.values[idx].size }
                          </Link>
                        }
                        {
                          column.values[idx].size === 0 && '-'
                        }
                      </td>
                    ))
                  }
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  renderChartBody(chartHeight) {
    if (this.state.activeTab === ReportChart.Tabs.Bars) {
      return this.renderBarsChart(chartHeight);
    }
    return this.renderTable();
  }

  render() {
    const reportData = this.state.reportData || {};
    const columns = reportData.ycolumns || reportData.columns || [];

    const chartHeight = ReportChart.LineHeight * columns.length + X_AXIS_HEIGHT;
    const totalIssuesCount = columns.reduce(
      (totalSize, column) => totalSize + column.size,
      0
    );

    const title = totalIssuesCount === 1
      ? i18n('1 issue total')
      : i18n('{{totalIssuesCount}} issues total', {totalIssuesCount});

    const getOnChangeReportPresentationCallback = tabId =>
      () => this.setState({activeTab: tabId});

    return (
      <div className="report-chart">
        <div
          className="report-chart__title"
          style={{height: ReportChart.LineHeight, lineHeight: `${ReportChart.LineHeight}px`}}
        >
          <div className="report-chart__label report-chart__label_title">
            { title }
          </div>
          <div className="report-chart__body" style={{display: 'none'}}>
            <Link
              className="report-chart__chart-type-switcher"
              active={this.state.activeTab === ReportChart.Tabs.Bars}
              onClick={
                getOnChangeReportPresentationCallback(ReportChart.Tabs.Bars)
              }
            >
              { i18n('Bars') }
            </Link>
            <Link
              className="report-chart__chart-type-switcher"
              active={this.state.activeTab === ReportChart.Tabs.Table}
              onClick={
                getOnChangeReportPresentationCallback(ReportChart.Tabs.Table)
              }
            >
              { i18n('Table') }
            </Link>
          </div>
        </div>
        <div className="report-chart__sort-order-bar">
          <div className="report-chart__sort-order report-chart__sort-order_main">
            <ReportChartSortOrder
              sortOrder={this.state.reportMainSortOrder}
              onChange={this.onChangeMainSortOrder}
              orientation={ReportChartSortOrder.Orientation.Vertical}
            />
            {
              this.state.reportMainAxisLabel &&
              <span className="report-chart__sort-order-label">
                { `(${this.state.reportMainAxisLabel})` }
              </span>
            }
          </div>
          <div className="report-chart__sort-order report-chart__sort-order_secondary">
            <ReportChartSortOrder
              sortOrder={this.state.reportSecondarySortOrder}
              onChange={this.onChangeSecondarySortOrder}
              orientation={ReportChartSortOrder.Orientation.Horizontal}
            />
            {
              this.state.reportSecondaryAxisLabel &&
              <span className="report-chart__sort-order-label">
                { `(${this.state.reportSecondaryAxisLabel})` }
              </span>
            }
          </div>
        </div>
        <div className="report-chart__body-wrapper">
          <div
            className="report-chart__labels"
            style={{height: chartHeight}}
          >
            {
              columns.map(column =>
                this.renderLineLabel(column, totalIssuesCount)
              )
            }
          </div>
          { this.renderChartBody(chartHeight) }
        </div>
      </div>
    );
  }
}

export default ReportChart;
