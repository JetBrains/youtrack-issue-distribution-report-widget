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
  id, text, meta, spentTime, childrenLines, estimation, totalSpentTime
) {
  return {id, meta, text, spentTime, childrenLines, estimation, totalSpentTime};
}

function makeMetaFromGroup(group, isIssueView) {
  const metaObj = getMetaObj();
  const isIssue = metaObj === group.meta.linkedIssue;
  if (!metaObj) {
    return null;
  }

  return {
    isUser: !isIssue,
    isIssue,
    id: isIssue ? metaObj.idReadable : metaObj.ringId,
    title: isIssue ? metaObj.idReadable : metaObj.visibleName,
    description: metaObj.isUser ? metaObj.postfix : metaObj.summary
  };

  function getMetaObj() {
    return group.meta[isIssueView ? 'linkedIssue' : 'linkedUser'] ||
      (group.meta.linkedIssue || group.meta.linkedUser);
  }
}

function makeMetaFromLine(line, isIssueView) {
  const id = getMetaId();

  const description = line.description || line.presentation;
  const title = (isIssueView ? id : line.userVisibleName) || description;
  if (!title) {
    return null;
  }
  return {
    id, title,
    description: description !== title ? description : undefined,
    isIssue: isIssueView,
    isUser: !isIssueView
  };

  function getMetaId() {
    return (isIssueView ? line.issueId : line.userId) || line.entityId;
  }
}

const TimeTrackingReportModel = {

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

  getColumnsHeader: (report, lastDayOfWeek) => {
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
      return ((data || {}).groups || []).map((group, groupIdx) => {
        const childLines = group.lines;
        const mappedChildLines = (childLines || []).map(
          (line, lineIdx) => makeLine(
            lineIdx,
            line.name,
            makeMetaFromLine(line, isIssueView),
            line.duration,
            [],
            line.estimation,
            line.totalDuration
          )
        );
        const meta = makeMetaFromGroup(group, isIssueView);
        return makeLine(
          groupIdx, group.name, meta, group.duration, mappedChildLines
        );
      });
    }

    return ((data || {}).groups || []).map((group, groupIdx) => {
      const childLines = group[isIssueView ? 'issueLines' : 'userLines'];
      childLines.isIssue = isIssueView;
      childLines.isUser = !isIssueView;
      const mappedChildLines = (childLines || []).map(
        (line, lineIdx) => {
          const meta = makeMetaFromLine(line, isIssueView);
          return makeLine(
            lineIdx,
            line.presentation,
            meta,
            line.spentTime,
            [],
            line.estimation,
            line.totalSpentTime
          );
        }
      );
      return makeLine(
        groupIdx,
        group.name,
        makeMetaFromGroup(group, isIssueView),
        group.spentTime,
        mappedChildLines
      );
    });
  },

  getTotalSpentTime: report => {
    const {data} = report;
    return isTimeReport(report) ? data.duration : data.spentTime;
  }
};

export default TimeTrackingReportModel;
