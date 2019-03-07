import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';
import 'd3/d3';
import 'nvd3/nv.d3';
import 'nvd3/nv.d3.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import {setLocale} from 'hub-dashboard-addons/dist/localization';

import Widget from './widget';
import TRANSLATIONS from './translations';

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  setLocale(DashboardAddons.locale, TRANSLATIONS);

  render(
    <Widget
      dashboardApi={dashboardApi}
      registerWidgetApi={registerWidgetApi}
      editable={DashboardAddons.editable}
    />,
    document.getElementById('app')
  );
});
