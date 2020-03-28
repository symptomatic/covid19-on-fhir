import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button } from '@material-ui/core';

import { get } from 'lodash';
import JSON5 from 'json5';



let apiKey = get(Meteor, 'settings.public.interfaces.default.auth.username', '');
let usePseudoCodes = get(Meteor, 'settings.public.usePseudoCodes', false);
let fhirBaseUrl = get(Meteor, 'settings.public.interfaces.default.channel.endpoint', false);


// =========================================================================================
// HELPER FUNCTIONS


// function isFhirServerThatRequiresApiKey(){
//   if(["https://syntheticmass.mitre.org/v1/fhir"].includes(get(Meteor, 'settings.public.interfaces.default.channel.endpoint'))){
//     return true;
//   } else {
//     return false
//   }
// }


//========================================================================================================

import {
  fade,
  ThemeProvider,
  MuiThemeProvider,
  withStyles,
  makeStyles,
  createMuiTheme,
  useTheme
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
    button: {
      cursor: 'pointer',
      justifyContent: 'left',
      color: theme.appBarTextColor,
      marginLeft: '20px',
      marginTop: '10px'
    }
  }));

//============================================================================================================================
// FETCH

export function FetchButtons(props){
  const buttonClasses = useTabStyles();

  function clearAllData(){
    console.log('Clear All Data!');

  }
  return (
    <MuiThemeProvider theme={muiTheme} >
      <Button onClick={ clearAllData.bind() } className={ buttonClasses.button }>
        Clear All Data
      </Button>      
    </MuiThemeProvider>
  );
}

export default FetchButtons;


export function MapButtons(props){
  const buttonClasses = useTabStyles();

  function initHospitals(){
    console.log('Init Hospitals!');

  }
  return (
    <MuiThemeProvider theme={muiTheme} >
      <Button onClick={ initHospitals.bind() } className={ buttonClasses.button }>
        Initialize Hospitals
      </Button>      
    </MuiThemeProvider>
  );
}





