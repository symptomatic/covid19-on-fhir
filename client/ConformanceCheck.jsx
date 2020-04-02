import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import { 
  Card,
  CardHeader,
  CardContent,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box,
} from '@material-ui/core';

import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';


import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';


//=============================================================================================================================================
// TABS

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>
  );
}

export function ConformanceCheck(props){

  const [tabIndex, setTabIndex] = useState(0);

  let { 
    children, 
    id,
    jsonContent,
    ...otherProps 
  } = props;

  let textToRender = "";

  if(jsonContent){
    if(typeof jsonContent === "string"){
      textToRender = jsonContent
    } else if(typeof jsonContent === "object") {
      textToRender = JSON.stringify(jsonContent, null, 2);
    }
  }

  function handleTabChange(event, newIndex){
    setTabIndex(newIndex);
  }

  
  let canSearchConditions = false;
  let canSearchDevices = false;
  let canSearchEncounters = false;
  let canSearchProcedures = false;

  console.log('ConformanceCheck is parsing a JSON object it was given.', jsonContent)

  if(get(jsonContent, 'resourceType') === "CapabilityStatement"){
    console.log('Found CapabilityStatement');
    if(get(jsonContent, 'rest[0].mode') === "server"){
      console.log('CapabilityStatement claims it is a server.');
      if(Array.isArray(get(jsonContent, 'rest[0].resource'))){
        let resourceArray = get(jsonContent, 'rest[0].resource');
        console.log('Loading resource array from CapabilityStatement.');

        resourceArray.forEach(function(resource){
          if(get(resource, 'type') === "Condition"){
            console.log('Found a statement regarding Condition resources.');
            let deviceInteractions = get(resource, 'interaction');
            deviceInteractions.forEach(function(interaction){
              if(interaction.code === "read"){
                canSearchConditions = true;
              }
            })
          }   
          if(get(resource, 'type') === "Device"){
            console.log('Found a statement regarding Device resources.');
            let deviceInteractions = get(resource, 'interaction');
            deviceInteractions.forEach(function(interaction){
              if(interaction.code === "read"){
                canSearchDevices = true;
              }
            })
          }  
          if(get(resource, 'type') === "Encounter"){
            console.log('Found a statement regarding Encounter resources.');
            let deviceInteractions = get(resource, 'interaction');
            deviceInteractions.forEach(function(interaction){
              if(interaction.code === "read"){
                canSearchEncounters = true;
              }
            })
          } 
          if(get(resource, 'type') === "Procedure"){
            console.log('Found a statement regarding Procedure resources.');
            let deviceInteractions = get(resource, 'interaction');
            deviceInteractions.forEach(function(interaction){
              if(interaction.code === "read"){
                canSearchProcedures = true;
              }
            })
          }  
        })
      }
    }
  }

  let conditionsStatement = <span style={{color: 'red'}}>𐄂 Server doesn't support Conditions</span>;
  let devicesStatement = <span style={{color: 'red'}}>𐄂 Server doesn't support Devices</span>;
  let encountersStatement = <span style={{color: 'red'}}>𐄂 Server doesn't support Encounters</span>
  let proceduresStatement = <span style={{color: 'red'}}>𐄂 Server doesn't support Procedures</span>

  if(canSearchConditions){
    conditionsStatement = <span style={{color: 'green'}}>✓ Can search and read Conditions</span>;
  }
  if(canSearchDevices){
    devicesStatement = <span style={{color: 'green'}}>✓ Can search and read Devices</span>;
  }
  if(canSearchEncounters){
    encountersStatement = <span style={{color: 'green'}}>✓ Can search and read Encounters</span>;
  }
  if(canSearchProcedures){
    proceduresStatement = <span style={{color: 'green'}}>✓ Can search and read Procedures</span>;
  }




  return(
    <DialogContent id={id} className="conformanceCheck" style={{minWidth: '600px'}} dividers={scroll === 'paper'}>
        <Tabs value={tabIndex} onChange={handleTabChange.bind(this)} aria-label="simple tabs example">
          <Tab label="Parsed" value={0} />
          <Tab label="Raw Text" value={1} />
        </Tabs>
        <TabPanel value={tabIndex} index={0}>
          {conditionsStatement}<br />
          {devicesStatement}<br />
          {encountersStatement}<br />
          {proceduresStatement}<br />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <pre>
            { textToRender }
          </pre>
        </TabPanel>
    </DialogContent>
  )
}

export default ConformanceCheck;