import d3 from 'd3';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import fecha from 'fecha';

const BurnDownChartColors = {
  ideal: '#76a800',
  remaining: '#25b7ff',
  spent: '#c6dbef',
  overdue: '#fd8d3c'
};

const ChartPresentationModel = {
  getBurnDownChartModelData: reportData => {
    const format = d3.time.format('%Y-%m-%d');
    const convertPoint = rawPoint => ({
      date: format.parse(rawPoint.time),
      value: rawPoint.value
    });

    const sprintFinishDate = format.parse(reportData.sprintFinish);
    const idealBurndown = reportData.ideal.map(convertPoint);
    const remainingEstimation =
      reportData.remainingEstimation.map(convertPoint);
    const remainingInSprint = remainingEstimation.filter(
      point => point.date <= sprintFinishDate
    );
    const remainingOutSprint = remainingEstimation.filter(
      point => point.date >= sprintFinishDate
    );
    const data = [{
      key: i18n('Ideal Burndown'),
      values: idealBurndown,
      color: BurnDownChartColors.ideal
    }, {
      key: i18n('Remaining Effort'),
      values: remainingInSprint,
      color: BurnDownChartColors.remaining
    }];

    if (reportData.cumulativeSpentTime &&
      reportData.cumulativeSpentTime.length > 0) {
      data.push({
        key: i18n('Spent time'),
        values: reportData.cumulativeSpentTime.map(convertPoint),
        color: BurnDownChartColors.spent
      });
    }
    if (remainingOutSprint.length > 0) {
      data.push({
        key: i18n('Overdue effort'),
        values: remainingOutSprint,
        color: BurnDownChartColors.overdue
      });
    }

    return data;
  },

  getCumulativeFlowChartModelData: reportData => {
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
  },

  getChartModelDomain: chartModelData => {
    let domain = (chartModelData.length === 0)
      ? null
      : d3.extent(
        d3.merge(
          chartModelData.map(
            series => series.values.map(d => d.value)
          )
        )
      );

    const DOMAIN_GAP = 15;
    if (domain && (domain[0] || domain[0] === 0) && (domain[0] === domain[1])) {
      domain = [domain[0], domain[0] + DOMAIN_GAP];
    }

    return domain;
  },

  getXAxisTickFormat: datePattern =>
    dateOrTimestamp => {
      const date = typeof dateOrTimestamp === 'number'
        ? new Date(dateOrTimestamp)
        : dateOrTimestamp;
      const accurate = date.getHours() === 0 &&
        date.getMinutes() === 0 &&
        date.getSeconds() === 0;
      return accurate ? fecha.format(date, datePattern) : '';
    },

  getYAxisTickFormat: yaxisType => {
    const typeName = ((yaxisType || {}).name || '').toLowerCase();

    if (typeName === 'float') {
      return d3.format('r');
    }

    if (typeName === 'period') {
      const minInHour = 60;
      const units = i18n('h|m').split('|');

      return value => {
        if (!value) {
          return '0';
        }
        const hours = Math.floor(value / minInHour);
        const minutes = value % minInHour;
        return [hours, minutes].map(
          (timeValue, idx) => (timeValue ? `${timeValue}${units[idx]}` : '')
        ).join('') || '0';
      };
    }

    return d3.format('d');
  }
};

export default ChartPresentationModel;
