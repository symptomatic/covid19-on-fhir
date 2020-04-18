import React from 'react';

import CovidQueryPage from './client/CovidQueryPage';
import AboutDialog from './client/AboutDialog';
import PrivacyPage from './client/PrivacyPage';
import TermsAndConditionsPage from './client/TermsAndConditionsPage';
import ConformanceCheck from './client/ConformanceCheck';
import CovidLaunchPage from './client/CovidLaunchPage';
import PopupRedirectPage from './client/PopupRedirectPage';

import { 
  FetchButtons,
  SampleDialogComponent
} from './client/FooterButtons';

import { HeaderNavigation } from './client/HeaderNavigation';
import { PatientChardHeaderNavigation } from './client/PatientChardHeaderNavigation';


let DynamicRoutes = [{
  'name': 'CovidOnFhirAppPage',
  'path': '/bulk-data-query',
  'component': CovidQueryPage
}, {
  'name': 'CovidQueryPage',
  'path': '/query-fhir-provider',
  'component': CovidQueryPage
}, {
  'name': 'BulkDataFetch',
  'path': '/bulk-data-fetch',
  'component': CovidQueryPage
}, {
  'name': 'AboutDialog',
  'path': '/info',
  'component': AboutDialog
}, {
  'name': 'PrivacyPage',
  'path': '/privacy',
  'component': PrivacyPage
}, {
  'name': 'TermsAndConditionsPage',
  'path': '/terms-and-conditions',
  'component': TermsAndConditionsPage
}];


let DialogComponents = [{
  name: "SampleDialogComponent",
  component: <SampleDialogComponent />
}, {
  name: "ConformanceCheck",
  component: <ConformanceCheck />
}, {
  name: "AboutDialog",
  component: <AboutDialog />
}]

let FooterButtons = [{
  pathname: '/query-fhir-provider',
  component: <FetchButtons />
}, {
  pathname: '/',
  component: <FetchButtons />
}];


let SidebarWorkflows = [{
  primaryText: 'Bulk Data Fetch',
  to: '/bulk-data-fetch',
  iconName: 'fir'
}, {
  primaryText: 'Patient Chart',
  to: '/patient-chart',
  iconName: 'user'
}, {
  primaryText: 'Quick Chart',
  to: '/patient-quickchart',
  iconName: 'user'
}];


let MainPage = CovidQueryPage;
let LaunchPage = CovidLaunchPage;

export { 
  DynamicRoutes, 

  CovidQueryPage,
  HeaderNavigation,
  PatientChardHeaderNavigation,

  FooterButtons,
  SidebarElements,
  DialogComponents,
  SidebarWorkflows,

  LaunchPage,
  MainPage
};
