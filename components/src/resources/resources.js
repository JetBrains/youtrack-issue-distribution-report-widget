import {getCurrentSprint} from '../agile-board-model/agile-board-model';
import BackendTypes from '../backend-types/backend-types';

const REQUESTED_YOUTRACK_VERSION = '2020.1.3111';

const SERVICE_FIELDS = 'id,name,applicationName,homeUrl,version';

const USER_FIELDS = 'id,ringId,login,name,avatarUrl,avatar(url),email,banned,online';
const USER_GROUP_FIELDS = 'id,name,icon';
const PROJECTS_FIELDS = 'id,name,shortName';

const WORK_ITEM_TYPE_FIELDS = 'id,name';
const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation';

const TIME_REPORT_FIELDS = `grouping(id,field(${REPORT_FILTER_FIELDS_FIELDS})),scale(id),projects(${PROJECTS_FIELDS}),authors(${USER_FIELDS}),workTypes(${WORK_ITEM_TYPE_FIELDS}),range($type,id,range($type,id),from,to)`;
const REPORT_FIELDS = `id,name,owner(${USER_FIELDS}),pinned,own,editable,xaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),yaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),aggregationPolicy(id,field(${REPORT_FILTER_FIELDS_FIELDS})),xsortOrder,ysortOrder,customField(${REPORT_FILTER_FIELDS_FIELDS}),${TIME_REPORT_FIELDS}`;

const SHARING_SETTINGS_FIELDS = `permittedGroups(${USER_GROUP_FIELDS}),permittedUsers(${USER_FIELDS})`;

const Y_AXIS_TYPE_FIELDS = 'yaxisType(id,name)';
const BURN_DOWN_REPORT_POINT_FIELDS = 'time,value';
const BURNDOWN_REPORT_DATA_FIELDS = `xlabel,ylabel,sprintFinish,remainingEffortPresentation,ideal(${BURN_DOWN_REPORT_POINT_FIELDS}),remainingEstimation(${BURN_DOWN_REPORT_POINT_FIELDS}),cumulativeSpentTime(${BURN_DOWN_REPORT_POINT_FIELDS}),${Y_AXIS_TYPE_FIELDS}`;

const PERIOD_FIELD_VALUE_FIELDS = 'value,presentation';

const TIME_SHEET_REPORT_LINE_DATA = `id,entityId,presentation,avatarUrl,spentTime(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),cells(${PERIOD_FIELD_VALUE_FIELDS}),totalSpentTime(${PERIOD_FIELD_VALUE_FIELDS})`;
const TIME_REPORT_LINE_DATA = `id,issueId,userId,userVisibleName,description,avatarUrl,duration(${PERIOD_FIELD_VALUE_FIELDS}),totalDuration(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),cells(${PERIOD_FIELD_VALUE_FIELDS}),typeDurations(duration(${PERIOD_FIELD_VALUE_FIELDS}),workType)`;
const TIME_SHEET_GROUP_DATA_FIELDS = `name,meta(linkedIssue(idReadable,summary),linkedUser(ringId,visibleName)),entityId,lineSpentTime(${PERIOD_FIELD_VALUE_FIELDS}),spentTime(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),issueLines(${TIME_SHEET_REPORT_LINE_DATA}),userLines(${TIME_SHEET_REPORT_LINE_DATA})`;
const TIME_GROUP_DATA_FIELDS = `name,meta(linkedIssue(idReadable,summary),linkedUser(ringId,visibleName)),entityId,typeDurations(duration(${PERIOD_FIELD_VALUE_FIELDS}),workType),spentTime(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),duration(${PERIOD_FIELD_VALUE_FIELDS}),totalDuration(${PERIOD_FIELD_VALUE_FIELDS}),lines(${TIME_REPORT_LINE_DATA})`;
const GROUP_DATA_FIELDS = `${TIME_SHEET_GROUP_DATA_FIELDS},${TIME_GROUP_DATA_FIELDS}`;
const TIME_REPORT_DATA_FIELDS = `duration(${PERIOD_FIELD_VALUE_FIELDS}),typeDurations(workType,duration(${PERIOD_FIELD_VALUE_FIELDS})),groups(${GROUP_DATA_FIELDS})`;
const TIME_SHEET_REPORT_DATA_FIELDS = `hasIssueView,headers(start,end,holiday,spentTime(${PERIOD_FIELD_VALUE_FIELDS})),spentTime(${PERIOD_FIELD_VALUE_FIELDS}),groups(${GROUP_DATA_FIELDS})`;
const REPORT_ITEM_VALUE_FIELDS = 'value,presentation';
const CUMULATIVE_FLOW_REPORT_DATA_FIELDS = `xlabel,ylabel,sample(date,values(${REPORT_ITEM_VALUE_FIELDS})),names,colors,${Y_AXIS_TYPE_FIELDS}`;
const REPORT_SPRINT_SHORT_FIELDS = 'id,name,agile(id,name,sprintsSettings(disableSprints))';
const REPORT_STATUS_FIELDS = 'id,calculationInProgress,progress,error,errorMessage';
const REPORT_WITH_DATA_FIELDS = `${REPORT_FIELDS},data(${TIME_SHEET_REPORT_DATA_FIELDS},${TIME_REPORT_DATA_FIELDS},${BURNDOWN_REPORT_DATA_FIELDS},${CUMULATIVE_FLOW_REPORT_DATA_FIELDS}),sprint(${REPORT_SPRINT_SHORT_FIELDS}),status(${REPORT_STATUS_FIELDS})`;

const TIME_REPORT_SETTINGS_FIELDS = `authors(${USER_FIELDS}),workTypes(${WORK_ITEM_TYPE_FIELDS})`;
const REPORT_WITH_SETTINGS_FIELDS = `${REPORT_FIELDS},projects(${PROJECTS_FIELDS}),query,own,visibleTo(id,name),readSharingSettings(${SHARING_SETTINGS_FIELDS}),updateSharingSettings(${SHARING_SETTINGS_FIELDS}),${TIME_REPORT_SETTINGS_FIELDS}`;

const QUERY_ASSIST_FIELDS = 'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';

const SPRINT_FIELDS = 'id,name,start,finish,report(id)';
const AGILE_FIELDS = `id,name,sprints(${SPRINT_FIELDS}),currentSprint(${SPRINT_FIELDS}),sprintsSettings(disableSprints,explicitQuery),columnSettings(field(id,name)),owner(id,ringId,fullName)`;
const AGILE_REPORT_SETTINGS_FIELDS = 'extensions(reportSettings(doNotUseBurndown))';


async function underlineAndSuggest(fetchYouTrack, query, caret) {
  return await fetchYouTrack(`api/search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
    method: 'POST',
    body: {query, caret}
  });
}

async function loadProjects(fetchYouTrack) {
  return await fetchYouTrack(`api/admin/projects?fields=${PROJECTS_FIELDS}&$top=-1`);
}

async function loadAgiles(fetchYouTrack) {
  return await fetchYouTrack(`api/agiles?fields=${AGILE_FIELDS}&$top=-1`);
}

async function loadAgileReportSettings(fetchYouTrack, agileId) {
  const agileSettings = await fetchYouTrack(`api/agiles/${agileId}?fields=${AGILE_REPORT_SETTINGS_FIELDS}&$top=-1`);
  return agileSettings && agileSettings.extensions &&
    agileSettings.extensions.reportSettings;
}

async function loadSprint(fetchYouTrack, agileId, sprintId) {
  if (sprintId) {
    return await fetchYouTrack(`api/agiles/${agileId}/sprints/${sprintId}?fields=${SPRINT_FIELDS}`);
  }
  const agile = await fetchYouTrack(`api/agiles/${agileId}?fields=${AGILE_FIELDS}`);
  return getCurrentSprint(agile);
}

async function loadReportWithData(fetchYouTrack, reportId, params) {
  const lineParam = params && params.line ? `&line=${params.line}` : '';
  return await fetchYouTrack(
    `api/reports/${reportId}?fields=${REPORT_WITH_DATA_FIELDS}${lineParam}`
  );
}

async function loadReportWithSettings(fetchYouTrack, reportId) {
  return await fetchYouTrack(
    `api/reports/${reportId}?fields=${REPORT_WITH_SETTINGS_FIELDS}`
  );
}

async function loadReportsList(fetchYouTrack, reportTypes = []) {
  const typesParameter = reportTypes.map(BackendTypes.toShortType).join(',');

  return (
    await fetchYouTrack(`api/reports?fields=${REPORT_FIELDS}&$top=300&types=${typesParameter}`)
  ) || [];
}

async function loadIndependentBurnDownReports(fetchYouTrack) {
  return await loadReportsList(
    fetchYouTrack, [BackendTypes.get().IndependentBurndownReport]
  );
}

async function loadIssuesDistributionReports(fetchYouTrack) {
  const distributionReportTypes = [
    BackendTypes.get().IssuePerProjectReport,
    BackendTypes.get().IssuePerAssigneeReport,
    BackendTypes.get().FlatDistributionReport,
    BackendTypes.get().MatrixReport
  ];

  return await loadReportsList(fetchYouTrack, distributionReportTypes);
}

async function loadTimeReports(fetchYouTrack) {
  const timeReportTypes = [
    BackendTypes.get().TimeReport,
    BackendTypes.get().TimeSheetReport
  ];
  return await loadReportsList(fetchYouTrack, timeReportTypes);
}

async function loadReportsGroupingFilterFields(fetchYouTrack, projects) {
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const groupingFieldsTypes = [
    'version[1]',
    'ownedField[1]',
    'state[1]',
    'user[1]',
    'enum[1]',
    'build[1]',
    'date',
    'integer',
    'float',
    'period',
    'project',
    'string'
  ];
  const fieldTypes = serializeArrayParameter('fieldTypes', groupingFieldsTypes);
  const params = [
    fld,
    '$top=300',
    `fields=${REPORT_FILTER_FIELDS_FIELDS}`,
    fieldTypes,
    'getUnusedVisibleFields=true'
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
    'usage=true',
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

async function loadUserGroups(fetchYouTrack) {
  return await fetchYouTrack(
    `api/admin/groups?fields=${USER_GROUP_FIELDS}`
  );
}

async function loadVisibilityUserGroups(fetchYouTrack, {query}) {
  const result = await fetchYouTrack(
    `api/visibilityGroups?fields=visibilityGroups(${USER_GROUP_FIELDS})`, {
      method: 'POST',
      body: {query}
    }
  );
  return (result || {}).visibilityGroups || [];
}

async function loadCurrentUser(fetchHub) {
  return await loadUser(fetchHub);
}

async function loadUser(fetchHub, ringId = 'me') {
  return await fetchHub(
    `api/rest/users/${ringId}?fields=${USER_FIELDS}`
  );
}

async function loadUsers(
  fetchYouTrack,
  {permission, projectIds, query, $skip = 0}
) {
  const queryParams = {$skip, $top: 20, permission, query};
  if (projectIds && projectIds.length) {
    queryParams.projectId = projectIds.map(
      projectId => `projectId=${projectId}`
    ).join('&');
  }
  return await fetchYouTrack(
    `api/admin/users?fields=${USER_FIELDS}`, {
      query: queryParams
    }
  );
}

async function loadWorkItemTypes(fetchYouTrack) {
  return await fetchYouTrack(
    `api/admin/timeTrackingSettings/workItemTypes?fields=${WORK_ITEM_TYPE_FIELDS}`, {}
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

function makeYouTrackFetcher(dashboardApi, youTrack) {
  return async (url, params) =>
    await dashboardApi.fetch(youTrack.id, url, params);
}

export {
  loadReportWithData,
  loadReportsList,
  loadIndependentBurnDownReports,
  loadIssuesDistributionReports,
  loadTimeReports,
  loadReportWithSettings,
  loadReportsAggregationFilterFields,
  loadReportsGroupingFilterFields,
  saveReportSettings,
  recalculateReport,
  getYouTrackServices,
  getYouTrackService,
  underlineAndSuggest,
  loadProjects,
  loadVisibilityUserGroups,
  loadAgiles,
  loadAgileReportSettings,
  loadSprint,
  loadUserGroups,
  loadCurrentUser,
  loadUser,
  loadUsers,

  loadWorkItemTypes,

  makeYouTrackFetcher
};
