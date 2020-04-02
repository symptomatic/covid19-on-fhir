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
    Session.set('mainAppDialogComponent', "SampleDialogComponent");
    Session.set('lastUpdated', new Date())
    Session.toggle('mainAppDialogOpen');
  }
  return (
    <MuiThemeProvider theme={muiTheme} >
      <Button onClick={ clearAllData.bind() } className={ buttonClasses.west_button }>
        Clear All Data
      </Button>
      <Button onClick={ toggleDialog.bind() } className={ buttonClasses.east_button }>
        Dialog
      </Button>
    </MuiThemeProvider>
  );
}


