import fecha from 'fecha';
import DashboardAddons from 'hub-dashboard-addons';

import ReportTimeScales from '../../../../components/src/report-model/report-time-scales';

const DEFAULT_LAST_DAY_OF_WEEK = (
  // eslint-disable-next-line no-magic-numbers
  locale => ((locale === 'en' || locale === 'ja') ? 6 : 0)
)(DashboardAddons.locale);

const TWO_WEEKS_DAY_COUNT = 14;

const isNextMonthOrLater = (dateA, dateB) => (
  dateA.getMonth() > dateB.getMonth() ||
  dateA.getFullYear() > dateB.getFullYear()
);

const toLocalDayStart = millis => {
  const date = new Date(parseInt(millis, 10));
  return new Date(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0
  );
};

const dayLegendFormatter = (idx, start) =>
  ((start.getDate() === 0 || idx % TWO_WEEKS_DAY_COUNT === 0)
    ? fecha.format(start, 'MMM YYYY')
    : '');

const weekLegendFormatter = (idx, start, prevStart) => (
  (idx === 0 || (prevStart && isNextMonthOrLater(start, prevStart)))
    ? fecha.format(start, 'MMM')
    : ''
);

const monthLegendFormatter = (idx, start, prevStart) => (
  (idx === 0 || (prevStart && start.getFullYear() > prevStart.getFullYear()))
    ? fecha.format(start, 'YYYY')
    : ''
);

const legendFormatters = {
  [ReportTimeScales.Day.id]: dayLegendFormatter,
  [ReportTimeScales.Week.id]: weekLegendFormatter,
  [ReportTimeScales.Month.id]: monthLegendFormatter
};

const dayTitleFormatter = (idx, start) =>
  fecha.format(start, 'D ddd');

const weekTitleFormatter = (idx, start, end) =>
  `${fecha.format(start, 'DD') }-${ fecha.format(end, 'DD')}`;

const monthTitleFormatter = (idx, start) =>
  fecha.format(start, 'MMM');


const titleFormatters = {
  [ReportTimeScales.Day.id]: dayTitleFormatter,
  [ReportTimeScales.Week.id]: weekTitleFormatter,
  [ReportTimeScales.Month.id]: monthTitleFormatter
};


const dayTitleSeparatorCondition = (start, nextStart, lastDayOfWeek) =>
  (start.getDay() === lastDayOfWeek);

const weekTitleSeparatorCondition = (start, nextStart) =>
  (nextStart ? isNextMonthOrLater(nextStart, start) : false);

const monthTitleSeparatorCondition = (start, nextStart) =>
  (nextStart ? start.getFullYear() < nextStart.getFullYear() : false);

const titleSeparatorConditions = {
  [ReportTimeScales.Day.id]: dayTitleSeparatorCondition,
  [ReportTimeScales.Week.id]: weekTitleSeparatorCondition,
  [ReportTimeScales.Month.id]: monthTitleSeparatorCondition
};


const ReportTimeScalesFormatters = {
  getLegend: (scaleId, headers, idx) => {
    const header = headers[idx];
    const start = toLocalDayStart(header.start);
    const prevStart = idx > 0
      ? toLocalDayStart(headers[idx - 1].start)
      : null;
    return legendFormatters[scaleId](idx, start, prevStart);
  },

  getTitle: (scaleId, header) =>
    titleFormatters[scaleId](
      scaleId, toLocalDayStart(header.start), toLocalDayStart(header.end)
    ),

  isHoliday: (scaleId, header) =>
    (scaleId === ReportTimeScales.Day.id
      ? header.holiday
      : false),

  hasTitleSeparator: (
    scaleId, headers, idx, lastDayOfWeek = DEFAULT_LAST_DAY_OF_WEEK
  ) => (
    titleSeparatorConditions[scaleId](
      toLocalDayStart(headers[idx].start),
      headers[idx + 1] && toLocalDayStart(headers[idx + 1].start),
      lastDayOfWeek
    )
  )
};

export default ReportTimeScalesFormatters;
