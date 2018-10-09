import {
  getReportTypePresentation,
  isTypeWithEditableXAxis
} from './ditribution-report-types';

const SortOrderComparators = {
  getAscComparatorForProperty: propertyName =>
    (firstColumn, secondColumn) => {
      if (firstColumn[propertyName] === secondColumn[propertyName]) {
        return 0;
      }
      return firstColumn[propertyName] < secondColumn[propertyName] ? -1 : 1;
    },

  countIndexAsc: (firstColumn, secondColumn) =>
    SortOrderComparators.getAscComparatorForProperty('size')(
      firstColumn, secondColumn
    ),

  countIndexDesc: (firstColumn, secondColumn) =>
    SortOrderComparators.countIndexAsc(secondColumn, firstColumn),

  displayNameAsc: (firstColumn, secondColumn) =>
    SortOrderComparators.getAscComparatorForProperty('naturalSortIndex')(
      firstColumn, secondColumn
    ),

  displayNameDesc: (firstColumn, secondColumn) =>
    SortOrderComparators.displayNameAsc(secondColumn, firstColumn)
};

const SortOrder = {
  ByCount: {
    Asc: 'COUNT_INDEX_ASC',
    Desc: 'COUNT_INDEX_DESC'
  },

  Naturally: {
    Asc: 'DISPLAY_NAME_ASC',
    Desc: 'DISPLAY_NAME_DESC'
  },

  All: ['COUNT_INDEX_ASC', 'COUNT_INDEX_DESC', 'DISPLAY_NAME_ASC', 'DISPLAY_NAME_DESC'],

  getSortOrderComparator: sortOrder => ({
    [SortOrder.ByCount.Asc]: SortOrderComparators.countIndexAsc,
    [SortOrder.ByCount.Desc]: SortOrderComparators.countIndexDesc,
    [SortOrder.Naturally.Asc]: SortOrderComparators.displayNameAsc,
    [SortOrder.Naturally.Desc]: SortOrderComparators.displayNameDesc
  })[sortOrder],

  applySortOrderToColumns: (report, columnsPropertyName, sortOrder) => {
    if (report.data && report.data[columnsPropertyName]) {
      report.data[columnsPropertyName] = report.data[columnsPropertyName].sort(
        SortOrder.getSortOrderComparator(sortOrder)
      );
    }
  },

  getMainAxisSortOrder: report =>
    (report.ysortOrder
      ? report.ysortOrder
      : (report.xsortOrder || SortOrder.ByCount.Desc)),

  setMainAxisSortOrder: (report, newMainSortOrder) => {
    if (report.ysortOrder) {
      report.ysortOrder = newMainSortOrder;
      SortOrder.applySortOrderToColumns(report, 'ycolumns', newMainSortOrder);
    } else {
      report.xsortOrder = newMainSortOrder;
      SortOrder.applySortOrderToColumns(report, 'columns', newMainSortOrder);
    }
    return report;
  },

  getSecondaryAxisSortOrder: report =>
    (report.yaxis ? report.xsortOrder : undefined),

  setSecondaryAxisSortOrder: (report, secondarySortOrder) => {
    if (report.yaxis) {
      report.xsortOrder = secondarySortOrder;
      SortOrder.applySortOrderToColumns(report, 'xcolumns', secondarySortOrder);
    }
    return report;
  },

  isEditable: report =>
    isTypeWithEditableXAxis(report) && report.own
};

const DistributionReportAxises = {
  SortOrder,

  getMainAxis: report =>
    report.yaxis || report.xaxis,

  getSecondaryAxis: report =>
    (report.yaxis ? report.xaxis : undefined),

  getMainAxisPresentation: report =>
    getReportTypePresentation(report),

  getSecondaryAxisPresentation: report => {
    const secondaryAxis = DistributionReportAxises.getSecondaryAxis(report);
    return secondaryAxis && secondaryAxis.field &&
      secondaryAxis.field.presentation;
  }
};


export default DistributionReportAxises;
