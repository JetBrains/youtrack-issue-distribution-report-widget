import {i18n} from 'hub-dashboard-addons/dist/localization';

import BackendTypes from '../../../../components/src/backend-types/backend-types';

const getReportTypesMap = () => ({
  [BackendTypes.get().TimeSheetReport]: {
    id: BackendTypes.get().TimeSheetReport,
    pathPrefix: 'timeSheet',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/timesheet-report.html'
  }
});


function getReportTypePresentation() {
  return i18n('Time Sheet');
}

function getReportTypeExampleLink(report) {
  const reportTypeData = getReportTypesMap()[report && report.$type];
  return reportTypeData && reportTypeData.docs;
}

function getReportTypePathPrefix(report) {
  const reportTypeData = getReportTypesMap()[report && report.$type];
  return reportTypeData && reportTypeData.pathPrefix;
}


export {
  getReportTypePathPrefix,
  getReportTypePresentation,
  getReportTypeExampleLink
};
