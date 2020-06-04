import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Tab from '@jetbrains/ring-ui/components/tabs/tab';
import Tabs from '@jetbrains/ring-ui/components/tabs/dumb-tabs';


const reportToSelectItem = report => {
  if (!report) {
    return null;
  }

  const getOptionDescription = currentReport => {
    const description = currentReport.owner &&
      (currentReport.owner.name || currentReport.owner.login);
    return description && currentReport.own
      ? `${description} (${i18n('me')})`
      : description;
  };

  const getOptionLabel = currentReport => (
    currentReport.id
      ? currentReport.name || i18n('Unnamed')
      : i18n('New report')
  );

  return {
    key: report.id,
    label: getOptionLabel(report),
    description: getOptionDescription(report),
    model: report
  };
};


const makeReportsOptionsList =
    reports => reports.map(reportToSelectItem);


const getSelectedReport = (selectedReport, reports) => (
  selectedReport && selectedReport.id
    ? selectedReport
    : reports[0]
);


const ReportConfigurationTabs = ({
  report, onChange, children, reportsSource, onCreateReport
}) => {

  const [selectedTab, onChangeSelectedTab] =
    useState((report && report.id) ? 'existing' : 'new');

  const [reports, onLoadReports] =
    useState([]);

  const [reportDraft] = useState(onCreateReport());
  const [selectedExistingReport, onSelectExistingReport] =
    useState(null);

  const onSelectTab = useCallback(tab => {
    if (tab === selectedTab) {
      return undefined;
    }
    onChangeSelectedTab(tab);
    return onChange(tab === 'new' ? reportDraft : selectedExistingReport);
  }, [selectedTab]);

  const onSelectExistingReportOption = useCallback(selected => {
    const selectedReport = selected.model;
    if (selectedReport) {
      onChangeSelectedTab('existing');
      onChange(selectedReport);
      onSelectExistingReport(getSelectedReport(selectedReport, reports));
    }
  }, [onChange, reports]);

  useEffect(() => {
    (async () => {
      if (report.id || !selectedExistingReport) {
        const loadedReports = await reportsSource();
        onLoadReports(loadedReports);
        onSelectExistingReport(getSelectedReport(report, loadedReports));
      }
    })();
  }, [report]);

  const newReportTabTitle = (
    <span>{i18n('New report')}</span>
  );

  const existingReportTabTitle = (
    <span>
      <span>{i18n('Existing report')}</span>&nbsp;
      <span>
        <Select
          data={makeReportsOptionsList(reports)}
          selected={reportToSelectItem(selectedExistingReport)}
          onSelect={onSelectExistingReportOption}
          filter={true}
          label={i18n('Select report')}
          type={Select.Type.INLINE}
        />
      </span>
    </span>
  );

  return (
    <Tabs
      selected={selectedTab}
      onSelect={onSelectTab}
    >
      <Tab
        id="new"
        title={newReportTabTitle}
      >
        {children}
      </Tab>
      <Tab
        id="existing"
        title={existingReportTabTitle}
      >
        {children}
      </Tab>
    </Tabs>
  );
};

ReportConfigurationTabs.propTypes = {
  report: PropTypes.object,
  reportsSource: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onCreateReport: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default ReportConfigurationTabs;
