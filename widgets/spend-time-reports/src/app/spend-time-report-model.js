import BackendTypes
  from '../../../../components/src/backend-types/backend-types';

import ReportTimeScalesFormatters
  from './report-time-scales-header-formatters';

function isTimeReport(report) {
  return BackendTypes.entityOfType(
    report, [BackendTypes.get().TimeReport]
  );
}

const SpendTimeReportModel = {

  getColumnsLegend: report => {
    if (isTimeReport(report)) {
      return [];
    }

    const {data, scale} = report;
    const scaleId = (scale || {}).id;
    const headers = (data || {}).headers || [];

    const idxLegendPairs = headers.map((header, startColumnIdx) => ({
      startColumnIdx,
      legendText:
        ReportTimeScalesFormatters.getLegend(scaleId, headers, startColumnIdx)
    })).filter(idLegendPair => !!idLegendPair.legendText);

    const legendColSpans = idxLegendPairs.map(({startColumnIdx}, idx) => {
      const isLastLegend = (idx + 1) === idxLegendPairs.length;
      return isLastLegend
        ? (Math.max(headers.length - startColumnIdx, 1))
        : (idxLegendPairs[idx + 1].startColumnIdx - startColumnIdx);
    });

    return idxLegendPairs.map(
      (it, idx) => ({
        ...it,
        ...{colSpan: legendColSpans[idx]}
      })
    );
  },

  getColumnsHeader: report => {
    if (isTimeReport(report)) {
      return [];
    }

    const {data, scale} = report;
    const scaleId = (scale || {}).id;
    const headers = (data || {}).headers || [];
    const lastDayOfWeek = 6;//todo

    return headers.map((header, idx) => ({
      id: header.start,
      text: ReportTimeScalesFormatters.getTitle(scaleId, header),
      spentTime: header.spentTime,
      hasRightSeparator: ReportTimeScalesFormatters.hasTitleSeparator(
        scaleId, headers, idx, lastDayOfWeek
      ),
      showZero: !ReportTimeScalesFormatters.isHoliday(scaleId, header)
    }));
  },

  getDetailedGroupedLines: () => {

  },

  getGeneralGroupedLines: () => {

  },

  getTableData: report => {
    const {data} = report;

    const requireTransformation =
      BackendTypes.entityOfType(report, [BackendTypes.get().TimeReport]);

    if (requireTransformation) {
      const headers = [];

      return {
        groups: data.groups,
        headers
      };
    }

    return data;
  }
};

export default SpendTimeReportModel;
