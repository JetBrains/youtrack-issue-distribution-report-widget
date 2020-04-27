import BackendTypes
  from '../../../../components/src/backend-types/backend-types';

const REQUESTED_YOUTRACK_VERSION = '2020.1.3111';

const SERVICE_FIELDS = 'id,name,applicationName,homeUrl,version';

const USER_FIELDS = 'id,ringId,login,name,avatarUrl,email';
const PERMISSION_FIELDS = 'permission%2Fkey,global,projects(id)';
const USER_GROUP_FIELDS = 'id,name,icon,avatarUrl,allUsersGroup';
const PROJECTS_FIELDS = 'id,ringId,name,shortName';

const SHARING_SETTINGS_FIELDS = `permittedGroups(${USER_GROUP_FIELDS}),permittedUsers(${USER_FIELDS})`;

const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation';

const REPORT_DATA_COLUMN_FIELDS = `id,name,size(value,presentation),naturalSortIndex,index,user(${USER_FIELDS}),colorIndex(id,foreground,background),issuesQuery,queryUrl`;
const REPORT_FIELDS = `id,name,owner(${USER_FIELDS}),pinned,own,xaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),yaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),aggregationPolicy(id,field(${REPORT_FILTER_FIELDS_FIELDS})),xsortOrder,ysortOrder,presentation`;
const REPORT_STATUS_FIELDS = 'id,calculationInProgress,progress,error,errorMessage';
const REPORT_WITH_DATA_FIELDS = `${REPORT_FIELDS},data(tooBig,total(value,presentation),columns(${REPORT_DATA_COLUMN_FIELDS}),xcolumns(${REPORT_DATA_COLUMN_FIELDS}),ycolumns(${REPORT_DATA_COLUMN_FIELDS}),counts(value,presentation),issuesQueries),status(${REPORT_STATUS_FIELDS})`;
const REPORT_WITH_SETTINGS_FIELDS = `${REPORT_FIELDS},projects(${PROJECTS_FIELDS}),query,own,readSharingSettings(${SHARING_SETTINGS_FIELDS}),updateSharingSettings(${SHARING_SETTINGS_FIELDS})`;

const QUERY_ASSIST_FIELDS = 'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';

async function underlineAndSuggest(fetchYouTrack, query, caret) {
  return await fetchYouTrack(`api/search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
    method: 'POST',
    body: {query, caret}
  });
}

async function loadProjects(fetchYouTrack, fetchHub, report) {
  if (report.id) {
    return await fetchYouTrack(`api/reports/${report.id}/accessibleProjects?fields=${PROJECTS_FIELDS}&$top=-1`);
  }
  const projects = await fetchYouTrack(`api/admin/projects?fields=${PROJECTS_FIELDS}&$top=-1`);
  const permissionCache = await fetchHub(
    `api/rest/permissions/cache?fields=${PERMISSION_FIELDS}`
  );
  const createReportPermission = permissionCache.find(it =>
    it.permission.key === 'JetBrains.YouTrack.CREATE_REPORT');
  if (!createReportPermission || createReportPermission.global) {
    return projects;
  }
  const projectIds = createReportPermission.projects.map(it => it.id);
  return projects.filter(it => projectIds.indexOf(it.ringId) >= 0);
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
  const distributionReportTypes = [
    BackendTypes.get().IssuePerProjectReport,
    BackendTypes.get().IssuePerAssigneeReport,
    BackendTypes.get().FlatDistributionReport,
    BackendTypes.get().MatrixReport
  ].map(BackendTypes.toShortType).
    join(',');

  return (
    await fetchYouTrack(`api/reports?fields=${REPORT_FIELDS}&$top=300&types=${distributionReportTypes}`)
  ) || [];
}

async function loadReportsFilterFields(fetchYouTrack, projects) {
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const params = [
    fld, '$top=300', `fields=${REPORT_FILTER_FIELDS_FIELDS}`
  ].filter(param => param.length > 0).join('&');

  return await fetchYouTrack(`api/filterFields?${params}`);
}

async function loadReportsAggregationFilterFields(fetchYouTrack, projects) {
  const fieldTypes = serializeArrayParameter(
    'fieldTypes', ['integer', 'float', 'period']
  );
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const params = [
    fieldTypes,
    fld,
    'includeNonFilterFields=true',
    '$top=300',
    `fields=${REPORT_FILTER_FIELDS_FIELDS}`
  ].filter(param => param.length > 0).join('&');

  const aggregationFilterFields = (await fetchYouTrack(`api/filterFields?${params}`)) || [];

  const configWithVotesPresentations = await fetchYouTrack('api/config?fields=l10n(predefinedQueries(votes))');
  const votersPresentation = configWithVotesPresentations &&
    configWithVotesPresentations.l10n &&
    configWithVotesPresentations.l10n.predefinedQueries &&
    configWithVotesPresentations.l10n.predefinedQueries.votes;

  if (votersPresentation) {
    return [{
      presentation: votersPresentation,
      id: votersPresentation,
      $type: BackendTypes.get().PredefinedFilterField
    }].concat(aggregationFilterFields);
  }
  return aggregationFilterFields;
}

function serializeArrayParameter(paramName, arr) {
  return encodeURI(
    arr.map(item => `${paramName}=${item}`).join('&')
  );
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

async function loadUserGroups(fetchYouTrack, queryParams) {
  return await fetchYouTrack(
    `api/admin/groups?fields=${USER_GROUP_FIELDS}`, {
      query: queryParams
    }
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
  loadReportsAggregationFilterFields,
  saveReportSettings,
  recalculateReport,
  getYouTrackServices,
  getYouTrackService,
  underlineAndSuggest,
  loadProjects,
  loadUserGroups,
  loadCurrentUser
};
