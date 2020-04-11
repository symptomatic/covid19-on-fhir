import React, { Component, useState, useEffect } from 'react';


import { makeStyles, withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';


import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';

import { Patients, Encounters, Conditions, Procedures, Devices, EncountersTable, ConditionsTable, ProceduresTable, DevicesTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';

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

function DynamicSpacer(props){
  return <br className="dynamicSpacer" style={{height: '40px'}}/>;
}

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

Session.setDefault('encounterUrl', "https://");
Session.setDefault('conditionUrl', "https://");
Session.setDefault('procedureUrl', "https://");
Session.setDefault('deviceUrl', "https://");

Session.setDefault('geoJsonLayer', "");

function CovidQueryPage(props){
  let selectedStartDate = Session.get("fhirKitClientStartDate");
  let selectedEndDate = Session.get("fhirKitClientEndDate");

  let totalEncountersDuringDateRange = 0;

  const classes = useStyles();

  const rowsPerPage = get(Meteor, 'settings.public.defaults.rowsPerPage', 25);


  let [patients,   setPatients]   = useState([]);
  let [encounters, setEncounters] = useState([]);
  let [conditions, setConditions] = useState([]);
  let [procedures, setProcedures] = useState([]);

  let [checkedTested,  setCheckedTested]  = useState(false);
  let [checkedFever,  setCheckedFever]  = useState(true);
  let [checkedCough,  setCheckedCough]  = useState(false);
  let [checkedDyspnea,  setCheckedDyspnea]  = useState(false);
  let [checkedVentilator,  setCheckedVentilator]  = useState(true);
  let [checkedOxygenAdministration,  setCheckedOxygenAdministration]  = useState(true);
  let [checkedCovid19,  setCheckedCovid19]  = useState(true);
  let [checkedSuspectedCovid19,  setCheckedSuspectedCovid19]  = useState(true);
  let [checkedHydroxychloroquine,  setCheckedHydroxychloroquine]  = useState(false);
  let [checkedBloodTypeA,  setCheckedBloodTypeA]  = useState(false);
  let [checkedSmoker,  setCheckedSmoker]  = useState(false);
  let [checkedHypertension,  setCheckedHypertension]  = useState(false);
  let [checkedTamiflu,  setCheckedTamiflu]  = useState(false);
  let [checkedSerumAntibodies,  setCheckedSerumAntibodies]  = useState(false);
  let [checkedVaccinated,  setCheckedVaccinated]  = useState(false);
  
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
    // logger.trace('CovidQueryPage.Encounters.find()', Encounters.find().fetch());
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


  let locationsCursor;
  locationsCursor = useTracker(function(){
    // this console logging statement may be creating a side effect
    // that triggers the re-render
    //logger.debug('CovidQueryPage.Procedures.find()', Procedures.find().fetch());
    return Locations.find();
  }, [props.lastUpdated]); 
  if(locationsCursor){
    locations = locationsCursor.fetch();
  }

  let devicesCursor;
  devicesCursor = useTracker(function(){
    // this console logging statement may be creating a side effect
    // that triggers the re-render
    //logger.debug('CovidQueryPage.Procedures.find()', Procedures.find().fetch());
    return Devices.find();
  }, [props.lastUpdated]); 
  if(devicesCursor){
    devices = devicesCursor.fetch();
  }


  //-------------------------------------------------------------------
  // Counters
  
  let encounterCount = 0;
  encounterCount = useTracker(function(){    
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

  let locationCount = 0;
  locationCount = useTracker(function(){    
    return Locations.find().count()
  }, []);  

  let deviceCount = 0;
  deviceCount = useTracker(function(){    
    return Devices.find().count()
  }, []);  


  let encounterUrl = 0;
  encounterUrl = useTracker(function(){    
    return Session.get('encounterUrl')
  }, [props.lastUpdated]);  

  let conditionUrl = 0;
  conditionUrl = useTracker(function(){    
    return Session.get('conditionUrl')
  }, [props.lastUpdated]);  

  let procedureUrl = 0;
  procedureUrl = useTracker(function(){    
    return Session.get('procedureUrl')
  }, [props.lastUpdated]);  

  let deviceUrl = 0;
  deviceUrl = useTracker(function(){    
    return Session.get('deviceUrl')
  }, [props.lastUpdated]);  



  //-------------------------------------------------------------------
  // Toggle Methods

  function handleToggleFever(props){
    logger.warn('CovidQueryPage.handleToggleFever()');

    if(checkedFever){
      setCheckedFever(false);
    } else {
      setCheckedFever(true);
    }
  }
  function handleToggleCough(props){
    logger.warn('CovidQueryPage.handleToggleCough()');

    if(checkedCough){
      setCheckedCough(false);
    } else {
      setCheckedCough(true);
    }
  }
  function handleToggleDyspnea(props){
    logger.warn('CovidQueryPage.handleToggleDyspnea()');

    if(checkedDyspnea){
      setCheckedDyspnea(false);
    } else {
      setCheckedDyspnea(true);
    }
  }
  function handleToggleVentilator(props){
    logger.warn('CovidQueryPage.handleToggleVentilator()');

    if(checkedVentilator){
      setCheckedVentilator(false);
    } else {
      setCheckedVentilator(true);
    }
  }
  function handleToggleOxygenAdministration(props){
    logger.warn('CovidQueryPage.handleToggleOxygenAdministration()');

    if(checkedOxygenAdministration){
      setCheckedOxygenAdministration(false);
    } else {
      setCheckedOxygenAdministration(true);
    }
  }
  
  function handleToggleTested(props){
    logger.warn('CovidQueryPage.handleToggleTested()');

    if(checkedTested){
      setCheckedTested(false);
    } else {
      setCheckedTested(true);
    }
  }
  function handleToggleSuspectedCovid19(props){
    logger.warn('CovidQueryPage.handleToggleSuspectedCovid19()');

    if(checkedSuspectedCovid19){
      setCheckedSuspectedCovid19(false);
    } else {
      setCheckedSuspectedCovid19(true);
    }
  }
  function handleToggleCovid19(props){
    logger.warn('CovidQueryPage.handleToggleCovid19()');

    if(checkedCovid19){
      setCheckedCovid19(false);
    } else {
      setCheckedCovid19(true);
    }
  }

  function handleToggleHydroxychloroquine(props){
    logger.warn('CovidQueryPage.handleToggleHydroxychloroquine()');

    if(checkedHydroxychloroquine){
      setCheckedHydroxychloroquine(false);
    } else {
      setCheckedHydroxychloroquine(true);
    }
  }
  function handleToggleBloodTypeA(props){
    logger.warn('CovidQueryPage.handleToggleBloodTypeA()');

    if(checkedBloodTypeA){
      setCheckedBloodTypeA(false);
    } else {
      setCheckedBloodTypeA(true);
    }
  }
  function handleToggleSmoker(props){
    logger.warn('CovidQueryPage.handleToggleSmoker()');

    if(checkedSmoker){
      setCheckedSmoker(false);
    } else {
      setCheckedSmoker(true);
    }
  }
  function handleToggleHypertension(props){
    logger.warn('CovidQueryPage.handleToggleHypertension()');

    if(checkedHypertension){
      setCheckedHypertension(false);
    } else {
      setCheckedHypertension(true);
    }
  }
  function handleToggleTamiflu(props){
    logger.warn('CovidQueryPage.handleToggleTamiflu()');

    if(checkedTamiflu){
      setCheckedTamiflu(false);
    } else {
      setCheckedTamiflu(true);
    }
  }
  function handleToggleSerumAntibodies(props){
    logger.warn('CovidQueryPage.handleToggleSerumAntibodies()');

    if(checkedSerumAntibodies){
      setCheckedSerumAntibodies(false);
    } else {
      setCheckedSerumAntibodies(true);
    }
  }
  function handleToggleVaccinated(props){
    logger.warn('CovidQueryPage.handleToggleVaccinated()');

    if(checkedVaccinated){
      setCheckedVaccinated(false);
    } else {
      setCheckedVaccinated(true);
    }
  }

  

  
  

  //-------------------------------------------------------------------
  // Button Methods



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
  function handleFetchDevices(props){
    logger.warn('CovidQueryPage.handleFetchDevices()');

    fetchDeviceData(props, function(){
      fetchPatientsFromFhirArray(props, Devices.find().fetch());
    });
  }

  


  function handleGeocodeAddresses(props){
    logger.warn('CovidQueryPage.handleGeocodeAddresses()');
    logger.debug('CovidQueryPage.handleGeocodeAddresses().patients?', patients);

    patients.forEach(function(patient){
      Meteor.call('geocodePatientAddress', patient, function(error, result){
        if(error){
          console.log('geocodeAddress.error', error)
        }
        if(result){
          console.log('geocodeAddress.result', result)
 
          if(get(result, 'resourceType') === "Location"){
            Locations.insert(result, {filter: false, validate: false});
          }
        }
      })
    });
  }

  function clearProcedures(){
    logger.warn('CovidQueryPage.clearProcedures()');
    Procedures.remove({});
  }
  function clearEncounters(){
    logger.warn('CovidQueryPage.clearEncounters()');
    Encounters.remove({});
  }
  function clearConditions(){
    logger.warn('CovidQueryPage.clearConditions()');
    Conditions.remove({});
  }
  function clearPatients(){
    logger.warn('CovidQueryPage.clearPatients()');
    Patients.remove({});
  }
  function clearLocations(){
    logger.warn('CovidQueryPage.clearLocations()');
    Locations.remove({});
  }
  function clearGeoJson(){
    logger.warn('CovidQueryPage.clearGeoJson()');
    Session.set('geoJsonLayer', "")
  }

  function generateGeoJson(){
    logger.warn('CovidQueryPage.generateGeoJson()');

    let newGeoJson = {
      "type": "FeatureCollection",
      "features": []
    }

    let proximityCount = Locations.find({_location: {$near: {
      $geometry: {
        type: 'Point',
        coordinates: [-88.0020589, 42.01136169999999]
      },
      // Convert [mi] to [km] to [m]
      $maxDistance: 50 * 1.60934 * 1000
    }}}).count();

    console.log('Found ' + proximityCount + ' locations within 50 miles of the search origin.')

    let count = 0;
    Locations.find({_location: {$near: {
      $geometry: {
        type: 'Point',
        coordinates: [-88.0020589, 42.01136169999999]
      },
      // Convert [mi] to [km] to [m]
      $maxDistance: 50 * 1.60934 * 1000
    }}}).forEach(function(location){
      count++;

      if(get(location, 'position.longitude') && get(location, 'position.latitude')){
        let newFeature = { 
          "type": "Feature", 
          "properties": { 
            "id": (count).toString(),                 
            "primary_type": "POSITIVE",                           
            "location_zip": get(location, 'address.postalCode'),      
            "location_address": get(location, 'address.line[0]'),    
            "location_city": get(location, 'address.city'),                    
            "location_state": get(location, 'address.state'),
            "longitude": (get(location, 'position.longitude')).toFixed(9).toString(),
            "latitude": (get(location, 'position.latitude')).toFixed(9).toString()        
          }, 
          "geometry": { 
            "type": "Point", 
            "coordinates": [ Number((get(location, 'position.longitude')).toFixed(9)), Number((get(location, 'position.latitude')).toFixed(9)) ] 
          }
        }
  
        newGeoJson.features.push(newFeature);
      }      
    })

    console.log('newGeoJson', newGeoJson)
    Session.set('geoJsonLayer', newGeoJson)
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
        logger.debug('Bundle linkUrl was: ' + get(searchResponse, "link[0].url"));
        Session.set('encounterUrl', get(searchResponse, "link[0].url"));

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
      searchParams: {} 
    };

    let conditionsToSearchFor = [];
    let conditionsToSearchForString = "";
    
    // these are our toggles
    // http://www.snomed.org/news-and-events/articles/jan-2020-sct-intl-edition-release
    if(checkedFever){
      conditionsToSearchFor.push("386661006")
    }
    if(checkedCough){
      conditionsToSearchFor.push("49727002")
    }
    if(checkedDyspnea){
      conditionsToSearchFor.push("267036007")
    }
    if(checkedCovid19){
      conditionsToSearchFor.push("840539006")
      conditionsToSearchFor.push("840533007")
    }
    if(checkedSuspectedCovid19){
      conditionsToSearchFor.push("840544004")
      conditionsToSearchFor.push("840546002")

    }
    if(checkedSerumAntibodies){
      conditionsToSearchFor.push("840536004")
    }

    // we're being a bit sloppy with this algorithm because it needs to get out the door
    conditionsToSearchFor.forEach(function(snomedCode){
      // adding a comma after each snomed code
      conditionsToSearchForString = conditionsToSearchForString + snomedCode + ",";
    })
    if(conditionsToSearchFor.length > 0){
      // and then dropping the last comma;
      // blah, but it works
      searchOptions.searchParams.code = conditionsToSearchForString.substring(0, conditionsToSearchForString.length - 1);
    }


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
        logger.debug('Bundle linkUrl was: ' + get(searchResponse, "link[0].url"));
        Session.set('conditionUrl', get(searchResponse, "link[0].url"));

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



  async function fetchDeviceData(props, callback){
    logger.debug('Fetch device data from the following endpoint: ' + fhirServerEndpoint);


    let devicesArray = [];
    let searchOptions = { 
      resourceType: 'Device', 
      searchParams: { 
        type: ""
      }
    };

    let proceduresToSearchFor = [];
    let proceduresToSearchForString = "";
    
    // these are our toggles
    // http://www.snomed.org/news-and-events/articles/jan-2020-sct-intl-edition-release
    if(checkedVentilator){
      proceduresToSearchFor.push("706172005")
    }
    // if(checkedOxygenAdministration){
    //   proceduresToSearchFor.push("371908008")
    // }

    // we're being a bit sloppy with this algorithm because it needs to get out the door
    proceduresToSearchFor.forEach(function(snomedCode){
      // adding a comma after each snomed code
      proceduresToSearchForString = proceduresToSearchForString + snomedCode + ",";
    })
    if(proceduresToSearchFor.length > 0){
      // and then dropping the last comma;
      // blah, but it works
      searchOptions.searchParams.type = proceduresToSearchForString.substring(0, proceduresToSearchForString.length - 1);
    }


    logger.trace('searchOptions', searchOptions)

    await fhirClient.search(searchOptions)
    .then((searchResponse) => {
      logger.debug('fetchDeviceData.searchResponse', searchResponse);
      let devicesArray = [];

      if(get(searchResponse, 'resourceType') === "Bundle"){
        logger.debug('Parsing a Bundle.')
        logger.debug('Bundle linkUrl was: ' + get(searchResponse, "link[0].url"));
        Session.set('deviceUrl', get(searchResponse, "link[0].url"));

        let entries = get(searchResponse, 'entry', []);
        
        entries.forEach(function(entry){
          if(get(entry, 'resource.resourceType') === "Device"){

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
  
              devicesArray.push(get(entry, 'resource'))
            }     
          }
        })        
      }

      devicesArray = recursiveProcedureQuery(fhirClient, searchResponse, devicesArray, function(error, result){
        logger.info("We just finished the recursive query and received the following result: " + result)
      });

      return devicesArray;
    })
    .then((devicesArray) => {
      // console.log('devicesArray', devicesArray);
      setProcedures(devicesArray);
      if(typeof callback === "function"){
        callback();
      }
      return devicesArray;
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


    let proceduresToSearchFor = [];
    let proceduresToSearchForString = "";
    
    // these are our toggles
    // http://www.snomed.org/news-and-events/articles/jan-2020-sct-intl-edition-release
    if(checkedVaccinated){
      proceduresToSearchFor.push("840534001")
    }
    if(checkedVentilator){
      proceduresToSearchFor.push("371908008")
    }
    if(checkedOxygenAdministration){
      proceduresToSearchFor.push("371908008")
    }


    // we're being a bit sloppy with this algorithm because it needs to get out the door
    proceduresToSearchFor.forEach(function(snomedCode){
      // adding a comma after each snomed code
      proceduresToSearchForString = proceduresToSearchForString + snomedCode + ",";
    })
    if(proceduresToSearchFor.length > 0){
      // and then dropping the last comma;
      // blah, but it works
      searchOptions.searchParams.code = proceduresToSearchForString.substring(0, proceduresToSearchForString.length - 1);
    }


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
        logger.debug('Bundle linkUrl was: ' + get(searchResponse, "link[0].url"));
        Session.set('procedureUrl', get(searchResponse, "link[0].url"));

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
    Session.set('fhirKitClientStartDate', moment(newDate).format("YYYY-MM-DD"));
    Session.set('lastUpdated', new Date())
  }

  function handleEndDateChange(event, newDate){
    Session.set('fhirKitClientEndDate', moment(newDate).format("YYYY-MM-DD"))
    Session.set('lastUpdated', new Date())
  }

  function handleFetchCapabilityStatement(){
    logger.trace('Fetching Capablity Statement: ' + fhirServerEndpoint + "/metadata")


    HTTP.get(fhirServerEndpoint + "/metadata", function(error, conformanceStatement){
      let parsedCapabilityStatement = JSON5.parse(get(conformanceStatement, "content"))
      console.log('Capability Statement', parsedCapabilityStatement);
      Session.set('mainAppDialogJson', parsedCapabilityStatement);
      Session.set('mainAppDialogTitle', "Capability Statement");
      Session.set('mainAppDialogComponent', "CapabilityStatementCheck");
      Session.set('lastUpdated', new Date())
      Session.set('mainAppDialogOpen', true);
    })

    fhirClient.smartAuthMetadata().then((smartFhirUrls) => {
      console.log('smartAuthMetadata', smartFhirUrls);
    });

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
  let locationsTitle = 'Locations';
  let deviceTitle = 'Devices';

  


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
  if(typeof Locations === "object"){
    locationsTitle = locationCount + ' Locations';
  }
  if(typeof Devices === "object"){
    deviceTitle = deviceCount + ' Devices';
  }

  
  selectedStartDate = moment(selectedStartDate).format("YYYY-MM-DD");
  selectedEndDate = moment(selectedEndDate).format("YYYY-MM-DD");
  


  let encountersCard;
  if(encounterCount > 0){
    encountersCard = <StyledCard id="fetchedEncountersCard" style={{minHeight: '200px', marginBottom: '40px'}}>
      <CardHeader 
        id="encountersCardCount"
        title={encountersTitle} 
        subheader={encounterUrl}
        style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
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
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearEncountersBtn" color="primary" className={classes.button} onClick={clearEncounters.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard>
  }   

  let conditionsCard;
  if(conditionCount > 0){
    conditionsCard= <StyledCard id="fetchedConditionssCard" style={{minHeight: '200px', marginBottom: '40px'}}>
      <CardHeader 
        id="conditionsCardCount"
        title={conditionsTitle} 
        subheader={conditionUrl}
        style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
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
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearConditionsBtn" color="primary" className={classes.button} onClick={clearConditions.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard>
  } 


  let proceduresCard;
  if(procedureCount > 0){
    proceduresCard = <StyledCard id="fetchedProceduresCard" style={{minHeight: '200px', marginBottom: '40px'}}>
      <CardHeader 
        id="proceduresCardCount"
        title={proceduresTitle} 
        subheader={procedureUrl}
        style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <ProceduresTable
          id="fetchedProceduresTable"                  
          procedures={procedures}
          rowsPerPage={10}
          count={procedureCount}
          hideActionIcons
          hideCategory
          hideCheckboxes
          hideIdentifier
          hideSubject
          hideBodySite
          hidePerformer
          hidePerformedDateEnd
          hideBarcode
          hideNotes
          hideActionButton
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearProceduresBtn" color="primary" className={classes.button} onClick={clearProcedures.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard>
  } 
  
  
  let devicesCard;
  if(deviceCount > 0){
    devicesCard = <StyledCard id="devicesCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="devicesCardCount"
        title={deviceTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <DevicesTable />
      </CardContent>
    </StyledCard> 
  } 

  let noDataCard;
  if(!encountersCard && !conditionsCard && !proceduresCard && !devicesCard){
    noDataCard = <StyledCard style={{minHeight: '200px', marginBottom: '40px'}} disabled>
      <CardContent style={{fontSize: '100%', paddingBottom: '28px', paddingTop: '50px', textAlign: 'center'}}>
        <CardHeader 
          title="No Data"       
          subheader="Please query the FHIR server for data."
          style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
            
      </CardContent>
    </StyledCard>
  }

  let patientsCard;
  if(patientCount > 0){
    patientsCard = <StyledCard id="fetchedPatientsCard" style={{minHeight: '240px'}}>
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
          paginationCount={patientCount}
          hideActionIcons
          hideLanguage
          hideCountry
          showCounts={false}
          hideActive
      />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="geocodePatientAddresses" color="primary" variant="contained" className={classes.button} onClick={handleGeocodeAddresses.bind(this)} >Geocode Addresses</Button> 
        <Button id="clearPatientsBtn" color="primary" className={classes.button} onClick={clearPatients.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard>
  } else {
    patientsCard = noDataCard;
  }
  
  return (
    <PageCanvas id='fetchDataFromHospitalPage' headerHeight={158} >
      <MuiPickersUtilsProvider utils={MomentUtils} libInstance={moment} local="en">
        <Grid container spacing={3} >
          <Grid item xs={4}>
              <CardHeader 
                title="Step 1 - Fetch Data From Servers" 
                style={{fontSize: '100%'}} />            
            <StyledCard style={{minHeight: '380px'}}>
              <CardHeader 
                title="FHIR Server Query" 
                subheader="Fetching data related to COVID19 coronavirus symptoms."
                style={{fontSize: '100%'}} />
              <Button 
                id="fetchCapabilityStatement" 
                color="primary" 
                variant="contained" 
                className={classes.button} onClick={handleFetchCapabilityStatement.bind(this)} 
                style={{float: 'right', right: '0px', marginTop: '-70px'}}
              >Capability Statement</Button> 
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
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
                      disabled
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
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
                  <Grid item xs={4}>
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
              <DynamicSpacer />
              <CardContent>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography >
                          Symptoms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox checked={checkedFever} onChange={handleToggleFever.bind(this)} name="checkedFever" />}
                          label="Fever"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={checkedCough} onChange={handleToggleCough.bind(this)} name="checkedCough" />}
                          label="Cough"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={checkedDyspnea} onChange={handleToggleDyspnea.bind(this)} name="checkedDyspnea" />}
                          label="Dyspnea (Shortness of Breath)"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography >
                          Risk Factors
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox checked={checkedSmoker} onChange={handleToggleSmoker.bind(this)} name="checkedSmoker" />}
                          label="Smoker"
                        />
                        <FormControlLabel                
                          control={<Checkbox checked={checkedHypertension} onChange={handleToggleHypertension.bind(this)} name="checkedHypertension" />}
                          label="Hypertension"
                        />
                        <FormControlLabel                
                          control={<Checkbox checked={checkedBloodTypeA} onChange={handleToggleBloodTypeA.bind(this)} name="checkedBloodTypeA" />}
                          label="Blood Type A"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography >
                        Medications
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox checked={checkedVaccinated} onChange={handleToggleVaccinated.bind(this)} name="checkedVacinated" />}
                          label="Vaccinated"
                        />
                        <FormControlLabel                
                          control={<Checkbox checked={checkedTamiflu} onChange={handleToggleTamiflu.bind(this)} name="checkedTamiflu" />}
                          label="Tamiflu"
                        />
                        <FormControlLabel                
                          control={<Checkbox checked={checkedHydroxychloroquine} onChange={setCheckedHydroxychloroquine.bind(this)} name="checkedHydroxychloroquine" />}
                          label="Hydroxychloroquine"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography >
                          Procedures
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox checked={checkedVentilator} onChange={handleToggleVentilator.bind(this)} name="checkedVentilator" />}
                          label="Ventilators"
                        />
                        <FormControlLabel                
                          control={<Checkbox checked={checkedOxygenAdministration} onChange={handleToggleOxygenAdministration.bind(this)} name="checkedOxygenAdministration" />}
                          label="Oxygen Administration"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={checkedTested} onChange={handleToggleTested.bind(this)} name="checkedTested" />}
                          label="Testing Encounter"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography >
                        Conditions
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={<Checkbox checked={checkedSuspectedCovid19} onChange={handleToggleSuspectedCovid19.bind(this)} name="checkedSuspectedCovid19" />}
                          label="Suspected Covid19"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={checkedCovid19} onChange={handleToggleCovid19.bind(this)} name="checkedCovid19" />}
                          label="Covid19"
                        />
                        <FormControlLabel                
                          control={<Checkbox checked={checkedSerumAntibodies} onChange={handleToggleSerumAntibodies.bind(this)} name="checkedSerumAntibodies" />}
                          label="Serum Antibodies"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <DynamicSpacer />
              <CardActions style={{display: 'inline-flex', width: '100%'}} >
                <Button id="fetchEncountersButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchEncounters.bind(this)} >Fetch Encounters</Button> 
                <Button id="fetchConditionsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchConditions.bind(this)} >Fetch Conditions</Button> 
                <Button id="fetchProceduresButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchProcedures.bind(this)} >Fetch Procedures</Button> 
                <Button id="fetchDevicesButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchDevices.bind(this)} >Fetch Devices</Button> 
              </CardActions>              
            </StyledCard>          
          </Grid>
          <Grid item xs={4}>
            <CardHeader title="Step 2 - Received Data" style={{fontSize: '100%'}} />  
            { encountersCard }
            { conditionsCard }
            { proceduresCard }
            { devicesCard }   
            { noDataCard }
          </Grid>
          
          <Grid item xs={4}>
            <CardHeader 
                title="Step 3 - Patient Demographic Lookup" 
                style={{fontSize: '100%'}} />  
            { patientsCard }

            {/* <StyledCard id="optionsCard" style={{minHeight: '280px'}}>
              <CardHeader                 
                title="Map Options" 
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px'}} >
                <Grid container style={{paddingBottom: '20px'}}>
                  <Grid item xs={6} style={{paddingRight: '10px'}}>
                    <TextField 
                      id="mapCenterAddress" 
                      label="Map Centrer" 
                      helperText="This should be an address.  We will geocode it." 
                      defaultValue="Chicago, IL"
                      disabled
                      fullWidth />
                  </Grid>
                  <Grid item xs={6} style={{paddingLeft: '10px'}}>
                    <TextField 
                      id="searchProximity" 
                      label="Search Proximity" 
                      helperText="This should be a number (in miles)." 
                      defaultValue={50}
                      disabled
                      fullWidth />
                  </Grid>
                </Grid>

                <Typography gutterBottom>
                  Opacity
                </Typography>
                <Slider
                  defaultValue={50}
                  //getAriaValueText={valuetext}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  step={10}
                  marks
                  min={0}
                  max={100}
                />

                <Typography gutterBottom>
                  Radius
                </Typography>
                <Slider
                  defaultValue={10}
                  //getAriaValueText={valuetext}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  step={10}
                  marks
                  min={0}
                  max={100}
                />

              </CardContent>
                <CardActions style={{display: 'inline-flex', width: '100%'}} >
                  <Button id="geocodeCentroidButton" color="primary" className={classes.button} onClick={geocodeCentroid.bind(this)} >Geocode</Button> 
                </CardActions> 
            </StyledCard> */}
          </Grid>
        </Grid>        
        <Grid container spacing={3} style={{paddingBottom: '80px'}}>          
          {/* <Grid item xs={4}>
            <StyledCard id="geocodedLocationsCard" style={{minHeight: '240px' }}>
              <CardHeader 
                id="geocodedLocationsCount"
                title={locationsTitle}  
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
                <LocationsTable
                  id="geocodedLocationsTable"
                  locations={locations}
                  rowsPerPage={10}
                  count={locationCount}
              />
              </CardContent>
              <CardActions style={{display: 'inline-flex', width: '100%'}} >
                <Button id="clearLocationsBtn" color="primary" className={classes.button} onClick={clearLocations.bind(this)} >Clear</Button> 
                <Button id="generateGeoJsonBtn" color="primary" variant="contained" className={classes.button} onClick={generateGeoJson.bind(this)} >Generate GeoJson</Button> 
              </CardActions> 
            </StyledCard>
          </Grid> */}
          {/* <Grid item xs={4}>
            <StyledCard id="geocodedLocationsCard" style={{minHeight: '240px',  maxHeight: '660px'}}>
              <CardHeader 
                id="geoJsonPreview"
                title="GeoJson"
                subheader={geoJsonLayerFeaturesCount ? geoJsonLayerFeaturesCount + ' Features' : ''}
                style={{fontSize: '100%'}} />
              <CardContent style={{fontSize: '100%', paddingBottom: '28px', overflowY: 'scroll', maxHeight: '500px'}}>
                
                <div style={{position: 'absolute', overflowY: 'scroll', maxHeight: '630px', width: '100%'}}>
                  <pre style={{overflow: 'scroll', maxHeight: '450px', width: '100%'}}>
                    { JSON.stringify(geoJsonLayer, null, 2) }
                  </pre>
                </div>
              </CardContent>
              <CardActions style={{display: 'inline-flex', width: '100%'}} >
                <Button id="clearGeoJson" color="primary" className={classes.button} onClick={clearGeoJson.bind(this)} >Clear</Button> 
              </CardActions> 
            </StyledCard>
          </Grid> */}
        </Grid>   
      </MuiPickersUtilsProvider>            
    </PageCanvas>
  );
}

export default CovidQueryPage;