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

    return (reportData.names || []).map((name, i) => {
      const colorIndex = reportData.colors[i];
      hasPredefinedColor = hasPredefinedColor || colorIndex > 0;
      const values = (reportData.sample || []).map(dayData => ({
        date: format.parse(dayData.date),
        value: dayData.values[i].value,
        presentation: dayData.values[i].presentation
      }));

      return {key: name, values, colorIndex};
    }).reverse();
  },

  getChartModelDomain: chartModelData => {
    if (!chartModelData.length) {
      return null;
    }

    const domain = d3.extent(
      d3.merge(
        chartModelData.map(
          series => series.values.map(d => d.value)
        )
      )
    );

    const DOMAIN_GAP = 15;
    return (domain && Number.isInteger(domain[0]) && domain[0] === domain[1])
      ? [domain[0], domain[0] + DOMAIN_GAP]
      : null;
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
  },

  getXScale: () => d3.time.scale(),

  getYScale: yaxisType => {
    const typeName = ((yaxisType || {}).name || '').toLowerCase();

    return typeName === 'period'
      ? periodLinearScale([0, 1], [0, 1])
      : d3.scale.linear();

    function periodLinearScale(initialDomain, initialRange) {
      let domain = initialDomain;
      let range = initialRange;
      let output;
      let input;

      function linear(uninterpolate, interpolate) {
        const u = uninterpolate(domain[0], domain[1]);
        const i = interpolate(range[0], range[1]);
        return x => i(u(x));
      }

      function uninterpolateNumber(a, b) {
        // eslint-disable-next-line no-param-reassign
        return x => ((x - a) * (b - (a = +a) ? 1 / (b - a) : 0));
      }

      function rescale() {
        output = linear(uninterpolateNumber, d3.interpolateNumber);
        input = linear(uninterpolateNumber, d3.interpolateNumber);
        return scale;
      }

      function scale(x) {
        return output(x);
      }

      scale.invert = y => input(y);
      scale.domain = x => {
        if (!x) {
          return domain;
        }
        domain = x.map(Number);
        return rescale();
      };
      scale.range = x => {
        if (!x) {
          return range;
        }
        range = x;
        return rescale();
      };
      scale.ticks = m => {
        const start = domain[0];
        const stop = domain[1];
        const extent = start < stop ? [start, stop] : [stop, start];
        const minInHour = 60;
        const defaultM = 10;
        const scaledMinutes = Math.floor(
          (extent[1] - extent[0]) / (m || defaultM)
        );
        const hours = Math.floor(scaledMinutes / minInHour);
        const step = hours ? hours * minInHour : (scaledMinutes % minInHour);
        extent[0] = Math.ceil(extent[0] / step) * step;
        // eslint-disable-next-line no-magic-numbers
        extent[1] = Math.floor(extent[1] / step) * step + 0.5 * step;
        return d3.range(extent[0], extent[1], step);
      };
      scale.copy = () => periodLinearScale(domain, range);
      return rescale();
    }
  }
};

export default ChartPresentationModel;
