import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useHistory } from "react-router-dom";

import { makeStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PageCanvas, StyledCard } from 'fhir-starter';

import { Icon } from 'react-icons-kit'
import { spinner8 } from 'react-icons-kit/icomoon/spinner8'


import { oauth2 as SMART } from "fhirclient";


function DynamicSpacer(props){
  return <br className="dynamicSpacer" style={{height: '40px'}}/>;
}

//==============================================================================================
// THEMING

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  button: {
    margin: theme.spacing(1)
  }
}));



//==============================================================================================
// MAIN COMPONENT


function CovidLaunchPage(props){


  //--------------------------------------------------------------------------------
  // Props

  const { children, staticContext, loadingMessage, spinningIcon, ...otherProps } = props;

  //--------------------------------------------------------------------------------
  // Query Parameters

  let searchParams = new URLSearchParams(useLocation().search);


  //--------------------------------------------------------------------------------
  // Component Life Cycle Functions

  useEffect(function(){
  
    let smartConfig = {
      clientId: get(Meteor, 'settings.public.smartOnFhir[0].client_id'),
      scope: get(Meteor, 'settings.public.smartOnFhir[0].scope'),
      redirectUri: get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri')  // ./fhir-quer
    }

    if(searchParams.get('iss')){
      console.log('Received an iss URL parameter.  Fetching metadata and authorizing SMART on FHIR client.')

      // we prefer using an ?iss parameter from the URL
      // this is how we typically launch from the big EHR systems
      smartConfig.iss = searchParams.get('iss')        
    } else if (get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl')){
      // if we're testing how the launcher works, we can set the iss in the settings file
      // this is marginally useful in blockchain and multi-tenant hosting environments
      smartConfig.iss = get(Meteor, 'settings.public.smartOnFhir[0].iss');
    } else {
      // otherwise, we resort to using a stand-alone app without launch context
      // this is mostly used for HAPI test servers, not Cerner and Epic
      smartConfig.fhirServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl');
    }

    SMART.authorize(smartConfig);
  });


  //--------------------------------------------------------------------------------
  // Styling

  const classes = useStyles();
  
  let styles = {
    spinningIcon: {
      marginTop: '32px',
      width: '48px',
      height: '48px'
    },
    loadingMessage: {
      position: 'absolute',
      left: '50%',
      top: '40%'
    }
  }

  let headerHeight = 84;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }  

  return (
    <PageCanvas id='CovidLaunchPage' headerHeight={headerHeight} >
      <Grid container spacing={3} justify="center" >
        <Grid item xs={4}>
          <StyledCard>
            <CardHeader 
              title={"Launching " + get(Meteor, 'settings.public.title')} 
              subheader="Redirecting you to the authentication portal signin."
              style={{fontSize: '100%'}} />
            <CardContent>
              <Icon icon={spinner8} className="spinningIcon" style={styles.spinningIcon} size={48} />
            </CardContent>
          </StyledCard>          
        </Grid>
      </Grid>                 
    </PageCanvas>
  );
}

export default CovidLaunchPage;