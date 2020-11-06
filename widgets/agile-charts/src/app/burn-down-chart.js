import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import ChartPresentationModel from './chart-presentation-model';
import './nv-burn-down-chart';

const nv = window.nv;
const GRAPH_TRANSITION_DURATION = 350;
const CHART_MARGIN = 22;

class BurnDownChart extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    datePattern: PropTypes.string,
    dateNoYearPattern: PropTypes.string
  };

  static defaultProps = {
    datePattern: 'DD/MM YYYY',
    dateNoYearPattern: 'DD/MM'
  };

  constructor(props) {
    super(props);

    this.state = {
      reportData: props.reportData
    };
  }

  componentWillReceiveProps(props) {
    if (props.reportData || props.dateNoYearPattern || props.datePattern) {
      this.setState(
        {reportData: props.reportData},
        () => this.drawBarChart()
      );
    }
  }

  drawBarChart = () => {
    const barChartNode = this.barChartNode;
    if (!barChartNode) {
      return;
    }

    const {reportData} = this.state;
    const chartModelData =
      ChartPresentationModel.getBurnDownChartModelData(reportData);

    nv.addGraph(() => {
      const dateTickFormatter = ChartPresentationModel.makeDateTickFormatter(
        this.props.dateNoYearPattern, this.props.datePattern
      );

      const multiBarHorizontalChart = nv.models.burnDownChart();
      const chart = multiBarHorizontalChart.
        margin({
          top: 0,
          left: CHART_MARGIN + CHART_MARGIN,
          right: CHART_MARGIN + CHART_MARGIN,
          bottom: CHART_MARGIN
        }).
        x(d => d.date).
        y(d => d.value).
        useInteractiveGuideline(true).
        transitionDuration(GRAPH_TRANSITION_DURATION).
        xScale(ChartPresentationModel.getXScale()).
        yScale(ChartPresentationModel.getYScale(reportData.yaxisType)).
        behindScheduleKey(i18n('Behind Schedule')).
        aheadOfScheduleKey(i18n('Ahead of Schedule'));

      const chartModelDomain =
        ChartPresentationModel.getChartModelDomain(chartModelData);
      if (chartModelDomain) {
        chart.yDomain(chartModelDomain);
      }

      chart.xAxis.
        axisLabel(reportData.xlabel).
        tickFormat(dateTickFormatter.formatLabel).
        showMaxMin(false);

      chart.yAxis.
        axisLabel(reportData.ylabel).
        tickFormat(
          ChartPresentationModel.getYAxisTickFormat(reportData.yaxisType)
        );

      chart.interactiveLayer.tooltip.
        headerFormatter(dateTickFormatter.formatHeader);

      d3.select(barChartNode).
        datum(chartModelData).
        call(chart);

      nv.utils.windowResize(chart.update);
    });
  };

  onGetSvgNode = barChartNode => {
    this.barChartNode = barChartNode;
    this.drawBarChart();
  };

  render() {
    return (
      <div
        className="report-chart__body"
      >
        <svg ref={this.onGetSvgNode} width="100%"/>
      </div>
    );
  }
}

export default BurnDownChart;
