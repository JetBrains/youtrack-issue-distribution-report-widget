import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';
import 'd3/d3';
import 'nvd3/nv.d3';
import 'nvd3/nv.d3.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import {setLocale} from 'hub-dashboard-addons/dist/localization';
import ConfigWrapper from '@jetbrains/hub-widget-ui/dist/config-wrapper';

import Widget from './widget';
import TRANSLATIONS from './translations';

const CONFIG_FIELDS = ['youTrack', 'refreshPeriod', 'settings'];

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
