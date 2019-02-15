import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';
import Link from '@jetbrains/ring-ui/components/link/link';
import ButtonGroup from '@jetbrains/ring-ui/components/button-group/button-group';
import Button from '@jetbrains/ring-ui/components/button/button';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import FilterFieldValue from '../../../../components/src/filter-field-value/filter-field-value';

import ReportChartSortOrder from './report-chart-sort-order';
import ReportModel from './report-model';

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
    aggregationTitle: PropTypes.string,
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
        name: xCol.name,
        user: xCol.user,
        values: reportData.ycolumns.map(yCol => ({
          name: yCol.name,
          user: yCol.user,
          issuesQuery: reportData.issuesQueries[xCol.index][yCol.index],
          size: ReportModel.getSizeValue(
            reportData.counts[xCol.index][yCol.index]
          ),
          presentation: ReportModel.getSizePresentation(
            reportData.counts[xCol.index][yCol.index]
          )
        })),
        colorIndex: xCol.colorIndex
      }));
    }
    return ((reportData.columns || []).map(xCol => ({
      name: xCol.name,
      user: xCol.user,
      values: (reportData.columns || []).map(yCol => ({
        name: yCol.name,
        user: yCol.user,
        issuesQuery: yCol.issuesQuery,
        size: yCol.name === xCol.name
          ? ReportModel.getSizeValue(yCol.size)
          : 0,
        presentation: yCol.name === xCol.name
          ? ReportModel.getSizePresentation(yCol.size)
          : 0
      })),
      colorIndex: 1
    })));
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
    const chartModel = ReportChart.getBarsChartModel(reportData);
    const valueToPresentationMap = chartModel.reduce((resultMap, columnX) => {
      columnX.values.reduce((result, columnY) => {
        result[columnY.size] = columnY.presentation;
        return result;
      }, resultMap);
      return resultMap;
    }, {});

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
        stacked(true).
        state({
          stacked: true
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
      chart.yAxis.tickFormat(d => valueToPresentationMap[d] || '');

      d3.select(barChartNode).
        datum(chartModel).
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

  clearActiveLineIndex = () =>
    this.setState({activeLineIdx: null});

  renderLineLabel(column, idx) {
    const color = idx === this.state.activeLineIdx
      ? 'var(--ring-link-hover-color)'
      : undefined;

    return (
      <div
        key={`report-label-${column.name}`}
        style={{height: ReportChart.LineHeight, lineHeight: `${ReportChart.LineHeight}px`, overflow: 'hidden', color}}
      >
        <FilterFieldValue
          value={column}
          homeUrl={this.props.homeUrl}
        />
      </div>
    );
  }

  renderLineSize(column) {
    const sizePresentation = `${ReportModel.getSizePresentation(column.size)}`;
    if (`${ReportModel.getSizeValue(column.size)}` !== sizePresentation) {
      return '';
    }

    return (
      <div
        className="report-chart__size"
        key={`report-label-size-${column.name}`}
        style={{height: ReportChart.LineHeight, lineHeight: `${ReportChart.LineHeight}px`}}
      >
        { sizePresentation }
      </div>
    );
  }

  renderLinePercents(column, totalCount) {
    const toPercentsMultiplier = 100;
    const getSizeInPercents = size => (totalCount
      ? `${Math.round(ReportModel.getSizeValue(size) / totalCount * toPercentsMultiplier)}%`
      : '');

    return (
      <div
        className="report-chart__size-in-percents"
        key={`report-label-percents-${column.name}`}
        style={{height: ReportChart.LineHeight, lineHeight: `${ReportChart.LineHeight}px`}}
      >
        { getSizeInPercents(column.size) }
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

  renderTableCell(column, rowIdx) {
    const sizeValue = ReportModel.getSizeValue(
      column.values[rowIdx].size
    );
    const sizePresentation = sizeValue
      ? ReportModel.getSizePresentation(column.values[rowIdx].size)
      : '-';

    const onClick = () => {
      if (sizeValue) {
        const url = ReportChart.getSearchUrl(
          column.values[rowIdx].issuesQuery, this.props.homeUrl
        );
        window.open(url, '_blank');
      }
    };

    const onMouseOver = () =>
      this.setState({activeLineIdx: rowIdx});

    return (
      <td
        key={`column-row-key-${column.name}-${rowIdx}`}
        className="report-chart__table-cell"
        onMouseOver={onMouseOver}
        onClick={onClick}
      >
        {
          (sizeValue > 0) &&
          <Link pseudo={true}>
            {sizePresentation}
          </Link>
        }
        {
          (sizeValue === 0) &&
          <span>{sizePresentation}</span>
        }
      </td>
    );
  }

  renderTable() {
    const {reportData} = this.state;
    const model = ReportChart.getBarsChartModel(reportData);

    return (
      <div
        className="report-chart__body"
      >
        <table
          className="report-chart__table"
          onMouseLeave={this.clearActiveLineIndex}
        >
          <thead>
            <tr>
              {
                model.map(column => (
                  <th
                    key={`column-key-${column.name}`}
                    className="report-chart__table-header"
                  >
                    <FilterFieldValue
                      value={column}
                      homeUrl={this.props.homeUrl}
                    />
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
                    model.map(column => this.renderTableCell(column, idx))
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
    const totalCount = ReportModel.getSizeValue(reportData.total);
    const title = `${this.props.aggregationTitle || i18n('Total')}: ${ReportModel.getSizePresentation(reportData.total)}`;

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
          <div className="report-chart__title-settings">
            <ButtonGroup>
              <Button
                className="report-chart__chart-type-switcher"
                active={this.state.activeTab === ReportChart.Tabs.Bars}
                onClick={
                  getOnChangeReportPresentationCallback(ReportChart.Tabs.Bars)
                }
              >
                { i18n('Bars') }
              </Button>
              <Button
                className="report-chart__chart-type-switcher"
                active={this.state.activeTab === ReportChart.Tabs.Table}
                onClick={
                  getOnChangeReportPresentationCallback(ReportChart.Tabs.Table)
                }
              >
                { i18n('Table') }
              </Button>
            </ButtonGroup>
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
            <div className="report-chart__labels-column">
              {
                columns.map((column, idx) =>
                  this.renderLineLabel(column, idx)
                )
              }
            </div>
            <div className="report-chart__labels-column">
              {
                columns.map(column =>
                  this.renderLineSize(column, totalCount)
                )
              }
            </div>
            <div className="report-chart__labels-column">
              {
                columns.map(column =>
                  this.renderLinePercents(column, totalCount)
                )
              }
            </div>
          </div>
          { this.renderChartBody(chartHeight) }
        </div>
      </div>
    );
  }
}

export default ReportChart;
