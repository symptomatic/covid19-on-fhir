import React from 'react';

import CovidQueryPage from './client/CovidQueryPage';
import AboutDialog from './client/AboutDialog';
import PrivacyPage from './client/PrivacyPage';
import TermsAndConditionsPage from './client/TermsAndConditionsPage';
import ConformanceCheck from './client/ConformanceCheck';
import LaunchPage from './client/LaunchPage';
import PopupRedirectPage from './client/PopupRedirectPage';

import { 
  FetchButtons,
  SampleDialogComponent
} from './client/FooterButtons';

import { HeaderNavigation } from './client/HeaderNavigation';

var DynamicRoutes = [{
  'name': 'CovidOnFhirAppPage',
  'path': '/app',
  'component': CovidQueryPage
}, {
  'name': 'CovidQueryPage',
  'path': '/query-fhir-provider',
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
}, {
  'name': 'LaunchPage',
  'path': '/launch',
  'component': LaunchPage
}, {
  'name': 'LaunchPage',
  'path': '/_oauth/Cerner',
  'component': LaunchPage
}, {
  'name': 'LaunchPage',
  'path': '/_oauth/CernerPatient',
  'component': LaunchPage
}, {
  'name': 'PopupRedirectPage',
  'path': '/_oauth/popup',
  'component': PopupRedirectPage
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


var SidebarElements = [{
  primaryText: 'Privacy Policy',
  to: '/privacy',
  iconName: 'document'
}, {
  primaryText: 'Terms and Conditions',
  to: '/terms-and-conditions',
  iconName: 'document'
}];


let MainPage = CovidQueryPage;

export { 
  DynamicRoutes, 

  CovidQueryPage,
  HeaderNavigation,

  FooterButtons,
  SidebarElements,
  DialogComponents,

  LaunchPage,
  MainPage
};
