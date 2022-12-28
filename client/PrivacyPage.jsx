import React from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import { PageCanvas, StyledCard, PatientTable } from 'fhir-starter';
import { ReactMeteorData, useTracker } from 'meteor/react-meteor-data';

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


function PrivacyPage(props){

  const classes = useStyles();
  
  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

  
  let headerHeight = 84;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }  

  return (
    <PageCanvas id='infoPage' headerHeight={headerHeight} >
        <Container maxWidth="lg" style={{paddingBottom: '80px'}}>
          <StyledCard height="auto">
            <CardHeader 
              title="Privacy Page" 
              style={{fontSize: '100%'}} />
            <CardContent style={{fontSize: '120%'}}>
              This application is designed to work in both single-user 21st Century Cures mode and in multi-user HIPAA mode.  This demo:
              <ul>
                <li>does not store patient data on servers.  </li>
                <li>is currently configured to use synthetic test patient data.</li>
                <li>fetches data directly from a FHIR compliant server to the user's browser.  </li>
                <li>wipes all data when the application is shut down or the page is closed.  </li>
                <li>does not aggregate or resell patient data.</li>                
                <li>is funded by volunteers and open-source donations.</li>                
              </ul>
            </CardContent>
          </StyledCard>          
      </Container>                 
    </PageCanvas>
  );
}

export default PrivacyPage;