import semver from 'semver';

const YT_VERSIONS_WITH_SHORT_$TYPE = '>=2019.1.50417';

const BackendTypesEnum = {
  SprintBasedBurndownReport: 'jetbrains.youtrack.reports.impl.agile.burndown.gap.SprintBasedBurndownReport',
  IndependentBurndownReport: 'jetbrains.youtrack.reports.impl.agile.burndown.gap.IndependentBurndownReport',
  SprintBasedCumulativeFlowReport: 'jetbrains.youtrack.reports.impl.agile.cumulative.gap.SprintBasedCumulativeFlowReport',
  IndependentCumulativeFlowReport: 'jetbrains.youtrack.reports.impl.agile.cumulative.gap.IndependentCumulativeFlowReport',
  IssuePerProjectReport: 'jetbrains.youtrack.reports.impl.distribution.flat.gap.IssuePerProjectReport',
  IssuePerAssigneeReport: 'jetbrains.youtrack.reports.impl.distribution.flat.gap.IssuePerAssigneeReport',
  FlatDistributionReport: 'jetbrains.youtrack.reports.impl.distribution.flat.gap.FlatDistributionReport',
  MatrixReport: 'jetbrains.youtrack.reports.impl.distribution.matrix.gap.MatrixReport',
  TimeReport: 'jetbrains.youtrack.reports.impl.time.gap.simple.TimeReport',
  TimeSheetReport: 'jetbrains.youtrack.reports.impl.time.gap.sheet.TimeSheetReport',

  FieldBasedGrouping: 'jetbrains.youtrack.reports.impl.time.gap.FieldBasedGrouping',
  WorkItemBasedGrouping: 'jetbrains.youtrack.reports.impl.time.gap.WorkItemBasedGrouping',
  GroupByTypes: 'jetbrains.youtrack.reports.impl.time.gap.GroupByTypes',

  NamedTimeRange: 'jetbrains.youtrack.reports.impl.gap.ranges.NamedTimeRange',
  FixedTimeRange: 'jetbrains.youtrack.reports.impl.gap.ranges.FixedTimeRange',
  TimeSheetReportScale: 'jetbrains.youtrack.reports.impl.time.gap.sheet.TimeSheetReportScale',
  PredefinedFilterField: 'jetbrains.charisma.keyword.PredefinedFilterField',

  User: 'jetbrains.charisma.persistence.user.User',
  UserGroup: 'jetbrains.charisma.persistence.user.UserGroup'
};

let types = BackendTypesEnum;

const BackendTypes = {
  setYtVersion: version => {
    types = isShortTypes()
      ? convertToShortTypes(BackendTypesEnum)
      : BackendTypesEnum;

    function isShortTypes() {
      const semverVersion = semver.coerce(version);
      return semver.valid(semverVersion)
        ? semver.satisfies(semverVersion, YT_VERSIONS_WITH_SHORT_$TYPE)
        : false;
    }

    function convertToShortTypes(typesMap) {
      return Object.keys(typesMap).reduce((result, typeKey) => {
        result[typeKey] = typeKey;
        return result;
      }, {});
    }
  },

  get: () => types,

  entityOfType: (report, typesToCheck) =>
    report.$type && typesToCheck.some(
      type => type === report.$type || type === BackendTypes[report.$type]
    ),

  toShortType: longType =>
    (longType || '').split('.').pop()
};

export default BackendTypes;
