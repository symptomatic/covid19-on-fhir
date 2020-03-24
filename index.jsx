import React from 'react';

import FhirQueryPage from './client/FhirQueryPage';

import { GoFlame } from 'react-icons/go';


import { 
  FetchButtons
} from './client/FooterButtons';

import { HeaderNavigation } from './client/HeaderNavigation';

var DynamicRoutes = [{
  'name': 'FhirQueryPage',
  'path': '/query-fhir-provider',
  'component': FhirQueryPage
}];

let FooterButtons = [{
  pathname: '/query-fhir-provider',
  component: <FetchButtons />
}];





SidebarElements = [{
  primaryText: "Query Hospital",
  to: '/query-fhir-provider',
  icon: <GoFlame />
}];


let MainPage = FhirQueryPage;


export { 
  DynamicRoutes, 

  FhirQueryPage,

  HeaderNavigation,
  SidebarElements,
  FooterButtons,

  MainPage
};
