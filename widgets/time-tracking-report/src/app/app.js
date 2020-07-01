import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import {setLocale} from 'hub-dashboard-addons/dist/localization';
import ConfigWrapper from '@jetbrains/hub-widget-ui/dist/config-wrapper';

import '../../../../components/src/report-widget/report-widget.scss';
import {initFetcher} from '../../../../components/src/fetcher/fetcher';

import Widget from './widget';
import TRANSLATIONS from './translations';

const CONFIG_FIELDS = [
  'reportId',
  'presentation',
  'youTrack',
  'refreshPeriod',
  'yAxis',
  'withDetails'
];

//TODO: minification problem of setLocale
//TODO: problem with no data of current locale in i18n

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  setLocale(DashboardAddons.locale, TRANSLATIONS);
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
