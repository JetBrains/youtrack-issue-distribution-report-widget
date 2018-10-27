import {REPORT_TYPES} from './distribution-report-types';

const REQUESTED_YOUTRACK_VERSION = '2018.1.41206';

const SERVICE_FIELDS = 'id,name,applicationName,homeUrl,version';

const USER_FIELDS = 'id,ringId,login,name,avatarUrl,email';
const USER_GROUP_FIELDS = 'id,name,icon';
const PROJECTS_FIELDS = 'id,name,shortName';

const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation';

const REPORT_DATA_COLUMN_FIELDS = `id,name,size,naturalSortIndex,index,user(${USER_FIELDS}),colorIndex(id,foreground,background),issuesQuery,queryUrl`;
const REPORT_FIELDS = `id,name,owner(${USER_FIELDS}),pinned,own,xaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),yaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),xsortOrder,ysortOrder`;
const REPORT_STATUS_FIELDS = 'id,calculationInProgress,progress,error,errorMessage';
const REPORT_WITH_DATA_FIELDS = `${REPORT_FIELDS},data(tooBig,columns(${REPORT_DATA_COLUMN_FIELDS}),xcolumns(${REPORT_DATA_COLUMN_FIELDS}),ycolumns(${REPORT_DATA_COLUMN_FIELDS}),counts,issuesQueries),status(${REPORT_STATUS_FIELDS})`;
const REPORT_WITH_SETTINGS_FIELDS = `${REPORT_FIELDS},projects(${PROJECTS_FIELDS}),query,own,visibleTo(id,name)`;

const QUERY_ASSIST_FIELDS = 'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';

async function underlineAndSuggest(fetchYouTrack, query, caret) {
  return await fetchYouTrack(`api/search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
    method: 'POST',
    body: {query, caret}
  });
}

async function loadProjects(fetchYouTrack) {
  return await fetchYouTrack(`api/admin/projects?fields=${PROJECTS_FIELDS}&$top=-1`);
}

async function loadReportWithData(fetchYouTrack, reportId) {
  return await fetchYouTrack(
    `api/reports/${reportId}?fields=${REPORT_WITH_DATA_FIELDS}`
  );
}

async function loadReportWithSettings(fetchYouTrack, reportId) {
  return await fetchYouTrack(
    `api/reports/${reportId}?fields=${REPORT_WITH_SETTINGS_FIELDS}`
  );
}

async function loadIssuesDistributionReports(fetchYouTrack) {
  const distributionReportTypes = Object.keys(REPORT_TYPES).
    map(fullReportTypeName => fullReportTypeName.split('.').pop()).
    join(',');

  return (
    await fetchYouTrack(`api/reports?fields=${REPORT_FIELDS}&$top=300&types=${distributionReportTypes}`)
  ) || [];
}

async function loadReportsFilterFields(fetchYouTrack, projects) {
  const fieldTypes = serializeArrayParameter('fieldTypes', [
    'version[1]', 'ownedField[1]', 'state[1]', 'user[1]', 'enum[1]', 'date', 'integer', 'float', 'period', 'project'
  ]);
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const params = [
    fieldTypes, fld, 'includeNonFilterFields=true', '$top=300', `fields=${REPORT_FILTER_FIELDS_FIELDS}`
  ].filter(param => param.length > 0).join('&');

  return await fetchYouTrack(`api/filterFields?${params}`);

  function serializeArrayParameter(paramName, arr) {
    return encodeURI(
      arr.map(item => `${paramName}=${item}`).join('&')
    );
  }
}

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

async function loadUserGroups(fetchYouTrack) {
  return await fetchYouTrack(
    `api/admin/groups?fields=${USER_GROUP_FIELDS}`
  );
}

async function loadCurrentUser(fetchHub) {
  return await fetchHub(
    `api/rest/users/me?fields=${USER_FIELDS}`
  );
}

async function getYouTrackServices(fetchHub) {
  const data = await fetchHub(`api/rest/services?fields=${SERVICE_FIELDS}&query=applicationName:YouTrack`);
  return (data && data.services || []).filter(
    service => !!service.homeUrl && satisfyingVersion(service.version)
  );

  // eslint-disable-next-line complexity
  function satisfyingVersion(currentVersion) {
    const currentVersionTokens = currentVersion.split('.').map(Number);
    const requestedVersionTokens = REQUESTED_YOUTRACK_VERSION.
      split('.').map(Number);
    for (let i = 0; i < requestedVersionTokens.length; ++i) {
      if ((currentVersionTokens[i] > requestedVersionTokens[i]) ||
        (!isNaN(currentVersionTokens[i]) && isNaN(requestedVersionTokens[i]))
      ) {
        return true;
      }
      if (requestedVersionTokens[i] > currentVersionTokens[i] ||
        (isNaN(currentVersionTokens[i]) && !isNaN(requestedVersionTokens[i]))
      ) {
        return false;
      }
    }
    return true;
  }
}

async function getYouTrackService(fetchHub, optionalYtId) {
  let services = await getYouTrackServices(fetchHub);
  if (optionalYtId) {
    services = services.filter(service => service.id === optionalYtId);
  }
  return services[0];
}

export {
  loadReportWithData,
  loadIssuesDistributionReports,
  loadReportWithSettings,
  loadReportsFilterFields,
  saveReportSettings,
  recalculateReport,
  getYouTrackServices,
  getYouTrackService,
  underlineAndSuggest,
  loadProjects,
  loadUserGroups,
  loadCurrentUser
};
