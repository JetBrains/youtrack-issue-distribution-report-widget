import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import ButtonGroup from '@jetbrains/ring-ui/components/button-group/button-group';
import Button from '@jetbrains/ring-ui/components/button/button';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import FilterFieldValue from '../../../../components/src/filter-field-value/filter-field-value';

import ReportChartSortOrder from './report-chart-sort-order';
import ReportModel from './report-model';
import PieChartPresentation from './pie-chart-presentation';
import BarsChartPresentation from './bars-chart-presentation';
import './nv-flex-pie-chart';

const X_AXIS_HEIGHT = 22;

class ReportChart extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    presentationMode: PropTypes.string,
    reportMainSortOrder: PropTypes.string,
    reportSecondarySortOrder: PropTypes.string,
    reportMainAxisLabel: PropTypes.string,
    reportSecondaryAxisLabel: PropTypes.string,
    aggregationTitle: PropTypes.string,
    onChangeSortOrders: PropTypes.func,
    onChangePresentationMode: PropTypes.func,
    homeUrl: PropTypes.string
  };

  static PresentationModes = {
    Bars: 'DEFAULT',
    Table: 'MATRIX',
    Pie: 'PIE'
  };

  static LineHeight = 22; // eslint-disable-line no-magic-numbers

  static getBarsChartHeight = columns =>
    ReportChart.LineHeight * columns.length + X_AXIS_HEIGHT;

  static getSearchUrl = (columnUrl, homeUrl) =>
    `${homeUrl}/issues?q=${encodeURIComponent(columnUrl)}`;

  static isStackedChart = reportData =>
    !!(reportData.xcolumns && reportData.ycolumns);

  static getBarsChartModel = reportData => {
    if (ReportChart.isStackedChart(reportData)) {
      return reportData.xcolumns.map(xCol => ({
        key: xCol.name,
        name: xCol.name,
        user: xCol.user,
        values: reportData.ycolumns.map(yCol => ({
          key: yCol.name,
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
      reportSecondaryAxisLabel: props.reportSecondaryAxisLabel
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
    const isActiveIdx = this.state.activeLineIdx === idx;

    return (
      <div
        key={`report-label-${column.name}`}
        className={`report-chart__line-label${isActiveIdx ? ' report-chart__line-label_active' : ''}`}
      >
        <FilterFieldValue
          value={column}
          homeUrl={this.props.homeUrl}
        />
      </div>
    );
  }

  renderLineSize(column, idx) {
    const sizePresentation = `${ReportModel.getSizePresentation(column.size)}`;
    if (`${ReportModel.getSizeValue(column.size)}` !== sizePresentation) {
      return '';
    }

    const isActiveIdx = this.state.activeLineIdx === idx;

    return (
      <div
        className={`report-chart__size${isActiveIdx ? ' report-chart__size_active' : ''}`}
        key={`report-label-size-${idx}`}
      >
        { sizePresentation }
      </div>
    );
  }

  renderLinePercents(column, totalCount, idx) {
    const toPercentsMultiplier = 100;
    const getSizeInPercents = size => (totalCount
      ? `${Math.round(ReportModel.getSizeValue(size) / totalCount * toPercentsMultiplier)}%`
      : '');

    const isActiveIdx = this.state.activeLineIdx === idx;

    return (
      <div
        className={`report-chart__size-in-percents${isActiveIdx ? ' report-chart__size-in-percents_active' : ''}`}
        key={`report-label-percents-${idx}`}
      >
        { getSizeInPercents(column.size) }
      </div>
    );
  }

  renderPieChart() {
    return (
      <PieChartPresentation
        reportData={this.props.reportData}
        homeUrl={this.props.homeUrl}
      />
    );
  }

  renderBarsChart(height) {
    return (
      <BarsChartPresentation
        reportData={this.props.reportData}
        height={height}
        homeUrl={this.props.homeUrl}
      />
    );
  }

  renderTableCell(row, rowIdx) {
    const sizeValue = ReportModel.getSizeValue(
      row.size
    );
    const sizePresentation = sizeValue
      ? ReportModel.getSizePresentation(row.size)
      : '-';

    const onClick = () => {
      if (sizeValue) {
        const url = ReportChart.getSearchUrl(
          row.issuesQuery, this.props.homeUrl
        );
        window.open(url, '_blank');
      }
    };

    const onMouseOver = () =>
      this.setState({activeLineIdx: rowIdx});

    const isActiveIdx = this.state.activeLineIdx === rowIdx;

    return (
      <div
        key={`column-row-key-${rowIdx}`}
        className={`report-chart__table-cell${isActiveIdx ? ' report-chart__table-cell_active' : ''}`}
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
      </div>
    );
  }

  renderColumn(column) {
    return (
      <div className="report-chart__table-column">
        {
          column.values.map((row, idx) =>
            this.renderTableCell(row, idx)
          )
        }
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
        <div className="report-chart__table-header">
          {
            model.map(column => (
              <div
                key={`column-key-${column.name}`}
                className="report-chart__table-header-cell"
              >
                <FilterFieldValue
                  value={column}
                  homeUrl={this.props.homeUrl}
                />
              </div>
            ))
          }
        </div>
        <div
          className="report-chart__table"
          onMouseLeave={this.clearActiveLineIndex}
        >
          {
            model.map(column => this.renderColumn(column))
          }
        </div>
      </div>
    );
  }

  renderChartBody(chartHeight) {
    if (this.props.presentationMode === ReportChart.PresentationModes.Bars) {
      return this.renderBarsChart(chartHeight);
    }
    if (this.props.presentationMode === ReportChart.PresentationModes.Pie) {
      return this.renderPieChart();
    }
    return this.renderTable();
  }

  renderLinesLabels() {
    const reportData = this.state.reportData || {};
    const columns = reportData.ycolumns || reportData.columns || [];

    const chartHeight = ReportChart.getBarsChartHeight(columns);
    const totalCount = ReportModel.getSizeValue(reportData.total);

    return (
      <div>
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
                columns.map((column, idx) =>
                  this.renderLineSize(column, idx)
                )
              }
            </div>
            <div className="report-chart__labels-column">
              {
                columns.map((column, idx) =>
                  this.renderLinePercents(column, totalCount, idx)
                )
              }
            </div>
          </div>
          { this.renderChartBody(chartHeight) }
        </div>
      </div>
    );
  }

  renderChartArea() {
    if (this.props.presentationMode === ReportChart.PresentationModes.Pie) {
      return this.renderPieChart();
    }
    return this.renderLinesLabels();
  }

  render() {
    const {presentationMode: mode} = this.props;
    const reportData = this.state.reportData || {};
    const title = `${this.props.aggregationTitle || i18n('Total')}: ${ReportModel.getSizePresentation(reportData.total)}`;

    const isTwoDimensionalChart = ReportChart.isStackedChart(reportData);

    const getOnChangeReportPresentationCallback = presentationMode =>
      () => this.props.onChangePresentationMode(
        presentationMode
      );

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
                active={mode === ReportChart.PresentationModes.Bars}
                onClick={getOnChangeReportPresentationCallback(
                  ReportChart.PresentationModes.Bars
                )}
              >
                { i18n('Bars') }
              </Button>
              {
                isTwoDimensionalChart &&
                <Button
                  className="report-chart__chart-type-switcher"
                  active={mode === ReportChart.PresentationModes.Table}
                  onClick={getOnChangeReportPresentationCallback(
                    ReportChart.PresentationModes.Table
                  )}
                >
                  { i18n('Table') }
                </Button>
              }
              {
                !isTwoDimensionalChart &&
                <Button
                  className="report-chart__chart-type-switcher"
                  active={mode === ReportChart.PresentationModes.Pie}
                  onClick={getOnChangeReportPresentationCallback(
                    ReportChart.PresentationModes.Pie
                  )}
                >
                  { i18n('Pie chart') }
                </Button>
              }
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
        {this.renderChartArea()}
      </div>
    );
  }
}

export default ReportChart;
