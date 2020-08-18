import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import ConfigWrapper from '@jetbrains/hub-widget-ui/dist/config-wrapper';

import '../../../../components/src/report-widget/report-widget.scss';
import {initFetcher} from '../../../../components/src/fetcher/fetcher';
import {initTranslations} from '../../../../components/src/translations/translations';

import Widget from './widget';

const CONFIG_FIELDS = [
  'reportId',
  'presentation',
  'youTrack',
  'refreshPeriod',
  'yAxis',
  'withDetails'
];

//TODO: minification problem of setLocale

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  initTranslations(
    DashboardAddons.locale, require.context('./translations/', true, /\.po$/)
  );
  initFetcher(dashboardApi);
  const configWrapper = new ConfigWrapper(dashboardApi, CONFIG_FIELDS);

  render(
    <Widget
      dashboardApi={dashboardApi}
      registerWidgetApi={registerWidgetApi}
      editable={DashboardAddons.editable}
      configWrapper={configWrapper}
      locale={DashboardAddons.locale}
    />,
    document.getElementById('app')
  );
});
