import BackendTypes
  from '../../../../components/src/backend-types/backend-types';

const REQUESTED_YOUTRACK_VERSION = '2020.1.3111';

const SERVICE_FIELDS = 'id,name,applicationName,homeUrl,version';

const USER_FIELDS = 'id,ringId,login,name,avatarUrl,email';

const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation';

const REPORT_DATA_COLUMN_FIELDS = `id,name,size(value,presentation),naturalSortIndex,index,user(${USER_FIELDS}),colorIndex(id,foreground,background),issuesQuery,queryUrl`;
const REPORT_FIELDS = `id,name,owner(${USER_FIELDS}),pinned,own,xaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),yaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS})),aggregationPolicy(id,field(${REPORT_FILTER_FIELDS_FIELDS})),xsortOrder,ysortOrder,presentation`;
const REPORT_STATUS_FIELDS = 'id,calculationInProgress,progress,error,errorMessage';
const REPORT_WITH_DATA_FIELDS = `${REPORT_FIELDS},data(tooBig,total(value,presentation),columns(${REPORT_DATA_COLUMN_FIELDS}),xcolumns(${REPORT_DATA_COLUMN_FIELDS}),ycolumns(${REPORT_DATA_COLUMN_FIELDS}),counts(value,presentation),issuesQueries),status(${REPORT_STATUS_FIELDS})`;

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
  loadReportsFilterFields,
  loadReportsAggregationFilterFields,
  saveReportSettings,
  recalculateReport,
  getYouTrackServices,
  getYouTrackService,
  loadCurrentUser
};
