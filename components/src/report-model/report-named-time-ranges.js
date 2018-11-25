import {i18n} from 'hub-dashboard-addons/dist/localization';

const ReportNamedTimeRanges = {
  Today: {
    id: 'TODAY',
    oneDayPeriod: true,
    text: () => i18n('Today')
  },
  Yesterday: {
    id: 'YESTERDAY',
    oneDayPeriod: true,
    text: () => i18n('Yesterday')
  },
  LastWorkingDay: {
    id: 'LAST_WORKING_DAY',
    oneDayPeriod: true,
    text: () => i18n('Last working day')
  },
  ThisWeek: {
    id: 'THIS_WEEK',
    text: () => i18n('This week')
  },
  ThisMonth: {
    id: 'THIS_MONTH',
    text: () => i18n('This month')
  },
  ThisYear: {
    id: 'THIS_YEAR',
    text: () => i18n('This year')
  },
  LastWeek: {
    id: 'LAST_WEEK',
    text: () => i18n('Last week')
  },
  LastMonth: {
    id: 'LAST_MONTH',
    text: () => i18n('Last month')
  }
};

function allRanges() {
  return Object.keys(ReportNamedTimeRanges).map(
    key => ReportNamedTimeRanges[key]
  );
}

function oneDayRanges() {
  return allRanges().filter(
    range => range.oneDayPeriod
  );
}

function severalDaysRanges() {
  return allRanges().filter(
    range => !range.oneDayPeriod
  );
}

export default {
  ...ReportNamedTimeRanges,

  oneDayRanges,
  severalDaysRanges,
  allRanges
};
