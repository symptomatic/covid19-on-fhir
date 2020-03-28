import React from 'react';

import CovidQueryPage from './client/CovidQueryPage';
import GoogleMapsPage from './client/GoogleMapsPage';

// import { GoFlame } from 'react-icons/go';

import { 
  FetchButtons,
  MapButtons
} from './client/FooterButtons';

import { HeaderNavigation } from './client/HeaderNavigation';

var DynamicRoutes = [{
  'name': 'CovidQueryPage',
  'path': '/query-fhir-provider',
  'component': CovidQueryPage
}, {
  'name': 'MapPage',
  'path': '/map',
  'component': GoogleMapsPage,
  'requireAuth': true
}];

let FooterButtons = [{
  pathname: '/map',
  component: <MapButtons />
}, {
  pathname: '/query-fhir-provider',
  component: <FetchButtons />
}, {
  pathname: '/',
  component: <FetchButtons />
}];





SidebarElements = [{
  primaryText: "Query Hospital",
  to: '/query-fhir-provider',
  // icon: <GoFlame />
}];


let MainPage = CovidQueryPage;


export { 
  DynamicRoutes, 

  CovidQueryPage,
  GoogleMapsPage,

  HeaderNavigation,
  SidebarElements,
  FooterButtons,

  MapButtons,
  FetchButtons,

  MainPage
};
