import React from 'react';

import CovidQueryPage from './client/CovidQueryPage';

import { 
  FetchButtons
} from './client/FooterButtons';

import { HeaderNavigation } from './client/HeaderNavigation';

var DynamicRoutes = [{
  'name': 'CovidQueryPage',
  'path': '/query-fhir-provider',
  'component': CovidQueryPage
}];

let FooterButtons = [{
  pathname: '/query-fhir-provider',
  component: <FetchButtons />
}, {
  pathname: '/',
  component: <FetchButtons />
}];





let MainPage = CovidQueryPage;


export { 
  DynamicRoutes, 

  CovidQueryPage,
  HeaderNavigation,
  FooterButtons,

  MainPage
};
