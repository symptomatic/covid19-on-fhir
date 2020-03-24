import React, { Component, useState, useEffect } from 'react';


import { makeStyles, withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import { Patients, Encounters, Observations, EncountersTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { PageCanvas, StyledCard, PatientTable } from 'material-fhir-ui';
import { useTracker } from './Tracker';

import Client from 'fhir-kit-client';

import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';


console.log('Intitializing fhir-kit-client for ' + get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseDstu2'))
Session.setDefault("fhirServerEndpoint", get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseDstu2'))

let fhirClient = new Client({
  baseUrl: get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseDstu2')
});

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


Session.setDefault('fhirKitClientStartDate', '2015-09-01');
Session.setDefault('fhirKitClientEndDate', '2015-09-30');
Session.setDefault('totalEncountersDuringDateRange', 0);
Session.setDefault('currentEncounterSearchset', null);
Session.setDefault("encounterQueryBundleTotal", 0);
Session.setDefault("fetchEverythingBundleTotal", 0);



function FhirQueryPage(props){
  let selectedStartDate = Session.get("fhirKitClientStartDate");
  let selectedEndDate = Session.get("fhirKitClientEndDate");
  let encounterCursor;
  let patientsCursor;
  let totalEncountersDuringDateRange = 0;

  const classes = useStyles();

  const rowsPerPage = get(Meteor, 'settings.public.defaults.rowsPerPage', 25);


  let endpointDefinedInSettings = get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseDstu2')

  endpointDefinedInSettings = useTracker(function(){
    return Session.get('fhirServerEndpoint');
  }, [props.lastUpdated]);


  // const [json, setJson] = useState(""); 
  let [patients, setPatients] = useState([]);
  let [encounters, setEncounters] = useState([]);

  //-------------------------------------------------------------------
  // Tracking

  selectedStartDate = useTracker(function(){
    return Session.get("fhirKitClientStartDate");
  }, []);

  selectedEndDate = useTracker(function(){
    return Session.get("fhirKitClientEndDate");
  }, []);  

  totalEncountersDuringDateRange = useTracker(function(){
    return Session.get("totalEncountersDuringDateRange");
  }, []);  

  encounterCursor = useTracker(function(){    
    logger.debug('FhirQueryPage.Encounters.find()', Encounters.find().fetch());
    return Encounters.find();
  }, []);  

  if(encounterCursor){
    encounters = encounterCursor.fetch();
  }

  patientsCursor = useTracker(function(){
    // this console logging statement may be creating a side effect
    // that triggers the re-render
    logger.debug('FhirQueryPage.Patients.find()', Patients.find().fetch());
    return Patients.find();
  }, []);  




  //-------------------------------------------------------------------
  // Progress Bars

  

  const [autofetchCompleted, setAutofetchCompleted] = React.useState(0);
  const [fetchEverythingCompleted, setFetchEverythingCompleted] = React.useState(0);
  const [autofetchBuffer, setAutofetchBuffer] = React.useState(10);

  let encounterQueryBundleTotal = 0;
  encounterQueryBundleTotal = useTracker(function(){
    setAutofetchCompleted(Session.get("encounterQueryBundleTotal"));
    return Session.get("encounterQueryBundleTotal");
  }, []);

  let fetchEverythingBundleTotal = 0;
  fetchEverythingBundleTotal = useTracker(function(){
    return Session.get("fetchEverythingBundleTotal");
  }, []);

  let encounterCount = 0;
  encounterCount = useTracker(function(){    
    setAutofetchCompleted(Encounters.find().count());
    return Encounters.find().count()
  }, []);  

  let patientCount = 0;
  patientCount = useTracker(function(){    
    return Patients.find().count()
  }, []);  


  let autofetchAllProgress;
  let encounterQueryPortionCompleted = 0;
  if(encounterQueryBundleTotal > 0){
    encounterQueryPortionCompleted = (autofetchCompleted / encounterQueryBundleTotal) * 100;
    autofetchAllProgress = <LinearProgress variant="determinate" value={encounterQueryPortionCompleted} />
  }

  let fetchEverythingProgress;
  let fetchEverythingPortionCompleted = 0;
  if(fetchEverythingBundleTotal > 0){
    fetchEverythingPortionCompleted = (fetchEverythingCompleted / fetchEverythingBundleTotal) * 100;
    fetchEverythingProgress = <LinearProgress variant="determinate" value={fetchEverythingPortionCompleted} />
  }

  //-------------------------------------------------------------------
  // Methods

  function openPage(url){
    logger.debug('client.app.patient.PatientSidebar.openPage', url);
    if(props.history){
      props.history.replace(url)
    }
  }

  function autofetchAll(props){
    logger.warn('FhirQueryPage.autofetchAll()');

    // setAutofetchCompleted(1);
    
    if(Meteor.isDesktop){
      Desktop.fetch('localStorage', 'getAll').then((response) => {
        console.log('Desktop.getAll.response', response)
      }).catch(() => {
        console.error('Desktop failed to fetch anything.');
      });
    }

    // fetchEncounterData(props, function(){
    //   fetchPatientsFromEncounters(props, function(){
    //     fetchPatientEverything();        
    //   });
    // });
  }

  async function recursiveEncounterQuery(fhirClient, searchResponse, encountersArray, callback){
    logger.debug('recursiveEncounterQuery', fhirClient, searchResponse);
  
    let self = this;

    function hasNext(searchResponse){
      let result = false;
      if(get(searchResponse, 'link')){
        searchResponse.link.forEach(function(link){
          if(get(link, 'relation') === "next"){
            result = true;
          }
        })
      }
      return result;
    }

    let recursiveResult = null;
    if(hasNext(searchResponse)){
      logger.debug('Found a next link in the bundle.  Fetching...')
      recursiveResult = await fhirClient.nextPage(searchResponse)
      .then((newResponse) => {
        logger.trace('fetchEncounterData.newResponse', newResponse);

        if(get(newResponse, 'resourceType') === "Bundle"){
          logger.debug('Parsing a Bundle.')
          let entries = get(newResponse, 'entry', []);

          if(get(newResponse, 'total') > 0){
            Session.set("encounterQueryBundleTotal", get(newResponse, 'total'))
          }
          
          entries.forEach(function(entry){
            if(get(entry, 'resource.resourceType') === "Encounter"){
              logger.trace('Found an encounter', get(entry, 'resource'));

              if(!Encounters.findOne({id: get(entry, 'resource.id')})){
                let encounterId = Encounters.insert(get(entry, 'resource'), {validate: false, filter: false});
                logger.trace('Just received new encounter: ' + encounterId);
    
                if(!get(entry, 'resource.id')){
                  entry.resource.id = encounterId;
                } 
                if(!get(entry, 'resource._id')){
                  entry.resource._id = encounterId;
                }
    
                encountersArray.push(get(entry, 'resource'))  
              }
            }
          })        

          // setEncounters(encountersArray);  // this is mostly just to update the progress so people see things are loading
          encountersArray = recursiveEncounterQuery(fhirClient, newResponse, encountersArray, callback)
        } 

        setEncounters(encountersArray);
        return encountersArray;
      })
    } else {
      callback();
    }

    return recursiveResult;
  }


  async function fetchEncounterData(props, callback){

    logger.debug('Fetch encounter data from the following endpoint: ', endpointDefinedInSettings);
  

    setAutofetchCompleted(1);

    let encountersArray = [];
    let searchOptions = { 
      resourceType: 'Encounter', 
      searchParams: { 
        date: []
      }
    };

    searchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    searchOptions.searchParams.date[1] = "le" +  selectedEndDate

    logger.trace('searchOptions', searchOptions)

    await fhirClient.search(searchOptions)
    .then((searchResponse) => {
      logger.debug('fetchEncounterData.searchResponse', searchResponse);

      if(searchResponse){
        let encountersArray = [];

        if(searchResponse.total){
          Session.set('totalEncountersDuringDateRange', searchResponse.total);
          Session.set('currentEncounterSearchset', searchResponse);
        }
      }

      // Session.set('helloFhirQueryResults', searchResponse);
      // setJson(JSON.stringify(searchResponse));

      if(get(searchResponse, 'resourceType') === "Bundle"){
        logger.debug('Parsing a Bundle.')
        let entries = get(searchResponse, 'entry', []);
        
        entries.forEach(function(entry){
          if(get(entry, 'resource.resourceType') === "Encounter"){

             // checking for duplicates along the way
            if(!Encounters.findOne({id: get(entry, 'resource.id')})){
              logger.trace('doesnt exist, upserting');

              let encounterId = Encounters.insert(get(entry, 'resource'), {validate: false, filter: false});
              logger.trace('Just received new encounter: ' + encounterId);
  
              if(!get(entry, 'resource.id')){
                entry.resource.id = encounterId;
              } 
              if(!get(entry, 'resource._id')){
                entry.resource._id = encounterId;
              }
  
              encountersArray.push(get(entry, 'resource'))
            }     
          }
        })        
      }

      encountersArray = recursiveEncounterQuery(fhirClient, searchResponse, encountersArray, function(error, result){
        logger.info("We just finished the recursive query and received the following result: " + result)
      });

      return encountersArray;
    })
    .then((encountersArray) => {
      // console.log('encountersArray', encountersArray);
      setEncounters(encountersArray);
      if(callback){
        callback();
      }
      return encountersArray;
    })
    .catch((error) => {
      logger.error(error);
    });

    // console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&')
    // console.log('first searchResponse', searchResponse)


  }

  function fetchPatientsFromEncounters(props, callback){
    logger.info('FhirQueryPage.fetchPatientsFromEncounters()');

    Session.set("encounterQueryBundleTotal", 0)

    let patientReference = "";
    let patientReferenceArray = [];
    let patientId = "";
    let newPatientId = "";
    let fetchedPatientResponse;
    logger.debug('Encounters.find().fetch()', Encounters.find().fetch());
    
    Encounters.find().forEach(async function(encounter){
      newPatientId = "";

      if(get(encounter, 'patient.reference')){
        patientReference = get(encounter, 'patient.reference');
        patientReferenceArray = patientReference.split('/');
        patientId = patientReferenceArray[patientReferenceArray.length - 1];
      } else if (get(encounter, 'subject.reference')){
        patientReference = get(encounter, 'subject.reference');
        patientReferenceArray = patientReference.split('/');
        patientId = patientReferenceArray[patientReferenceArray.length - 1];
      }

      logger.debug('fetchPatientsFromEncounters.encounters[i].patientId', patientId);

      fetchedPatientResponse = await fhirClient.read({ resourceType: 'Patient', id: patientId });
      logger.debug('fetchedPatientResponse', fetchedPatientResponse);

      if(fetchedPatientResponse){
        if(fetchedPatientResponse.resourceType === "Patient"){
          if(!Patients.findOne({id: fetchedPatientResponse.id})){
            newPatientId = Patients.insert(fetchedPatientResponse, {validate: false, filter: false});
            logger.verbose('Just received new patient: ' + newPatientId);
          }    
        } else if(fetchedPatientResponse.resourceType === "Bundle"){
          if(Array.isArray(fetchedPatientResponse.entry)){
            fetchedPatientResponse.entry.forEach(function(entry){
              if(get(entry, 'resource.resourceType') === "Patient"){
                console.log('Searching for patient id: ' + get(entry, 'resource.id'));                
                if(!Patients.findOne({id: get(entry, 'resource.id')})){
                  newPatientId = Patients.insert(get(entry, 'resource'), {validate: false, filter: false});
                  logger.verbose('Just added a new patient: ' + newPatientId);
                } else {
                  console.log("Already found the patient?")
                }
              }
            })
          }
        }
      }
    })

    if(typeof callback === "function"){
      callback();
    }
  }


  function handleStartDateChange(event, newDate){
    Session.set('fhirKitClientStartDate', moment(newDate).format("YYYY-MM-DD"))
  }

  function handleEndDateChange(event, newDate){
    Session.set('fhirKitClientEndDate', moment(newDate).format("YYYY-MM-DD"))
  }


  function handleFhirEndpointChange(event){
    logger.trace('handleFhirEndpointChange', event.target.value)

    if(event.target.value){
      Session.set("fhirServerEndpoint", event.target.value)

      fhirClient = new Client({
        baseUrl: event.target.value
      });
    }
  }

  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

  let patientTitle = 'Patients';
  let encountersTitle = 'Encounters';

  if(typeof Patients === "object"){
    patientTitle = Patients.find().count() + ' Patients';
  }

  if(typeof Encounters === "object"){
    encountersTitle = encounters.length + ' Encounters';
  }


  selectedStartDate = moment(selectedStartDate).format("YYYY-MM-DD");
  selectedEndDate = moment(selectedEndDate).format("YYYY-MM-DD");
    

  return (
    <PageCanvas id='fetchDataFromHospitalPage' headerHeight={128} >
      <MuiPickersUtilsProvider utils={MomentUtils} libInstance={moment} local="en">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CardHeader 
              title="Fetch Data from Hospital" 
              subheader="Only fetching data needed for cardiac accreditation.  For more information, please see the About page."
              style={{fontSize: '100%'}} />

            <StyledCard >
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={8}>
                    <TextField
                      id="fhirQueryUrl"
                      name="fhirQueryUrl"
                      className={classes.textField}
                      label="Health Record and Interoperability Resource Query"
                      value={ endpointDefinedInSettings }
                      placeholder="http://localhost:3100/baseDstu2/Patient?_count=20"
                      helperText='Please enter a web address URL.  '
                      fullWidth
                      margin="normal"
                      onChange={handleFhirEndpointChange}
                    />

                  </Grid>
                  <Grid item xs={2}>
                    <div>
                      <KeyboardDatePicker
                        fullWidth
                        variant="inline"
                        format="YYYY-MM-DD"
                        margin="normal"
                        id="startDatePicker"
                        label="Start Date"
                        value={selectedStartDate}
                        onChange={handleStartDateChange}
                      />
                    </div>
                  </Grid>
                  <Grid item xs={2}>
                    <div>
                      <KeyboardDatePicker
                        fullWidth
                        variant="inline"
                        format="YYYY-MM-DD"
                        margin="normal"
                        id="endDatePicker"
                        label="End Date"
                        value={selectedEndDate}
                        onChange={handleEndDateChange}
                      />
                    </div>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions style={{display: 'inline-flex', width: '100%'}} >
                <Button id="fetchEncountersButton" color="primary" variant="contained" className={classes.button} onClick={autofetchAll.bind(this)} >§1 Autofetch All</Button>            
              </CardActions>
              { autofetchAllProgress }
              
            </StyledCard>            
          </Grid>
          <Grid item xs={6}>
            {/* <StyledCard id="fetchedEncountersCard">
              <CardHeader 
                id="encounterCardCount"
                title={encountersTitle} 
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
                <EncountersTable
                  id="fetchedEncountersTable"
                  encounters={encounters}
                  rowsPerPage={10}
                  count={totalEncountersDuringDateRange}
                  hideCheckboxes
                  hideTypeCode
                  hideReasonCode
                  hideReason
                  barcodes={false}
                  hideIdentifier
                  hideStatus
                  hideActionIcons
                  hideStartDateTime
                  hideEndDateTime
                  multiline
                  hideType
                />
              </CardContent>
            </StyledCard> */}
          </Grid>
          <Grid item xs={6}>
            {/* <StyledCard id="fetchedPatientsCard">
              <CardHeader 
                id="patientCardCount"
                title={patientTitle}  
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
                <PatientTable
                  id="fetchedPatientsTable"
                  patients={patients}
                  hideIdentifier
                  hideMaritalStatus
                  rowsPerPage={10}
                  count={patients.length}
                  hideActionIcons
                  hideLanguage
                  showCounts
                  hideActive
              />
              </CardContent>
            </StyledCard> */}
          </Grid>
        </Grid>    
      </MuiPickersUtilsProvider>            
    </PageCanvas>
  );
}

export default FhirQueryPage;