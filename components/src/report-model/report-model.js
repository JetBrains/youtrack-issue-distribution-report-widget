import ReportNamedTimeRanges from './report-named-time-ranges';

const BackendTypes = {
  SprintBasedBurnDownReport: 'jetbrains.youtrack.reports.impl.agile.burndown.gap.SprintBasedBurndownReport',
  IndependentBurnDownReport: 'jetbrains.youtrack.reports.impl.agile.burndown.gap.IndependentBurndownReport',
  SprintBasedCumulativeFlowReport: 'jetbrains.youtrack.reports.impl.agile.cumulative.gap.SprintBasedCumulativeFlowReport',
  IndependentCumulativeFlowReport: 'jetbrains.youtrack.reports.impl.agile.cumulative.gap.IndependentCumulativeFlowReport',
  IssuePerProjectReport: 'jetbrains.youtrack.reports.impl.distribution.flat.gap.IssuePerProjectReport',
  IssuePerAssigneeReport: 'jetbrains.youtrack.reports.impl.distribution.flat.gap.IssuePerAssigneeReport',
  FlatDistributionReport: 'jetbrains.youtrack.reports.impl.distribution.flat.gap.FlatDistributionReport',
  MatrixReport: 'jetbrains.youtrack.reports.impl.distribution.matrix.gap.MatrixReport',

  ReportNamedTimeRange: 'jetbrains.youtrack.reports.impl.gap.ranges.NamedTimeRange',

  toShortType: longType =>
    longType.split('.').pop()
};

function oneOfType(report, types) {
  return report.$type && types.some(
    type => type === report.$type || type === BackendTypes[report.$type]
  );
}

const ReportTypes = {
  isCumulativeFlow: report =>
    oneOfType(report, [
      BackendTypes.SprintBasedCumulativeFlowReport,
      BackendTypes.IndependentCumulativeFlowReport
    ]),

  isBurnDown: report =>
    oneOfType(report, [
      BackendTypes.SprintBasedBurnDownReport,
      BackendTypes.IndependentBurnDownReport
    ]),

  isSprintBased: report =>
    oneOfType(report, [
      BackendTypes.SprintBasedCumulativeFlowReport,
      BackendTypes.SprintBasedBurnDownReport
    ]),

  isIndependent: report =>
    !ReportTypes.isSprintBased(report),

  isIssueDistributionReport: report =>
    oneOfType(report, [
      BackendTypes.IssuePerProjectReport,
      BackendTypes.IssuePerAssigneeReport,
      BackendTypes.FlatDistributionReport,
      BackendTypes.MatrixReport
    ])
};

const NewReport = {
  NEW_REPORT_ID: undefined,

  cumulativeFlow: sprint => ({
    id: NewReport.NEW_REPORT_ID,
    $type: sprint
      ? BackendTypes.SprintBasedCumulativeFlowReport
      : BackendTypes.IndependentCumulativeFlowReport,
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
      ? BackendTypes.SprintBasedBurnDownReport
      : BackendTypes.IndependentBurnDownReport,
    name: '',
    projects: [],
    query: '',
    range: {
      $type: BackendTypes.ReportNamedTimeRange,
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
