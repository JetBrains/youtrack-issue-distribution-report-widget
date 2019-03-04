import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';

import ChartPresentationModel from './chart-presentation-model';
import './nv-burn-down-chart';

const nv = window.nv;
const GRAPH_TRANSITION_DURATION = 350;
const CHART_MARGIN = 22;

class CumulativeFlowChart extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    datePattern: PropTypes.string
  };

  static defaultProps = {
    datePattern: 'YYYY-MM-DD'
  };

  constructor(props) {
    super(props);

    this.state = {
      reportData: props.reportData
    };
  }

  componentWillReceiveProps(props) {
    if (props.reportData) {
      this.setState(
        {reportData: props.reportData},
        () => this.drawChart()
      );
    }
  }

  drawChart = () => {
    const chartNode = this.chartNode;
    if (!chartNode) {
      return;
    }

    const {reportData} = this.state;
    const chartModelData =
      ChartPresentationModel.getCumulativeFlowChartModelData(reportData);

    nv.addGraph(() => {

      const chart = nv.models.stackedAreaChart().
        margin({
          top: 0,
          left: CHART_MARGIN + CHART_MARGIN,
          right: CHART_MARGIN + CHART_MARGIN,
          bottom: CHART_MARGIN
        }).
        x(d => d.date).
        y(d => d.value).
        useInteractiveGuideline(true).
        rightAlignYAxis(true).
        showControls(false).
        showLegend(true).
        transitionDuration(GRAPH_TRANSITION_DURATION).
        xScale(ChartPresentationModel.getXScale()).
        yScale(ChartPresentationModel.getYScale(reportData.yaxisType)).
        clipEdge(true);

      const chartModelDomain =
        ChartPresentationModel.getChartModelDomain(chartModelData);
      if (chartModelDomain) {
        chart.yDomain(chartModelDomain);
      }

      chart.xAxis.tickFormat(
        ChartPresentationModel.getXAxisTickFormat(this.props.datePattern)
      ).showMaxMin(true);

      chart.yAxis.tickFormat(
        ChartPresentationModel.getYAxisTickFormat(reportData.yaxisType)
      );

      d3.select(chartNode).
        datum(chartModelData).
        call(chart);

      nv.utils.windowResize(chart.update);
    });
  };

  onGetSvgNode = chartNode => {
    this.chartNode = chartNode;
    this.drawChart();
  };

  renderChartBody() {
    return (
      <div
        className="report-chart__body"
      >
        <svg ref={this.onGetSvgNode}/>
      </div>
    );
  }

  render() {
    return (
      <div className="report-chart">
        { this.renderChartBody() }
      </div>
    );
  }
}

export default CumulativeFlowChart;
