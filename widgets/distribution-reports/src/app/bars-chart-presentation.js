import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';

import ReportModel from '../../../../components/src/report-model/report-model';

const nv = window.nv;
const GRAPH_TRANSITION_DURATION = 350;

class BarsChartPresentation extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    height: PropTypes.number,
    homeUrl: PropTypes.string
  };

  static isStackedChart = reportData =>
    !!(reportData.xcolumns && reportData.ycolumns);

  static getBarsChartModel = reportData => {
    if (BarsChartPresentation.isStackedChart(reportData)) {
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
    const {reportData} = props;

    this.state = {
      chartModel: BarsChartPresentation.getBarsChartModel(reportData),
      isStacked: BarsChartPresentation.isStackedChart(reportData)
    };
  }

  componentWillReceiveProps(props) {
    const {reportData} = props;

    if (reportData) {
      this.setState({
        chartModel: BarsChartPresentation.getBarsChartModel(reportData),
        isStacked: BarsChartPresentation.isStackedChart(reportData)
      }, () => this.drawChart());
    }
  }

  drawChart = () => {
    const barChartNode = this.chartNode;
    if (!barChartNode) {
      return;
    }

    const {chartModel, isStacked} = this.state;
    const valueToPresentationMap = chartModel.reduce((resultMap, columnX) => {
      columnX.values.reduce((result, columnY) => {
        result[columnY.size] = columnY.presentation;
        return result;
      }, resultMap);
      return resultMap;
    }, {});

    nv.addGraph(() => {
      const multiBarHorizontalChart = nv.models.multiBarHorizontalChart();
      const chart = multiBarHorizontalChart.
        margin({
          left: 5,
          top: 0,
          right: 22,
          bottom: 22
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
        ReportModel.getSearchUrl(column.issuesQuery, this.props.homeUrl)
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
    if (barChartNode) {
      this.chartNode = barChartNode;
      this.drawChart();
    }
  };

  render() {
    const {height} = this.props;

    return (
      <div
        className="report-chart__body"
        style={{height}}
      >
        <svg ref={this.onGetSvgNode}/>
      </div>
    );
  }
}

export default BarsChartPresentation;
