import BackendTypes from '../backend-types/backend-types';

import ReportNamedTimeRanges from './report-named-time-ranges';

const ReportTypes = {
  isCumulativeFlow: report =>
    BackendTypes.entityOfType(report, [
      BackendTypes.get().SprintBasedCumulativeFlowReport,
      BackendTypes.get().IndependentCumulativeFlowReport
    ]),

  isBurnDown: report =>
    BackendTypes.entityOfType(report, [
      BackendTypes.get().SprintBasedBurndownReport,
      BackendTypes.get().IndependentBurndownReport
    ]),

  isSprintBased: report =>
    BackendTypes.entityOfType(report, [
      BackendTypes.get().SprintBasedCumulativeFlowReport,
      BackendTypes.get().SprintBasedBurndownReport
    ]),

  isIndependent: report =>
    !ReportTypes.isSprintBased(report),

  isIssueDistributionReport: report =>
    BackendTypes.entityOfType(report, [
      BackendTypes.get().IssuePerProjectReport,
      BackendTypes.get().IssuePerAssigneeReport,
      BackendTypes.get().FlatDistributionReport,
      BackendTypes.get().MatrixReport
    ])
};

const NewReport = {
  NEW_REPORT_ID: undefined,

  cumulativeFlow: sprint => ({
    id: NewReport.NEW_REPORT_ID,
    $type: sprint
      ? BackendTypes.get().SprintBasedCumulativeFlowReport
      : BackendTypes.get().IndependentCumulativeFlowReport,
    name: '',
    projects: [],
    query: '',
    own: sprint ? undefined : true,
    sprint: sprint && sprint.id && {
      id: sprint.id
    }
  }),

  burnDown: sprint => ({
    id: NewReport.NEW_REPORT_ID,
    $type: sprint
      ? BackendTypes.get().SprintBasedBurndownReport
      : BackendTypes.get().IndependentBurndownReport,
    name: '',
    projects: [],
    query: '',
    range: {
      $type: BackendTypes.get().NamedTimeRange,
      range: {
        id: (ReportNamedTimeRanges.severalDaysRanges()[0]).id
      }
    },
    own: sprint ? undefined : true,
    sprint: sprint && sprint.id && {
      id: sprint.id
    }
  })
};

const ReportDataValidity = {
  cumulativeFlow: reportData =>
    !(reportData.sample || []).length ||
    !reportData.colors || !reportData.names,

  burnDown: reportData =>
    !(reportData.remainingEstimation || []).length,

  issuesDistribution: reportData =>
    !(reportData.columns || reportData.ycolumns || []).length
};

const ReportModel = {
  ErrorTypes: {
    OK: 0,
    UNKNOWN_ERROR: 1,
    NO_YOUTRACK: 2,
    NO_REPORT: 3,
    CANNOT_LOAD_REPORT: 4
  },

  isReportCalculation: report =>
    report && report.status && report.status.calculationInProgress,

  isReportCalculationCompleted: (updatedReport, prevReport) =>
    ReportModel.isReportCalculation(prevReport) &&
    !ReportModel.isReportCalculation(updatedReport),

  isReportError: report =>
    report && report.status && report.status.error,

  isTooBigReportDataError: report =>
    (report.data || {}).tooBig,

  isNoReportDataError: report => {
    if (ReportModel.isTooBigReportDataError(report)) {
      return false;
    }
    return ReportModel.isValidReportData(report);
  },

  isValidReportData: report => {
    const reportData = report.data || {};
    if (ReportTypes.isIssueDistributionReport(report)) {
      return ReportDataValidity.issuesDistribution(reportData);
    }
    if (ReportTypes.isCumulativeFlow(report)) {
      return ReportDataValidity.cumulativeFlow(reportData);
    }
    return ReportDataValidity.burnDown(reportData);
  },

  getSizeValue: size =>
    ((typeof size === 'number')
      ? size
      : ((size || {}).value || 0)),

  getSizePresentation: size =>
    ((typeof size === 'number')
      ? size
      : ((size || {}).presentation || 0)),

  getSearchUrl: (queryUrl, homeUrl) =>
    `${homeUrl}/issues?q=${encodeURIComponent(queryUrl)}`,

  ReportTypes,

  ReportDataValidity,

  NewReport
};

export default ReportModel;
