import React from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import { PageCanvas, StyledCard, PatientTable } from 'material-fhir-ui';
import { useTracker } from './Tracker';

function DynamicSpacer(props){
  return <br className="dynamicSpacer" style={{height: '40px'}}/>;
}


function InfoPage(props){

  const classes = useStyles();
  
  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

    

  return (
    <PageCanvas id='infoPage' headerHeight={158} >
      <MuiPickersUtilsProvider utils={MomentUtils} libInstance={moment} local="en">
        <Grid container spacing={3} >
          <Grid item xs={4}>
            <StyledCard style={{minHeight: '380px'}}>
              <CardHeader 
                title="Covid19 Project Info" 
                subheader="Fetching data related to COVID19 coronavirus symptoms."
                style={{fontSize: '100%'}} />
              <CardContent>
                - SANER
                - Datavant
                - MIT 
                - GitHub Repo
                - Zoom Controls
                - Team Acknowledgements
              </CardContent>
            </StyledCard>          
          </Grid>
        </Grid>        
      </MuiPickersUtilsProvider>            
    </PageCanvas>
  );
}

export default InfoPage;