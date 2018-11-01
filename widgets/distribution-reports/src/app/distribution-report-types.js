import {i18n} from 'hub-dashboard-addons/dist/localization';

const ISSUES_PER_PROJECT_REPORT_TYPE = 'jetbrains.youtrack.reports.impl.distribution.flat.gap.IssuePerProjectReport';
const ISSUES_PER_ASSIGNEE_REPORT_TYPE = 'jetbrains.youtrack.reports.impl.distribution.flat.gap.IssuePerAssigneeReport';
const ISSUES_PER_ARBITRARY_FIELD_REPORT_TYPE = 'jetbrains.youtrack.reports.impl.distribution.flat.gap.FlatDistributionReport';
const ISSUES_PER_TWO_FIELDS_REPORT_TYPE = 'jetbrains.youtrack.reports.impl.distribution.matrix.gap.MatrixReport';

const REPORT_TYPES = {
  [ISSUES_PER_PROJECT_REPORT_TYPE]: {
    id: ISSUES_PER_PROJECT_REPORT_TYPE,
    pathPrefix: 'issuesPerProject',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Project.html'
  },
  [ISSUES_PER_ASSIGNEE_REPORT_TYPE]: {
    id: ISSUES_PER_ASSIGNEE_REPORT_TYPE,
    pathPrefix: 'issuesPerAssignee',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Assignee.html'
  },
  [ISSUES_PER_ARBITRARY_FIELD_REPORT_TYPE]: {
    id: ISSUES_PER_ARBITRARY_FIELD_REPORT_TYPE,
    pathPrefix: 'flatDistribution',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Arbitrary-Field.html'
  },
  [ISSUES_PER_TWO_FIELDS_REPORT_TYPE]: {
    id: ISSUES_PER_TWO_FIELDS_REPORT_TYPE,
    pathPrefix: 'issueDistribution',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Arbitrary-Field.html'
  }
};


function getReportTypePresentation(report) {
  if (report.$type === ISSUES_PER_PROJECT_REPORT_TYPE) {
    return i18n('project');
  }
  if (report.$type === ISSUES_PER_ASSIGNEE_REPORT_TYPE) {
    return i18n('assignee');
  }
  const ordinateForPresentation = report.yaxis || report.xaxis;
  return (
    ordinateForPresentation && ordinateForPresentation.field &&
      ordinateForPresentation.field.presentation
  ) || '';
}

function getReportTypeExampleLink(report) {
  return REPORT_TYPES[report.$type] && REPORT_TYPES[report.$type].docs;
}

function isTypeWithEditableXAxis(report) {
  return report.$type === ISSUES_PER_ARBITRARY_FIELD_REPORT_TYPE ||
    report.$type === ISSUES_PER_TWO_FIELDS_REPORT_TYPE;
}


export {
  REPORT_TYPES,
  ISSUES_PER_PROJECT_REPORT_TYPE,
  ISSUES_PER_ASSIGNEE_REPORT_TYPE,
  ISSUES_PER_ARBITRARY_FIELD_REPORT_TYPE,
  ISSUES_PER_TWO_FIELDS_REPORT_TYPE,

  getReportTypePresentation,
  getReportTypeExampleLink,
  isTypeWithEditableXAxis
};
