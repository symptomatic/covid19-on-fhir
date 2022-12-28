import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PageCanvas, StyledCard } from 'fhir-starter';

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


function PopupRedirectPage(props){

  const classes = useStyles();
  
  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

    
  useEffect(() => {
    // get the URL parameters which will include the auth token
     const params = window.location.search;
     if (window.opener) {
       // send them to the opening window
       window.opener.postMessage(params);
       // close the popup
       window.close();
     }
  });

  return (
    <PageCanvas id='PopupRedirectPage' headerHeight={148} >
      <Grid container spacing={3} justify="center" >
        <Grid item xs={4}>
          <StyledCard height="auto">
            <CardHeader 
              title="Popup Redirect!" 
              style={{fontSize: '100%'}} />
            <CardContent>
              You can close this window.
            </CardContent>
          </StyledCard>          
        </Grid>
      </Grid>                 
    </PageCanvas>
  );
}

export default PopupRedirectPage;