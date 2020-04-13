import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PageCanvas, StyledCard } from 'material-fhir-ui';

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


function LaunchPage(props){

  const classes = useStyles();
  
  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

    

  return (
    <PageCanvas id='LaunchPage' headerHeight={148} >
      <Grid container spacing={3} justify="center" >
        <Grid item xs={4}>
          <StyledCard height="auto">
            <CardHeader 
              title="Launch!" 
              style={{fontSize: '100%'}} />
            <CardContent>
              Launching the app.  
            </CardContent>
          </StyledCard>          
        </Grid>
      </Grid>                 
    </PageCanvas>
  );
}

export default LaunchPage;