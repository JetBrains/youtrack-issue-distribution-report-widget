import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import {setLocale} from 'hub-dashboard-addons/dist/localization';
import ConfigWrapper from '@jetbrains/hub-widget-ui/dist/config-wrapper';

import '../../../../components/src/report-widget/report-widget.scss';

import Widget from './widget';
import TRANSLATIONS from './translations';

const CONFIG_FIELDS = ['reportId', 'mainAxisSortOrder', 'secondaryAxisSortOrder', 'presentation', 'youTrack', 'refreshPeriod', 'yAxis'];

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  setLocale(DashboardAddons.locale, TRANSLATIONS);
  const configWrapper = new ConfigWrapper(dashboardApi, CONFIG_FIELDS);

  render(
    <Widget
      dashboardApi={dashboardApi}
      registerWidgetApi={registerWidgetApi}
      editable={DashboardAddons.editable}
      configWrapper={configWrapper}
    />,
    document.getElementById('app')
  );
});
