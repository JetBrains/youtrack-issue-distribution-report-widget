const USER_FIELDS = 'id,ringId,login,name,avatarUrl,email';

const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation';

const REPORT_DATA_COLUMN_FIELDS = `id,name,size(value,presentation),naturalSortIndex,index,user(${USER_FIELDS}),colorIndex(id,foreground,background),issuesQuery,queryUrl`;
const REPORT_FIELDS = `id,name,owner(${USER_FIELDS}),pinned,own,xaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),yaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),aggregationPolicy(id,field(${REPORT_FILTER_FIELDS_FIELDS})),xsortOrder,ysortOrder,presentation`;
const REPORT_STATUS_FIELDS = 'id,calculationInProgress,progress,error,errorMessage';
const REPORT_WITH_DATA_FIELDS = `${REPORT_FIELDS},data(tooBig,total(value,presentation),columns(${REPORT_DATA_COLUMN_FIELDS}),xcolumns(${REPORT_DATA_COLUMN_FIELDS}),ycolumns(${REPORT_DATA_COLUMN_FIELDS}),counts(value,presentation),issuesQueries),status(${REPORT_STATUS_FIELDS})`;

async function saveReportSettings(
  fetchYouTrack, report, isFullReportWithDataResponse
) {
  const reportIdPart = report.id ? `/${report.id}` : '';
  const fields = isFullReportWithDataResponse
    ? REPORT_WITH_DATA_FIELDS
    : REPORT_FIELDS;
  return await fetchYouTrack(`api/reports${reportIdPart}?fields=${fields}`, {
    method: 'POST',
    body: report
  });
}

async function recalculateReport(fetchYouTrack, report) {
  return await fetchYouTrack(`api/reports/${report.id}/status?fields=calculationInProgress,progress`, {
    method: 'POST',
    body: {
      calculationInProgress: true
    }
  });
}

export {
  saveReportSettings,
  recalculateReport
};
