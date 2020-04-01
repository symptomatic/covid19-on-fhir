import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';

import { Button } from '@material-ui/core';

import { get } from 'lodash';
import JSON5 from 'json5';


//========================================================================================================

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
    Patients.remove({});
    Encounters.remove({})
    Conditions.remove({});
    Procedures.remove({});
    Locations.remove({});
    Session.set('geoJsonLayer', "");    
  }
  return (
    <MuiThemeProvider theme={muiTheme} >
      <Button onClick={ clearAllData.bind() } className={ buttonClasses.button }>
        Clear All Data
      </Button>      
    </MuiThemeProvider>
  );
}


