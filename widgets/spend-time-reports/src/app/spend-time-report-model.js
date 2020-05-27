import BackendTypes
  from '../../../../components/src/backend-types/backend-types';

import ReportTimeScalesFormatters
  from './report-time-scales-header-formatters';

function isTimeReport(report) {
  return BackendTypes.entityOfType(
    report, [BackendTypes.get().TimeReport]
  );
}

function makeLine(
  text, meta, spentTime, childrenLines, estimation, totalSpentTime
) {
  return {meta, text, spentTime, childrenLines, estimation, totalSpentTime};
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
    const {data, scale} = report;

    if (isTimeReport(report)) {
      return (data.typeDurations || []).map((line, idx) => ({
        id: idx,
        text: line.workType,
        spentTime: line.duration,
        hasRightSeparator: false,
        showZero: false,
        hasHighlight: false
      }));
    }

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
      showZero: !ReportTimeScalesFormatters.isHoliday(scaleId, header),
      hasHighlight: ReportTimeScalesFormatters.isHoliday(scaleId, header)
    }));
  },

  getDetailedGroupedLines: (report, isIssueView) => {
    const {data} = report;

    if (isTimeReport(report)) {
      return (data.groups || []).map((group, idx) => ({
        id: idx,
        line: (group.typeDurations || []).map(it => it.duration),
        childrenLines: (group.lines || []).map((line, lineIdx) => ({
          id: lineIdx,
          cells: (line.typeDurations || []).map(it => it.duration)
        }))
      }));
    }

    return (data.groups || []).map((group, idx) => {
      const lines = (isIssueView ? group.issueLines : group.userLines) || [];
      return {
        id: idx,
        line: group.lineSpentTime,
        childrenLines: lines
      };
    });
  },

  getGeneralGroupedLines: (report, isIssueView) => {
    const {data} = report;

    if (isTimeReport(report)) {
      return ((data || {}).groups || []).map(group => {
        const childLines = group.lines;
        const mappedChildLines = (childLines || []).map(
          line => {
            const meta = line.entityId ? {
              id: line.entityId,
              name: line.presentation
            } : null;
            return makeLine(
              line.name,
              meta,
              line.duration,
              [],
              line.estimation,
              line.totalDuration
            );
          }
        );
        const meta = group.meta[isIssueView ? 'linkedIssue' : 'linkedUser'];
        return makeLine(group.name, meta, group.duration, mappedChildLines);
      });
    }

    return ((data || {}).groups || []).map(group => {
      const childLines = group[isIssueView ? 'issueLines' : 'userLines'];
      const mappedChildLines = (childLines || []).map(
        line => {
          const meta = line.entityId ? {
            id: line.entityId,
            name: line.presentation
          } : null;
          return makeLine(
            line.presentation,
            meta,
            line.spentTime,
            [],
            line.estimation,
            line.totalSpentTime
          );
        }
      );
      const meta = group.meta[isIssueView ? 'linkedIssue' : 'linkedUser'];
      return makeLine(group.name, meta, group.spentTime, mappedChildLines);
    });
  },

  getTotalSpentTime: report => {
    const {data} = report;
    return isTimeReport(report) ? data.duration : data.spentTime;
  }
};

export default SpendTimeReportModel;
