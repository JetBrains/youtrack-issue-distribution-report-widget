import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import {WarningIcon} from '@jetbrains/ring-ui/components/icon';
import Link from '@jetbrains/ring-ui/components/link/link';

const NoEditPermissionsWarning = ({
  report, onChangeReport
}) => {

  if (report.editable) {
    return '';
  }

  const cloneReport = useCallback(() => {
    onChangeReport({
      ...report,
      id: undefined,
      name: `${report.name} - ${i18n('clone')}`,
      own: true,
      editable: true
    });
  }, [report, onChangeReport]);

  return (
    <div className="ring-form__group">
      <WarningIcon
        className="report-widget__icon"
        size={WarningIcon.Size.Size12}
        color={WarningIcon.Color.GRAY}
      />&nbsp;
      <span>
        <span>
          {
            i18n('You do not have access to edit report settings. If you want to customize your own copy of this report, {{cloneItPlaceholder}}', {cloneItPlaceholder: ''})
          }
        </span>
        <Link
          pseudo={true}
          onClick={cloneReport}
        >
          { i18n('{{ifYouWantToCustomizeYourOwnCopyOfThisReportPlaceholder}} clone it', {ifYouWantToCustomizeYourOwnCopyOfThisReportPlaceholder: ''}) }
        </Link>
      </span>
    </div>
  );
};

NoEditPermissionsWarning.propTypes = {
  report: PropTypes.object,
  onChangeReport: PropTypes.func.isRequired
};

export default NoEditPermissionsWarning;
