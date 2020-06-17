import BackendTypes from '../../../../components/src/backend-types/backend-types';

const getReportTypesMap = () => ({
  [BackendTypes.get().TimeSheetReport]: {
    id: BackendTypes.get().TimeSheetReport,
    pathPrefix: 'timeSheet'
  },
  [BackendTypes.get().TimeReport]: {
    id: BackendTypes.get().TimeReport,
    pathPrefix: 'time'
  }
});


function getReportTypePathPrefix(report) {
  const reportTypeData = getReportTypesMap()[report && report.$type];
  return reportTypeData && reportTypeData.pathPrefix;
}


export {
  getReportTypePathPrefix
};
