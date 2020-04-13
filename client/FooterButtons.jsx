import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';

import { Button } from '@material-ui/core';

import { get } from 'lodash';
import JSON5 from 'json5';

import Client from 'fhir-kit-client';
import simpleOauthModule from 'simple-oauth2';

//========================================================================================================
// Theming 

import {
  MuiThemeProvider,
  makeStyles,
  createMuiTheme,
} from '@material-ui/core/styles';

  // Global Theming 
  // This is necessary for the Material UI component render layer
  let theme = {
    appBarColor: "#f5f5f5 !important",
    appBarTextColor: "rgba(0, 0, 0, 1) !important",
  }

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
  }

  const muiTheme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
    palette: {
      appBar: {
        main: theme.appBarColor,
        contrastText: theme.appBarTextColor
      },
      contrastThreshold: 3,
      tonalOffset: 0.2
    }
  });


  const useTabStyles = makeStyles(theme => ({
    west_button: {
      cursor: 'pointer',
      justifyContent: 'left',
      color: theme.appBarTextColor,
      marginLeft: '20px',
      marginTop: '10px'
    },
    east_button: {
      cursor: 'pointer',
      justifyContent: 'left',
      color: theme.appBarTextColor,
      right: '20px',
      marginTop: '15px',
      position: 'absolute'
    }
  }));



//========================================================================================================
// OAuth  

import FHIR from 'fhirclient';
const smart = FHIR.oauth2;

let oauthConfig = {
  "client_id": get(Meteor, 'settings.public.smartOnFhir[0].client_id'),
  "scope": get(Meteor, 'settings.public.smartOnFhir[0].scope'),
  'fhirServiceUrl': get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl')
}



//============================================================================================================================
// FETCH

export function SampleDialogComponent(props){
  return(
    <div>
      This is a sample component!
    </div>
  )
}

export function FetchButtons(props){
  const buttonClasses = useTabStyles();

  function clearAllData(){
    console.log('Clear All Data!');
    Patients.remove({});
    Encounters.remove({})
    Conditions.remove({});
    Procedures.remove({});
    Locations.remove({});

    Session.set('geoJsonLayer', "");    
  }
  function toggleDialog(){
    console.log('Toggle dialog open/close.')
    Session.set('mainAppDialogJson', false);
    Session.set('mainAppDialogComponent', "AboutDialog");
    Session.set('lastUpdated', new Date())
    Session.toggle('mainAppDialogOpen');
  }
  async function smartFhirTest(){

    FHIR.oauth2.ready(function(ready){
      console.log('Success! Do a thing.  :)')
    }, function(error){
      console.log('Error! :(')
    });
  }
  async function fhirKitTest(){
    console.log('fhirKitTest');

    console.log('authenticateWithFhirServer', Session.get('smartOnFhir_iss'));
    fhirClient = new Client({ baseUrl: Session.get('smartOnFhir_iss') });
    const { authorizeUrl, tokenUrl } = await fhirClient.smartAuthMetadata();

    if(authorizeUrl && tokenUrl){
      const oauth2 = simpleOauthModule.create({
        client: {
          id: get(Meteor, 'settings.public.smartOnFhir[0].client_id'),
          secret: get(Meteor, 'settings.public.smartOnFhir[0].secret')
        },
        auth: {
          tokenHost: tokenUrl.protocol + '//' + tokenUrl.host,
          tokenPath: tokenUrl.pathname,
          authorizeHost: authorizeUrl.protocol + '//' + authorizeUrl.host,
          authorizePath: authorizeUrl.pathname
        },
        options: {
          authorizationMethod: 'body',
        }
      });

      const options = {
        code: Session.get('smartOnFhir_code'),
        redirect_uri: get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri')
      };

      try {
        const result = await oauth2.authorizationCode.getToken(options);
    
        const { token } = oauth2.accessToken.create(result);
    
        console.log('The token is : ', token);
    
        fhirClient.bearerToken = token.access_token;
    
        const patient = await fhirClient.read({ resourceType: 'Patient', id: token.patient });
    
        console.log('patient', patient);
      } catch (error) {
        console.error('Access Token Error', error.message);        
      }
    }
  }
  return (
    <MuiThemeProvider theme={muiTheme} >
      <Button onClick={ clearAllData } className={ buttonClasses.west_button }>
        Clear All Data
      </Button>
      <Button onClick={ smartFhirTest } className={ buttonClasses.west_button }>
        SMART on FHIR Test
      </Button>
      <Button onClick={ fhirKitTest } className={ buttonClasses.west_button }>
        FHIR Kit Test
      </Button>
      <Button onClick={ toggleDialog } className={ buttonClasses.east_button }>
        Info Dialog
      </Button>
    </MuiThemeProvider>
  );
}


