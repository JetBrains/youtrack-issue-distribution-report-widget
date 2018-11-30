import ReportNamedTimeRanges from './report-named-time-ranges';

const BackendTypes = {
  SprintBasedBurnDownReport: 'jetbrains.youtrack.reports.impl.agile.burndown.gap.SprintBasedBurndownReport',
  IndependentBurnDownReport: 'jetbrains.youtrack.reports.impl.agile.burndown.gap.IndependentBurndownReport',
  SprintBasedCumulativeFlowReport: 'jetbrains.youtrack.reports.impl.agile.cumulative.gap.SprintBasedCumulativeFlowReport',
  IndependentCumulativeFlowReport: 'jetbrains.youtrack.reports.impl.agile.cumulative.gap.IndependentCumulativeFlowReport',

  ReportNamedTimeRange: 'jetbrains.youtrack.reports.impl.gap.ranges.NamedTimeRange'
};

function oneOfType(report, types) {
  return types.some(type => report.$type === type);
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
    !ReportTypes.isSprintBased(report)
};

const NewReport = {
  NEW_REPORT_ID: undefined,

  cumulativeFlow: () => ({
    id: NewReport.NEW_REPORT_ID,
    $type: BackendTypes.IndependentCumulativeFlowReport,
    name: '',
    projects: [],
    query: '',
    own: true
  }),

  burnDown: () => ({
    id: NewReport.NEW_REPORT_ID,
    $type: BackendTypes.IndependentBurnDownReport,
    name: '',
    projects: [],
    query: '',
    range: {
      $type: BackendTypes.ReportNamedTimeRange,
      range: {
        id: (ReportNamedTimeRanges.severalDaysRanges()[0]).id
      }
    },
    own: true
  })
};

const ReportDataValidity = {
  cumulativeFlow: reportData =>
    !(reportData.sample || []).length ||
    !reportData.colors || !reportData.names,

  burnDown: reportData =>
    !(reportData.remainingEstimation || []).length
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

  ReportTypes,

  ReportDataValidity,

  NewReport
};

export default ReportModel;
