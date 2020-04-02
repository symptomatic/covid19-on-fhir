import React from 'react';

import CovidQueryPage from './client/CovidQueryPage';
import InfoPage from './client/InfoPage';
import PrivacyPage from './client/PrivacyPage';
import TermsAndConditionsPage from './client/TermsAndConditionsPage';

import { 
  FetchButtons,
  SampleDialogComponent
} from './client/FooterButtons';

import { HeaderNavigation } from './client/HeaderNavigation';

var DynamicRoutes = [{
  'name': 'CovidQueryPage',
  'path': '/query-fhir-provider',
  'component': CovidQueryPage
}, {
  'name': 'InfoPage',
  'path': '/info',
  'component': InfoPage
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
  to: '/privacy'
}, {
  primaryText: 'Terms and Conditions',
  to: '/terms-and-conditions'
}];

let MainPage = CovidQueryPage;

export { 
  DynamicRoutes, 

  CovidQueryPage,
  HeaderNavigation,

  FooterButtons,
  SidebarElements,
  DialogComponents,

  MainPage
};
