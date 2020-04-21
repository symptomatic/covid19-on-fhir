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

import { PageCanvas, StyledCard, PatientTable } from 'material-fhir-ui';
import { useTracker } from './Tracker';


import { Icon } from 'react-icons-kit';
import { github } from 'react-icons-kit/fa/github';

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
  },
  hero_button: {
    width: '100%', 
    marginTop: '20px', 
    marginBottom: '20px',
    textAlign: 'left'
  }
}));

//==============================================================================================
// MAIN COMPONENT


function TermsAndConditionsPage(props){

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
        <StyledCard>
          <CardHeader 
            title="Node on FHIR - Terms and Conditions" 
            subheader="Copyright 2020, Symptomatic, LLC"
            style={{fontSize: '100%'}} />
          <CardContent style={{fontSize: '120%'}}>
            <p>Permission is hereby granted, free of charge, to any person obtaining a copy of Node on FHIR and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
            <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
            <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
          </CardContent>
        </StyledCard>     

        <Button variant="contained" color="primary" className={classes.hero_button} href="https://github.com/symptomatic/node-on-fhir" >
          <Icon icon={github} size={48} /><CardHeader title="Download the Code" />
        </Button>

      </Container>
    </PageCanvas>
  );
}

export default TermsAndConditionsPage;