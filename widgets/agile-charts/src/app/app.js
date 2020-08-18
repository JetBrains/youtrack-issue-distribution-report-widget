import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';
import 'd3/d3';
import 'nvd3/nv.d3';
import 'nvd3/nv.d3.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import ConfigWrapper from '@jetbrains/hub-widget-ui/dist/config-wrapper';

import {initTranslations} from '../../../../components/src/translations/translations';

import Widget from './widget';

const CONFIG_FIELDS = ['youTrack', 'refreshPeriod', 'settings'];

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  initTranslations(
    DashboardAddons.locale, require.context('./translations/', true, /\.po$/)
  );
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
