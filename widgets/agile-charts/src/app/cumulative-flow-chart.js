import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import './nv-burn-down-chart';

const nv = window.nv;
const GRAPH_TRANSITION_DURATION = 350;
const CHART_MARGIN = 22;

class CumulativeFlowChart extends React.Component {
  static propTypes = {
    reportData: PropTypes.object
  };

  static getChartModelData = reportData => {
    let hasPredefinedColor = false;
    const format = d3.time.format('%Y-%m-%d');

    return reportData.names.map((name, i) => {
      const colorIndex = reportData.colors[i];
      hasPredefinedColor = hasPredefinedColor || colorIndex > 0;
      const values = reportData.sample.map(dayData => ({
        date: format.parse(dayData.date),
        value: dayData.values[i].value,
        presentation: dayData.values[i].presentation
      }));

      return {key: name, values, colorIndex};
    }).reverse();
  };

  static getChartModelDomain = chartModelData => {
    let domain = (chartModelData.length === 0) ? null : d3.extent(
      d3.merge(
        chartModelData.map(
          series => series.values.map(d => d.value)
        )
      )
    );

    if (domain && (domain[0] || domain[0] === 0) && (domain[0] === domain[1])) {
      const DOMAIN_GAP = 15;
      domain = [domain[0], domain[0] + DOMAIN_GAP];
    } else {
      domain = null;
    }

    return domain;
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
    const chartModelData = CumulativeFlowChart.getChartModelData(reportData);

    nv.addGraph(() => {

      const chart = nv.models.stackedAreaChart().
        margin({
          top: 0, left: CHART_MARGIN, right: CHART_MARGIN, bottom: CHART_MARGIN
        }).
        x(d => d.date).
        y(d => d.value).
        useInteractiveGuideline(true).
        rightAlignYAxis(true).
        showControls(false).
        showLegend(true).
        transitionDuration(GRAPH_TRANSITION_DURATION).
        clipEdge(true);

      const chartModelDomain =
        CumulativeFlowChart.getChartModelDomain(chartModelData);
      if (chartModelDomain) {
        chart.yDomain(chartModelDomain);
      }

      chart.xAxis.tickFormat(d3.format(',.2f')).showMaxMin(true);
      chart.yAxis.tickFormat(d3.format('d'));

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
    const title = i18n('Total');

    return (
      <div className="report-chart">
        <div
          className="report-chart__title"
        >
          { title }
        </div>
        { this.renderChartBody() }
      </div>
    );
  }
}

export default CumulativeFlowChart;
