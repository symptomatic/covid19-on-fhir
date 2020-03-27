import React, { Component, useState, useEffect } from 'react';


import { makeStyles, withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import { Patients, Encounters, Observations, EncountersTable, ConditionsTable, ProceduresTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { PageCanvas, StyledCard, PatientTable } from 'material-fhir-ui';
import { useTracker } from './Tracker';

import FhirUtilities from '../lib/FhirUtilities';


import Client from 'fhir-kit-client';

import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

// Session.setDefault("fhirServerEndpoint", "http://localhost:3100/baseR4");

let fhirClient = new Client({
  baseUrl: get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseR4')
});
console.log('Intitializing fhir-kit-client for ' + get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseR4'))

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


Session.setDefault('fhirKitClientStartDate', '2020-03-01');
Session.setDefault('fhirKitClientEndDate', '2020-03-31');
Session.setDefault('totalEncountersDuringDateRange', 0);
Session.setDefault('currentEncounterSearchset', null);


function CovidQueryPage(props){
  let selectedStartDate = Session.get("fhirKitClientStartDate");
  let selectedEndDate = Session.get("fhirKitClientEndDate");

  let totalEncountersDuringDateRange = 0;

  const classes = useStyles();

  const rowsPerPage = get(Meteor, 'settings.public.defaults.rowsPerPage', 25);


  let [patients, setPatients] = useState([]);
  let [encounters, setEncounters] = useState([]);
  let [conditions, setConditions] = useState([]);
  let [procedures, setProcedures] = useState([]);

  let [fhirServerEndpoint, setFhirServerEndpoint] = useState(get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseR4'));


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



  let encounterCursor;
  encounterCursor = useTracker(function(){    
    logger.debug('CovidQueryPage.Encounters.find()', Encounters.find().fetch());
    return Encounters.find();
  }, [props.lastUpdated]);  

  if(encounterCursor){
    encounters = encounterCursor.fetch();
  }

  let patientsCursor;
  patientsCursor = useTracker(function(){
    // this console logging statement may be creating a side effect
    // that triggers the re-render
    //logger.debug('CovidQueryPage.Patients.find()', Patients.find().fetch());
    return Patients.find();
  }, [props.lastUpdated]);  
  if(patientsCursor){
    patients = patientsCursor.fetch();
  }

  let conditionsCursor;
  conditionsCursor = useTracker(function(){
    // this console logging statement may be creating a side effect
    // that triggers the re-render
    //logger.trace('CovidQueryPage.Conditions.find()', Conditions.find().fetch());
    return Conditions.find();
  }, [props.lastUpdated]); 
  if(conditionsCursor){
    conditions = conditionsCursor.fetch();
  }

  let proceduresCursor;
  proceduresCursor = useTracker(function(){
    // this console logging statement may be creating a side effect
    // that triggers the re-render
    //logger.debug('CovidQueryPage.Procedures.find()', Procedures.find().fetch());
    return Procedures.find();
  }, [props.lastUpdated]); 
  if(proceduresCursor){
    procedures = proceduresCursor.fetch();
  }


  //-------------------------------------------------------------------
  // Progress Bars

  

  const [autofetchCompleted, setAutofetchCompleted] = React.useState(0);
  const [fetchEverythingCompleted, setFetchEverythingCompleted] = React.useState(0);
  const [autofetchBuffer, setAutofetchBuffer] = React.useState(10);



  
  let encounterCount = 0;
  encounterCount = useTracker(function(){    
    setAutofetchCompleted(Encounters.find().count());
    return Encounters.find().count()
  }, []);  

  let patientCount = 0;
  patientCount = useTracker(function(){    
    return Patients.find().count()
  }, []);  

  let conditionCount = 0;
  conditionCount = useTracker(function(){    
    return Conditions.find().count()
  }, []);  

  let procedureCount = 0;
  procedureCount = useTracker(function(){    
    return Procedures.find().count()
  }, []);  

  //-------------------------------------------------------------------
  // Button Methods

  function openPage(url){
    logger.debug('client.app.patient.PatientSidebar.openPage', url);
    if(props.history){
      props.history.replace(url)
    }
  }


  function handleFetchEncounters(props){
    logger.warn('CovidQueryPage.handleFetchEncounters()');

    fetchEncounterData(props, function(){
      fetchPatientsFromFhirArray(props, Encounters.find().fetch());
    });
  }
  function handleFetchConditions(props){
    logger.warn('CovidQueryPage.handleFetchConditions()');

    fetchConditionData(props, function(){
      fetchPatientsFromFhirArray(props, Conditions.find().fetch());
    });
  }
  function handleFetchProcedures(props){
    logger.warn('CovidQueryPage.handleFetchProcedures()');

    fetchProcedureData(props, function(){
      fetchPatientsFromFhirArray(props, Procedures.find().fetch());
    });
  }

  //-------------------------------------------------------------------
  // Recursive Methods

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
        logger.trace('recursiveEncounterQuery().fhirClient.nextPage().newResponse', newResponse);

        if(get(newResponse, 'resourceType') === "Bundle"){
          logger.debug('Parsing a Bundle.')
          let entries = get(newResponse, 'entry', []);

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

        // setEncounters(encountersArray);
        return encountersArray;
      })
    } else {
      callback();
    }

    return recursiveResult;
  }



  async function recursiveConditionQuery(fhirClient, searchResponse, conditionsArray, callback){
    logger.debug('recursiveConditionQuery', fhirClient, searchResponse);
  
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
        logger.trace('recursiveConditionQuery().fhirClient.nextPage().newResponse', newResponse);

        if(get(newResponse, 'resourceType') === "Bundle"){
          logger.debug('Parsing a Bundle.')
          let entries = get(newResponse, 'entry', []);

          entries.forEach(function(entry){
            if(get(entry, 'resource.resourceType') === "Condition"){
              logger.trace('Found an condition', get(entry, 'resource'));

              if(!Conditions.findOne({id: get(entry, 'resource.id')})){
                let conditionId = Conditions.insert(get(entry, 'resource'), {validate: false, filter: false});
                logger.trace('Just received new condition: ' + conditionId);
    
                if(!get(entry, 'resource.id')){
                  entry.resource.id = conditionId;
                } 
                if(!get(entry, 'resource._id')){
                  entry.resource._id = conditionId;
                }
    
                conditionsArray.push(get(entry, 'resource'))  
              }
            }
          })        

          // setConditions(conditionsArray);  // this is mostly just to update the progress so people see things are loading
          conditionsArray = recursiveConditionQuery(fhirClient, newResponse, conditionsArray, callback)
        } 

        // setEncounters(conditionsArray);
        return conditionsArray;
      })
    } else {
      callback();
    }

    return recursiveResult;
  }




  async function recursiveProcedureQuery(fhirClient, searchResponse, proceduresArray, callback){
    logger.debug('recursiveProcedureQuery', fhirClient, searchResponse);
  
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
        logger.trace('recursiveProcedureQuery().fhirClient.nextPage().newResponse', newResponse);

        if(get(newResponse, 'resourceType') === "Bundle"){
          logger.debug('Parsing a Bundle.')
          let entries = get(newResponse, 'entry', []);

          entries.forEach(function(entry){
            if(get(entry, 'resource.resourceType') === "Procedure"){
              logger.trace('Found an procedure', get(entry, 'resource'));

              if(!Procedures.findOne({id: get(entry, 'resource.id')})){
                let procedureId = Procedures.insert(get(entry, 'resource'), {validate: false, filter: false});
                logger.trace('Just received new procedure: ' + procedureId);
    
                if(!get(entry, 'resource.id')){
                  entry.resource.id = procedureId;
                } 
                if(!get(entry, 'resource._id')){
                  entry.resource._id = procedureId;
                }
    
                proceduresArray.push(get(entry, 'resource'))  
              }
            }
          })        

          // setProcedures(proceduresArray);  // this is mostly just to update the progress so people see things are loading
          proceduresArray = recursiveProcedureQuery(fhirClient, newResponse, proceduresArray, callback)
        } 

        // setEncounters(proceduresArray);
        return proceduresArray;
      })
    } else {
      callback();
    }

    return recursiveResult;
  }

  //-------------------------------------------------------------------
  // Methods

  async function fetchEncounterData(props, callback){
    logger.debug('Fetch encounter data from the following endpoint: ' + fhirServerEndpoint);


    let encountersArray = [];
    let searchOptions = { 
      resourceType: 'Encounter', 
      searchParams: { 
        date: []
      }
    };

    searchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    searchOptions.searchParams.date[1] = "le" +  selectedEndDate;

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
      if(typeof callback === "function"){
        callback();
      }
      return encountersArray;
    })
    .catch((error) => {
      console.log(error)
    });
  }

  async function fetchConditionData(props, callback){
    logger.debug('Fetch condition data from the following endpoint: ' + fhirServerEndpoint);


    let conditionsArray = [];
    let searchOptions = { 
      resourceType: 'Condition',
      searchParams: {
        code: "49727002,267036007,386661006,840539006"
      } 
    };
    searchOptions.searchParams["onset-date"] = [];

    searchOptions.searchParams["onset-date"][0] = "ge" + selectedStartDate;
    searchOptions.searchParams["onset-date"][1] = "le" +  selectedEndDate;

    logger.debug('searchOptions', searchOptions)

    await fhirClient.search(searchOptions)
    .then((searchResponse) => {
      logger.debug('fetchConditionData.searchResponse', searchResponse);

      if(searchResponse){
        let conditionsArray = [];

        if(searchResponse.total){
          Session.set('totalConditionsDuringDateRange', searchResponse.total);
          Session.set('currentConditionSearchset', searchResponse);
        }
      }

      if(get(searchResponse, 'resourceType') === "Bundle"){
        logger.debug('Parsing a Bundle.')
        let entries = get(searchResponse, 'entry', []);
        
        entries.forEach(function(entry){
          if(get(entry, 'resource.resourceType') === "Condition"){

             // checking for duplicates along the way
            if(!Conditions.findOne({id: get(entry, 'resource.id')})){
              logger.trace('doesnt exist, upserting');

              let conditionId = Conditions.insert(get(entry, 'resource'), {validate: false, filter: false});
              logger.trace('Just received new condition: ' + conditionId);
  
              if(!get(entry, 'resource.id')){
                entry.resource.id = conditionId;
              } 
              if(!get(entry, 'resource._id')){
                entry.resource._id = conditionId;
              }
  
              conditionsArray.push(get(entry, 'resource'))
            }     
          }
        })        
      }

      conditionsArray = recursiveConditionQuery(fhirClient, searchResponse, conditionsArray, function(error, result){
        logger.info("We just finished the recursive query and received the following result: " + result)
      });

      return conditionsArray;
    })
    .then((conditionsArray) => {
      // console.log('conditionsArray', conditionsArray);
      setConditions(conditionsArray);
      if(typeof callback === "function"){
        callback();
      }
      return conditionsArray;
    })
    .catch((error) => {
      console.log(error)
    });
  }

  async function fetchProcedureData(props, callback){
    logger.debug('Fetch procedure data from the following endpoint: ' + fhirServerEndpoint);


    let proceduresArray = [];
    let searchOptions = { 
      resourceType: 'Procedure', 
      searchParams: { 
        date: [],
        code: "371908008"
      }
    };
    searchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    searchOptions.searchParams.date[1] = "le" +  selectedEndDate;

    logger.trace('searchOptions', searchOptions)

    await fhirClient.search(searchOptions)
    .then((searchResponse) => {
      logger.debug('fetchProcedureData.searchResponse', searchResponse);

      if(searchResponse){
        let proceduresArray = [];

        if(searchResponse.total){
          Session.set('totalProceduresDuringDateRange', searchResponse.total);
          Session.set('currentProcedureSearchset', searchResponse);
        }
      }

      if(get(searchResponse, 'resourceType') === "Bundle"){
        logger.debug('Parsing a Bundle.')
        let entries = get(searchResponse, 'entry', []);
        
        entries.forEach(function(entry){
          if(get(entry, 'resource.resourceType') === "Procedure"){

             // checking for duplicates along the way
            if(!Procedures.findOne({id: get(entry, 'resource.id')})){
              logger.trace('doesnt exist, upserting');

              let procedureId = Procedures.insert(get(entry, 'resource'), {validate: false, filter: false});
              logger.trace('Just received new procedure: ' + procedureId);
  
              if(!get(entry, 'resource.id')){
                entry.resource.id = procedureId;
              } 
              if(!get(entry, 'resource._id')){
                entry.resource._id = procedureId;
              }
  
              proceduresArray.push(get(entry, 'resource'))
            }     
          }
        })        
      }

      proceduresArray = recursiveProcedureQuery(fhirClient, searchResponse, proceduresArray, function(error, result){
        logger.info("We just finished the recursive query and received the following result: " + result)
      });

      return proceduresArray;
    })
    .then((proceduresArray) => {
      // console.log('proceduresArray', proceduresArray);
      setProcedures(proceduresArray);
      if(typeof callback === "function"){
        callback();
      }
      return proceduresArray;
    })
    .catch((error) => {
      console.log(error)
    });
  }





  function fetchPatientsFromFhirArray(props, arrayOfResources){
    logger.info('CovidQueryPage.fetchPatientsFromFhirArray()');

    let patientReference = "";
    let patientReferenceArray = [];
    let patientId = "";
    let newPatientId = "";
    let fetchedPatientResponse;

    logger.trace('fetchPatientsFromFhirArray.arrayOfResources' + arrayOfResources);
    
    if(Array.isArray(arrayOfResources)){
      arrayOfResources.forEach(async function(resource){
        newPatientId = "";
  
        if(get(resource, 'patient.reference')){
          patientReference = get(resource, 'patient.reference');
          patientId = FhirUtilities.pluckReferenceId(patientReference);
        } else if (get(resource, 'subject.reference')){
          patientReference = get(resource, 'subject.reference');
          patientId = FhirUtilities.pluckReferenceId(patientReference);
        }
  
        logger.debug('fetchPatientsFromFhirArray.encounters[i].patientId', patientId);
  
        fetchedPatientResponse = await fhirClient.read({ resourceType: 'Patient', id: patientId });
        logger.trace('fetchedPatientResponse', fetchedPatientResponse);
  
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
    }
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
      // Session.set("fhirServerEndpoint", event.target.value)
      setFhirServerEndpoint(event.target.value)

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
  let conditionsTitle = 'Conditions';
  let proceduresTitle = 'Procedures';

  if(typeof Patients === "object"){
    patientTitle = patientCount + ' Patients';
  }

  if(typeof Encounters === "object"){
    encountersTitle = encounterCount + ' Encounters';
  }

  if(typeof Encounters === "object"){
    conditionsTitle = conditionCount + ' Conditions';
  }

  if(typeof Procedures === "object"){
    proceduresTitle = procedureCount + ' Procedures';
  }

  
  selectedStartDate = moment(selectedStartDate).format("YYYY-MM-DD");
  selectedEndDate = moment(selectedEndDate).format("YYYY-MM-DD");
    

  return (
    <PageCanvas id='fetchDataFromHospitalPage' headerHeight={128} >
      <MuiPickersUtilsProvider utils={MomentUtils} libInstance={moment} local="en">
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <CardHeader 
              title="Fetch Covid Data" 
              subheader="Fetching data related to COVID19 coronavirus symptoms."
              style={{fontSize: '100%'}} />

            <StyledCard>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={8}>
                    <TextField
                      id="fhirQueryUrl"
                      name="fhirQueryUrl"
                      className={classes.textField}
                      label="Health Record and Interoperability Resource Query"
                      value={ fhirServerEndpoint }
                      placeholder="http://localhost:3100/baseR4/Patient?_count=20"
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
                <Button id="fetchEncountersButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchEncounters.bind(this)} >Fetch Encounters</Button> 
                <Button id="fetchConditionsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchConditions.bind(this)} >Fetch Conditions</Button> 
                <Button id="fetchProceduresButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchProcedures.bind(this)} >Fetch Procedures</Button> 
              </CardActions>              
            </StyledCard>            
          </Grid>
          <Grid item xs={6}>
            <StyledCard>

            </StyledCard>
          </Grid>
        </Grid>

        <Grid container spacing={3}>          
          <Grid item xs={4}>
            <StyledCard id="fetchedEncountersCard" style={{minHeight: '200px'}}>
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
                  hideEndDateTime
                  calculateDuration={false}
                  hideHistory
                  multiline
                  hideType
                />
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={4}>
            <StyledCard id="fetchedConditionssCard" style={{minHeight: '200px'}}>
              <CardHeader 
                id="conditionsCardCount"
                title={conditionsTitle} 
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
                <ConditionsTable
                  id="fetchedConditionsTable"
                  conditions={conditions}
                  rowsPerPage={10}
                  count={conditionCount}
                  displayPatientName={false}
                  displayAsserterName={false}
                  displayEvidence={false}
                  displayEndDate={false}
                  displayBarcode={false}
                />
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={4}>
            <StyledCard id="fetchedProceduresCard" style={{minHeight: '200px'}}>
              <CardHeader 
                id="proceduresCardCount"
                title={proceduresTitle} 
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
                <ProceduresTable
                  id="fetchedProceduresTable"                  
                  procedures={procedures}
                  rowsPerPage={10}
                  count={procedureCount}
                  hideActionIcons={true}
                  hideCategory={true}
                  hideCheckboxes={true}
                  hideIdentifier={true}
                  hideSubject={true}
                  hideBodySite={true}
                  hidePerformer={true}
                  hidePerformedDateEnd={true}
                  hideBarcode={true}
                  hideNotes={true}
                  hideActionButton={true}
                />
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={4}>
            <StyledCard id="fetchedPatientsCard">
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
                  showCounts={false}
                  hideActive
              />
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>   
      </MuiPickersUtilsProvider>            
    </PageCanvas>
  );
}

export default CovidQueryPage;