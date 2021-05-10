import React, { Component, useState, useEffect } from 'react';
import { useLocation, useParams, useHistory } from "react-router-dom";

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

import {  
  FormControl,
  InputLabel,
  Input
} from '@material-ui/core';

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


import { 
  Conditions,
  Devices,
  Encounters, 
  Locations,
  Immunizations,
  Medications,
  MedicationOrders,
  MedicationRequests,
  MedicationStatements, 
  Observations,
  Procedures,

  ConditionsTable,
  DevicesTable,
  EncountersTable,
  LocationsTable,
  ImmunizationsTable,
  MedicationsTable,
  MedicationOrdersTable,
  MedicationRequestsTable,
  MedicationStatementsTable, 
  ObservationsTable,
  ProceduresTable
} from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { PageCanvas, StyledCard, PatientTable } from 'material-fhir-ui';
import { ReactMeteorData, useTracker } from 'meteor/react-meteor-data';

import FhirUtilities from '../lib/FhirUtilities';

import FHIR from 'fhirclient';
const smart = FHIR.oauth2;

import Client from 'fhir-kit-client';
import simpleOauthModule from 'simple-oauth2';

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

// Bulk Data Transfer happens in a different location than from the Patient Charting servers.
// So, we've decided to use an interface default channel endpoint, rather than the SMART on FHIR fhirServiceUrl
let fhirClient = new Client({
  baseUrl: get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseR4')
  // baseUrl: get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', 'http://localhost:3100/baseR4')
});
if(!fhirClient){
  console.error('=======================================================================================');
  console.error('ERROR!!!  Bulk data channel endpoint not configured.   Unable to initialize FhirClient.');
  console.error('Please set a value for Meter.settings.public.interfaces.default.channel.endpoint');
}
console.log('Intitializing fhir-kit-client for ' + get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseR4'))
// console.log('Intitializing fhir-kit-client for ' + get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', 'http://localhost:3100/baseR4'))

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
Session.setDefault('observationUrl', "https://");
Session.setDefault('immunizationUrl', "https://");
Session.setDefault('medicationUrl', "https://");
Session.setDefault('medicationOrderUrl', "https://");
Session.setDefault('medicationRequestUrl', "https://");
Session.setDefault('medicationStatementUrl', "https://");

Session.setDefault('geoJsonLayer', "");
Session.setDefault('viewPreference_rowsPerPage', 5)

function CovidQueryPage(props){
  let selectedStartDate = Session.get("fhirKitClientStartDate");
  let selectedEndDate = Session.get("fhirKitClientEndDate");

  let totalEncountersDuringDateRange = 0;

  const classes = useStyles();
  let history = useHistory();

  let query = new URLSearchParams(useLocation().search);
  // if(query){
  //   console.log("WE HAVE QUERY STATE", query.state)
  //   console.log("WE HAVE QUERY PARAMS", query)
  // }

  const rowsPerPage = get(Meteor, 'settings.public.defaults.rowsPerPage', 25);

  let [conditions, setConditions] = useState([]);
  let [encounters, setEncounters] = useState([]);
  let [immunizations, setImmunizations] = useState([]);
  let [medications, setMedications] = useState([]);
  let [medicationOrders, setMedicationOrders] = useState([]);
  let [medicationRequests, setMedicationRequests] = useState([]);
  let [medicationStatements, setMedicationStatements] = useState([]);
  let [patients,   setPatients]   = useState([]);
  let [procedures, setProcedures] = useState([]);
  let [observations, setObservations] = useState([]);

  let [checkedDateRangeEnabled, setCheckedDateRangeEnabled] = useState(get(Meteor, 'settings.public.defaults.useDateRangeInQueries', false));

  let [checkedTested,  setCheckedTested]  = useState(false);
  let [checkedFever,  setCheckedFever]  = useState(true);
  let [checkedCough,  setCheckedCough]  = useState(false);
  let [checkedDyspnea,  setCheckedDyspnea]  = useState(false);
  let [checkedVentilator,  setCheckedVentilator]  = useState(true);
  let [checkedOxygenAdministration,  setCheckedOxygenAdministration]  = useState(true);
  let [checkedIntubated,  setCheckedIntubated]  = useState(true);
  let [checkedPronated,  setCheckedPronated]  = useState(true);
  let [checkedCovid19,  setCheckedCovid19]  = useState(true);
  let [checkedSuspectedCovid19,  setCheckedSuspectedCovid19]  = useState(true);
  let [checkedHydroxychloroquine,  setCheckedHydroxychloroquine]  = useState(false);
  let [checkedBloodTypeA,  setCheckedBloodTypeA]  = useState(false);
  let [checkedSmoker,  setCheckedSmoker]  = useState(false);
  let [checkedHypertension,  setCheckedHypertension]  = useState(false);
  let [checkedTamiflu,  setCheckedTamiflu]  = useState(false);
  let [checkedSerumAntibodies,  setCheckedSerumAntibodies]  = useState(false);
  let [checkedVaccinated,  setCheckedVaccinated]  = useState(false);
  let [checkedPlasmaTransfer,  setCheckedPlasmaTransfer]  = useState(false);

  let [checkedVitalSigns, setCheckedVitalSigns] = useState(false);
  let [checkedLabResults, setCheckedLabResults] = useState(false);
  
  let [fhirServerEndpoint, setFhirServerEndpoint] = useState(get(Meteor, 'settings.public.interfaces.default.channel.endpoint', 'http://localhost:3100/baseR4'));
  // let [fhirServerEndpoint, setFhirServerEndpoint] = useState(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', 'http://localhost:3100/baseR4'));

  
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");


  //-------------------------------------------------------------------
  // Tracking - Session Variables

  selectedStartDate = useTracker(function(){
    return Session.get("fhirKitClientStartDate");
  }, [props.lastUpdated]);

  if(!selectedStartDate){
    selectedStartDate = Session.get("fhirKitClientStartDate");
  }

  selectedEndDate = useTracker(function(){
    return Session.get("fhirKitClientEndDate");
  }, [props.lastUpdated]);

  if(!selectedEndDate){
    selectedEndDate = Session.get("fhirKitClientEndDate");
  }

  totalEncountersDuringDateRange = useTracker(function(){
    return Session.get("totalEncountersDuringDateRange");
  }, [props.lastUpdated]);


  //-------------------------------------------------------------------
  // Tracking - Cursors

  let encounterCursor;
  encounterCursor = useTracker(function(){ return Encounters.find(); }, [props.lastUpdated]);  
  if(encounterCursor){
    encounters = encounterCursor.fetch();
  }

  let conditionsCursor;
  conditionsCursor = useTracker(function(){ return Conditions.find(); }, [props.lastUpdated]); 
  if(conditionsCursor){
    conditions = conditionsCursor.fetch();
  }

  let devicesCursor;
  devicesCursor = useTracker(function(){ return Devices.find(); }, [props.lastUpdated]); 
  if(devicesCursor){
    devices = devicesCursor.fetch();
  }

  let immunizationsCursor;
  immunizationsCursor = useTracker(function(){ return Immunizations.find(); }, [props.lastUpdated]); 
  if(immunizationsCursor){
    immunizations = immunizationsCursor.fetch();
  }

  let locationsCursor;
  locationsCursor = useTracker(function(){ return Locations.find(); }, [props.lastUpdated]); 
  if(locationsCursor){
    locations = locationsCursor.fetch();
  }

  let medicationsCursor;
  medicationsCursor = useTracker(function(){ return Medications.find(); }, [props.lastUpdated]); 
  if(medicationsCursor){
    medications = medicationsCursor.fetch();
  }

  let medicationOrdersCursor;
  medicationOrdersCursor = useTracker(function(){ return MedicationOrders.find(); }, [props.lastUpdated]); 
  if(medicationOrdersCursor){
    medicationOrders = medicationOrdersCursor.fetch();
  }

  let medicationRequestsCursor;
  medicationRequestsCursor = useTracker(function(){ return MedicationRequests.find(); }, [props.lastUpdated]); 
  if(medicationRequestsCursor){
    medicationRequests = medicationRequestsCursor.fetch();
  }

  let medicationStatementsCursor;
  medicationStatementsCursor = useTracker(function(){ return MedicationStatements.find(); }, [props.lastUpdated]); 
  if(medicationStatementsCursor){
    medicationStatements = medicationStatementsCursor.fetch();
  }

  let observationsCursor;
  observationsCursor = useTracker(function(){ return Observations.find(); }, [props.lastUpdated]);  
  if(observationsCursor){
    observations = observationsCursor.fetch();
  }

  let patientsCursor;
  patientsCursor = useTracker(function(){ return Patients.find(); }, [props.lastUpdated]);  
  if(patientsCursor){
    patients = patientsCursor.fetch();
  }

  let proceduresCursor;
  proceduresCursor = useTracker(function(){ return Procedures.find(); }, [props.lastUpdated]); 
  if(proceduresCursor){
    procedures = proceduresCursor.fetch();
  }



  //-------------------------------------------------------------------
  // Tracking - Counters
  
  let deviceCount = 0;
  let conditionCount = 0;
  let encounterCount = 0;
  let locationCount = 0;
  let immunizationCount = 0;
  let medicationCount = 0;
  let medicationOrderCount = 0;
  let medicationRequestCount = 0;
  let medicationStatementCount = 0;
  let observationCount = 0;
  let patientCount = 0;
  let procedureCount = 0;

  conditionCount = useTracker(function(){ return Conditions.find().count() }, []);  
  deviceCount = useTracker(function(){ return Devices.find().count() }, []);  
  encounterCount = useTracker(function(){ return Encounters.find().count() }, []);  
  locationCount = useTracker(function(){ return Locations.find().count() }, []);  
  immunizationCount = useTracker(function(){ return Immunizations.find().count() }, []);  
  medicationCount = useTracker(function(){ return Medications.find().count() }, []);  
  medicationOrderCount = useTracker(function(){ return MedicationOrders.find().count() }, []);  
  medicationRequestCount = useTracker(function(){ return MedicationRequests.find().count() }, []);  
  medicationStatementCount = useTracker(function(){ return MedicationStatements.find().count() }, []);  
  observationCount = useTracker(function(){ return Observations.find().count() }, []);  
  patientCount = useTracker(function(){ return Patients.find().count() }, []);  
  procedureCount = useTracker(function(){ return Procedures.find().count() }, []);  



  //-------------------------------------------------------------------
  // Tracking - Urls

  let conditionUrl = "";
  let deviceUrl = "";
  let encounterUrl = "";
  let locationUrl = "";
  let immunizationUrl = "";
  let medicationUrl = "";
  let medicationOrderUrl = "";
  let medicationRequestUrl = "";
  let medicationStatementUrl = "";
  let observationUrl = "";
  let procedureUrl = "";
  let patientUrl = "";

  conditionUrl = useTracker(function(){ return Session.get('conditionUrl') }, [props.lastUpdated]);  
  encounterUrl = useTracker(function(){ return Session.get('encounterUrl') }, [props.lastUpdated]);  
  deviceUrl = useTracker(function(){ return Session.get('deviceUrl')}, [props.lastUpdated]);  
  locationUrl = useTracker(function(){ return Session.get('locationUrl')}, [props.lastUpdated]);  
  immunizationUrl = useTracker(function(){ return Session.get('immunizationUrl')}, [props.lastUpdated]);  
  medicationUrl = useTracker(function(){ return Session.get('medicationUrl')}, [props.lastUpdated]);  
  medicationOrderUrl = useTracker(function(){ return Session.get('medicationOrderUrl')}, [props.lastUpdated]);  
  medicationRequestUrl = useTracker(function(){ return Session.get('medicationRequestUrl')}, [props.lastUpdated]);  
  medicationStatementUrl = useTracker(function(){ return Session.get('medicationStatementUrl')}, [props.lastUpdated]);  
  observationUrl = useTracker(function(){ return Session.get('observationUrl')}, [props.lastUpdated]);  
  procedureUrl = useTracker(function(){ return Session.get('procedureUrl') }, [props.lastUpdated]);  
  patientUrl = useTracker(function(){ return Session.get('patientUrl') }, [props.lastUpdated]);  


  //-------------------------------------------------------------------
  // Tracking - Preferences 
  let viewPreference_rowsPerPage = 5;
  viewPreference_rowsPerPage = useTracker(function(){ return Session.get('viewPreference_rowsPerPage') }, [props.lastUpdated]);  


  //-------------------------------------------------------------------
  // Toggle Methods

  function handleToggleDateRange(props){
    logger.warn('CovidQueryPage.handleToggleDateRange()');

    if(checkedDateRangeEnabled){
      setCheckedDateRangeEnabled(false);
      Session.set('useDateRangeInQueries', false)
    } else {
      setCheckedDateRangeEnabled(true);
      Session.set('useDateRangeInQueries', true)
    }
  }

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
  function handleToggleIntubated(props){
    logger.warn('CovidQueryPage.handleToggleIntubated()');

    if(checkedIntubated){
      setCheckedIntubated(false);
    } else {
      setCheckedIntubated(true);
    }
  }
  function handleTogglePronated(props){
    logger.warn('CovidQueryPage.handleTogglePronated()');

    if(checkedPronated){
      setCheckedPronated(false);
    } else {
      setCheckedPronated(true);
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

  function handleToggleVitalSigns(props){
    logger.warn('CovidQueryPage.handleToggleVitalSigns()');

    if(checkedVitalSigns){
      setCheckedVitalSigns(false);
    } else {
      setCheckedVitalSigns(true);
    }
  }
  function handleToggleLabResults(props){
    logger.warn('CovidQueryPage.handleToggleLabResults()');

    if(checkedLabResults){
      setCheckedLabResults(false);
    } else {
      setCheckedLabResults(true);
    }
  }
  function handleTogglePlasmaTransfer(props){
    logger.warn('CovidQueryPage.handleTogglePlasmaTransfer()');

    if(checkedPlasmaTransfer){
      setCheckedPlasmaTransfer(false);
    } else {
      setCheckedPlasmaTransfer(true);
    }
  }

  
  //-------------------------------------------------------------------
  // Button Methods

  function handleFetchConditions(props){
    logger.warn('CovidQueryPage.handleFetchConditions()');

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

    fetchResourceData(props, searchOptions, Conditions, function(){
      fetchPatientsFromFhirArray(props, Conditions.find().fetch());
    });
  }
  function handleFetchEncounters(props){
    logger.warn('CovidQueryPage.handleFetchEncounters()');

    let searchOptions = { 
      resourceType: 'Encounter', 
      searchParams: { 
        date: []
      }
    };

    searchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    searchOptions.searchParams.date[1] = "le" +  selectedEndDate;

    fetchResourceData(props, searchOptions, Encounters, function(){
      fetchPatientsFromFhirArray(props, Encounters.find().fetch());
    }, function(total){
      Session.set('totalEncountersDuringDateRange', total);
    });
  }
  function handleFetchDevices(props){
    logger.warn('CovidQueryPage.handleFetchDevices()');

    let devicesArray = [];
    let searchOptions = { 
      resourceType: 'Device', 
      searchParams: { 
        type: ""
      }
    };

    let devicesToSearchFor = [];
    let devicesToSearchForString = "";
    
    // these are our toggles
    // http://www.snomed.org/news-and-events/articles/jan-2020-sct-intl-edition-release
    if(checkedVentilator){
      devicesToSearchFor.push("706172005")
    }
    // if(checkedOxygenAdministration){
    //   devicesToSearchFor.push("371908008")
    // }

    // we're being a bit sloppy with this algorithm because it needs to get out the door
    devicesToSearchFor.forEach(function(snomedCode){
      // adding a comma after each snomed code
      devicesToSearchForString = devicesToSearchForString + snomedCode + ",";
    })
    if(devicesToSearchFor.length > 0){
      // and then dropping the last comma;
      // blah, but it works
      searchOptions.searchParams.type = devicesToSearchForString.substring(0, devicesToSearchForString.length - 1);
    }


    logger.trace('searchOptions', searchOptions)

    fetchResourceData(props, searchOptions, Devices, function(){
      fetchPatientsFromFhirArray(props, Devices.find().fetch());
    });
  }
  function handleFetchImmunizations(props){
    logger.warn('CovidQueryPage.handleFetchImmunizations()');

    let searchOptions = { 
      resourceType: 'Immunization', 
      searchParams: {
        date: []
      }
    };

    searchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    searchOptions.searchParams.date[1] = "le" +  selectedEndDate;

    fetchResourceData(props, searchOptions, Immunizations, function(){
      fetchPatientsFromFhirArray(props, Immunizations.find().fetch());
    }, function(total){
      console.log('Apparently there are ' + total + ' immunizations.')
    });
  }
  function handleFetchMedications(props){
    logger.warn('CovidQueryPage.handleFetchMedications()');

    let medicationOrderSearchOptions = { 
      resourceType: 'MedicationOrder', 
      searchParams: { 
        date: []
      }
    };
    medicationOrderSearchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    medicationOrderSearchOptions.searchParams.date[1] = "le" +  selectedEndDate;

    fetchResourceData(props, medicationOrderSearchOptions, MedicationOrders, function(){
      fetchPatientsFromFhirArray(props, MedicationOrders.find().fetch());
      fetchMedicationsFromFhirArray(props, MedicationOrders.find().fetch());
    });


    let medicationRequestSearchOptions = { 
      resourceType: 'MedicationRequest', 
      searchParams: { 
        date: []
      }
    };
    medicationRequestSearchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    medicationRequestSearchOptions.searchParams.date[1] = "le" +  selectedEndDate;

    fetchResourceData(props, medicationRequestSearchOptions, MedicationRequests, function(){
      fetchPatientsFromFhirArray(props, MedicationRequests.find().fetch());
      fetchMedicationsFromFhirArray(props, MedicationRequests.find().fetch());
    });


    let medicationStatementSearchOptions = { 
      resourceType: 'MedicationStatement', 
      searchParams: { 
        effective: []
      }
    };
    medicationStatementSearchOptions.searchParams.effective[0] = "ge" + selectedStartDate;
    medicationStatementSearchOptions.searchParams.effective[1] = "le" +  selectedEndDate;

    fetchResourceData(props, medicationStatementSearchOptions, MedicationStatements, function(){
      fetchPatientsFromFhirArray(props, MedicationStatements.find().fetch());
      fetchMedicationsFromFhirArray(props, MedicationStatements.find().fetch());
    });
  }
  function handleFetchObservations(props){
    logger.warn('CovidQueryPage.handleFetchObservations()');

    let observationSearchOptions = { 
      resourceType: 'Observation', 
      searchParams: { 
        date: []
      }
    };

    observationSearchOptions.searchParams.date[0] = "ge" + selectedStartDate;
    observationSearchOptions.searchParams.date[1] = "le" +  selectedEndDate;

    let observationsToSearchFor = [];
    let observationsToSearchForString = "";
    
    if(checkedVitalSigns){
      observationsToSearchFor.push("vital-signs")
    }
    if(checkedLabResults){
      observationsToSearchFor.push("laboratory")
    }

    // we're being a bit sloppy with this algorithm because it needs to get out the door
    observationsToSearchFor.forEach(function(category){
      // adding a comma after each snomed code
      observationsToSearchForString = observationsToSearchForString + category + ",";
    })
    if(observationsToSearchFor.length > 0){
      // and then dropping the last comma;
      // blah, but it works
      observationSearchOptions.searchParams.category = observationsToSearchForString.substring(0, observationsToSearchForString.length - 1);
    }


    fetchResourceData(props, observationSearchOptions, Observations, function(){
      fetchPatientsFromFhirArray(props, Observations.find().fetch());
    });
  }
  function handleFetchProcedures(props){
    logger.warn('CovidQueryPage.handleFetchProcedures()');

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

    fetchResourceData(props, searchOptions, Procedures, function(){
      fetchPatientsFromFhirArray(props, Procedures.find().fetch());
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

  function clearConditions(){
    logger.warn('CovidQueryPage.clearConditions()');
    Conditions.remove({});
  }
  function clearEncounters(){
    logger.warn('CovidQueryPage.clearEncounters()');
    Encounters.remove({});
  }
  function clearImmunizations(){
    logger.warn('CovidQueryPage.clearImmunizations()');
    Immunizations.remove({});
  }
  function clearLocations(){
    logger.warn('CovidQueryPage.clearLocations()');
    Locations.remove({});
  }
  function clearMedications(){
    logger.warn('CovidQueryPage.clearMedications()');
    Medications.remove({});
  }
  function clearMedicationOrders(){
    logger.warn('CovidQueryPage.clearMedicationOrders()');
    MedicationOrders.remove({});
  }
  function clearMedicationRequests(){
    logger.warn('CovidQueryPage.clearMedicationRequests()');
    MedicationRequests.remove({});
  }
  function clearMedicationStatements(){
    logger.warn('CovidQueryPage.clearMedicationStatements()');
    MedicationStatements.remove({});
  }
  function clearObservations(){
    logger.warn('CovidQueryPage.clearObservations()');
    Observations.remove({});
  }
  function clearProcedures(){
    logger.warn('CovidQueryPage.clearProcedures()');
    Procedures.remove({});
  }
  function clearPatients(){
    logger.warn('CovidQueryPage.clearPatients()');
    Patients.remove({});
  }
  function clearGeoJson(){
    logger.warn('CovidQueryPage.clearGeoJson()');
    Session.set('geoJsonLayer', "")
  }

  //-------------------------------------------------------------------
  // Recursive Methods


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

  // This is where the magic happens
  async function recursiveResourceQuery(fhirClient, resourceType, searchResponse, resourceArray, cursor, callback){
    logger.debug("RecursiveResourceQuery.  Welcome to the rabbit hole.  Don't be late to the tea party.")
    let self = this;

    logger.trace('searchResponse', searchResponse);
    logger.trace('hasNext', hasNext(searchResponse));
  
    let recursiveResult = null;
    if(hasNext(searchResponse)){      
      recursiveResult = await fhirClient.nextPage(searchResponse).then((newResponse) => {
  
        if(get(newResponse, 'resourceType') === "Bundle"){
          logger.trace('Received next bundle.', newResponse)
          let entries = get(newResponse, 'entry', []);
  
          entries.forEach(function(entry){
            if(get(entry, 'resource.resourceType') === resourceType){

              if(cursor){
                if(!cursor.findOne({id: get(entry, 'resource.id')})){
                  let newResourceId = cursor.upsert({id: get(entry, 'resource.id')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});
                  logger.trace('Just received new ' + resourceType + ":  " + newResourceId);

                  if(!get(entry, 'resource.id')){
                    entry.resource.id = newResourceId;
                  } 
                  if(!get(entry, 'resource._id')){
                    entry.resource._id = newResourceId;
                  }

                  resourceArray.push(get(entry, 'resource'))                    
                }
              } else {
                resourceArray.push(get(entry, 'resource'))                    
              }
            }
          })        
  
          resourceArray = recursiveResourceQuery(fhirClient, resourceType, newResponse, resourceArray, cursor, callback)
        } 
  
        return resourceArray;
      })
    } else {
      if(typeof callback === "function"){
        callback();
      }
    }
  
    return recursiveResult;
  }



  // // may be able to remove the following
  // async function recursiveEncounterQuery(fhirClient, searchResponse, encountersArray, callback){
  //   logger.debug('recursiveEncounterQuery', fhirClient, searchResponse);
  
  //   let self = this;

  //   function hasNext(searchResponse){
  //     let result = false;
  //     if(get(searchResponse, 'link')){
  //       searchResponse.link.forEach(function(link){
  //         if(get(link, 'relation') === "next"){
  //           result = true;
  //         }
  //       })
  //     }
  //     return result;
  //   }

  //   let recursiveResult = null;
  //   if(hasNext(searchResponse)){
  //     logger.debug('Found a next link in the bundle.  Fetching...')
  //     recursiveResult = await fhirClient.nextPage(searchResponse)
  //     .then((newResponse) => {
  //       logger.trace('recursiveEncounterQuery().fhirClient.nextPage().newResponse', newResponse);

  //       if(get(newResponse, 'resourceType') === "Bundle"){
  //         logger.debug('Parsing a Bundle.')
  //         let entries = get(newResponse, 'entry', []);

  //         entries.forEach(function(entry){
  //           if(get(entry, 'resource.resourceType') === "Encounter"){
  //             logger.trace('Found an encounter', get(entry, 'resource'));

  //             if(!Encounters.findOne({id: get(entry, 'resource.id')})){
  //               let encounterId = Encounters.insert(get(entry, 'resource'), {validate: false, filter: false});
  //               logger.trace('Just received new encounter: ' + encounterId);
    
  //               if(!get(entry, 'resource.id')){
  //                 entry.resource.id = encounterId;
  //               } 
  //               if(!get(entry, 'resource._id')){
  //                 entry.resource._id = encounterId;
  //               }
    
  //               encountersArray.push(get(entry, 'resource'))  
  //             }
  //           }
  //         })        

  //         // setEncounters(encountersArray);  // this is mostly just to update the progress so people see things are loading
  //         encountersArray = recursiveEncounterQuery(fhirClient, newResponse, encountersArray, callback)
  //       } 

  //       // setEncounters(encountersArray);
  //       return encountersArray;
  //     })
  //   } else {
  //     callback();
  //   }

  //   return recursiveResult;
  // }

  // async function recursiveConditionQuery(fhirClient, searchResponse, conditionsArray, callback){
  //   logger.debug('recursiveConditionQuery', fhirClient, searchResponse);
  
  //   let self = this;

  //   function hasNext(searchResponse){
  //     let result = false;
  //     if(get(searchResponse, 'link')){
  //       searchResponse.link.forEach(function(link){
  //         if(get(link, 'relation') === "next"){
  //           result = true;
  //         }
  //       })
  //     }
  //     return result;
  //   }

  //   let recursiveResult = null;
  //   if(hasNext(searchResponse)){
  //     logger.debug('Found a next link in the bundle.  Fetching...')
  //     recursiveResult = await fhirClient.nextPage(searchResponse)
  //     .then((newResponse) => {
  //       logger.trace('recursiveConditionQuery().fhirClient.nextPage().newResponse', newResponse);

  //       if(get(newResponse, 'resourceType') === "Bundle"){
  //         logger.debug('Parsing a Bundle.')
  //         let entries = get(newResponse, 'entry', []);

  //         entries.forEach(function(entry){
  //           if(get(entry, 'resource.resourceType') === "Condition"){
  //             logger.trace('Found an condition', get(entry, 'resource'));

  //             if(!Conditions.findOne({id: get(entry, 'resource.id')})){
  //               let conditionId = Conditions.insert(get(entry, 'resource'), {validate: false, filter: false});
  //               logger.trace('Just received new condition: ' + conditionId);
    
  //               if(!get(entry, 'resource.id')){
  //                 entry.resource.id = conditionId;
  //               } 
  //               if(!get(entry, 'resource._id')){
  //                 entry.resource._id = conditionId;
  //               }
    
  //               conditionsArray.push(get(entry, 'resource'))  
  //             }
  //           }
  //         })        

  //         // setConditions(conditionsArray);  // this is mostly just to update the progress so people see things are loading
  //         conditionsArray = recursiveConditionQuery(fhirClient, newResponse, conditionsArray, callback)
  //       } 

  //       // setEncounters(conditionsArray);
  //       return conditionsArray;
  //     })
  //   } else {
  //     callback();
  //   }

  //   return recursiveResult;
  // }

  // async function recursiveProcedureQuery(fhirClient, searchResponse, proceduresArray, callback){
  //   logger.debug('recursiveProcedureQuery', fhirClient, searchResponse);
  
  //   let self = this;

  //   function hasNext(searchResponse){
  //     let result = false;
  //     if(get(searchResponse, 'link')){
  //       searchResponse.link.forEach(function(link){
  //         if(get(link, 'relation') === "next"){
  //           result = true;
  //         }
  //       })
  //     }
  //     return result;
  //   }

  //   let recursiveResult = null;
  //   if(hasNext(searchResponse)){
  //     logger.debug('Found a next link in the bundle.  Fetching...')
  //     recursiveResult = await fhirClient.nextPage(searchResponse)
  //     .then((newResponse) => {
  //       logger.trace('recursiveProcedureQuery().fhirClient.nextPage().newResponse', newResponse);

  //       if(get(newResponse, 'resourceType') === "Bundle"){
  //         logger.debug('Parsing a Bundle.')
  //         let entries = get(newResponse, 'entry', []);

  //         entries.forEach(function(entry){
  //           if(get(entry, 'resource.resourceType') === "Procedure"){
  //             logger.trace('Found an procedure', get(entry, 'resource'));

  //             if(!Procedures.findOne({id: get(entry, 'resource.id')})){
  //               let procedureId = Procedures.insert(get(entry, 'resource'), {validate: false, filter: false});
  //               logger.trace('Just received new procedure: ' + procedureId);
    
  //               if(!get(entry, 'resource.id')){
  //                 entry.resource.id = procedureId;
  //               } 
  //               if(!get(entry, 'resource._id')){
  //                 entry.resource._id = procedureId;
  //               }
    
  //               proceduresArray.push(get(entry, 'resource'))  
  //             }
  //           }
  //         })        

  //         // setProcedures(proceduresArray);  // this is mostly just to update the progress so people see things are loading
  //         proceduresArray = recursiveProcedureQuery(fhirClient, newResponse, proceduresArray, callback)
  //       } 

  //       // setEncounters(proceduresArray);
  //       return proceduresArray;
  //     })
  //   } else {
  //     callback();
  //   }

  //   return recursiveResult;
  // }

  //-------------------------------------------------------------------
  // Fetch Methods

  async function fetchResourceData(props, searchOptions, cursor, callback, totalsCallback){
    logger.debug('Fetch data from the following endpoint: ' + fhirServerEndpoint + '/' + get(searchOptions, "resourceType"));
    logger.debug('Search Options: ', searchOptions);

    let resultsArray = [];
    let resourceType = get(searchOptions, 'resourceType');

    await fhirClient.search(searchOptions)
    .then((searchResponse) => {
      logger.debug('Received a searchResponse.', searchResponse);

      let resultsArray = [];

      if(typeof totalsCallback === "function"){
        if(get(searchResponse, "total")){
          console.log('Iniital payload reports that there are a total of ' + get(searchResponse, 'total') + ' records matching the search.')
          totalsCallback(get(searchResponse, "total"))
        }
      }

      if(get(searchResponse, 'resourceType') === "Bundle"){
        logger.debug('Parsing a Bundle.')
        logger.debug('Bundle linkUrl was: ' + get(searchResponse, "link[0].url"));
        // Session.set('encounterUrl', get(searchResponse, "link[0].url"));

        let entries = get(searchResponse, 'entry', []);
        logger.debug('Number of entries found: ' + entries.length);
        
        entries.forEach(function(entry){
          if(get(entry, 'resource.resourceType') === get(searchOptions, 'resourceType')){

            if(cursor){
              // checking for duplicates along the way
              if(!cursor.findOne({id: get(entry, 'resource.id')})){
                logger.trace('doesnt exist, upserting');

                let newResourceId = cursor.upsert({id: get(entry, 'resource.id')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});
                logger.trace('Just received new ' + get(searchOptions, 'resourceType') + ": " + newResourceId);
    
                if(!get(entry, 'resource.id')){
                  entry.resource.id = newResourceId;
                } 
                if(!get(entry, 'resource._id')){
                  entry.resource._id = newResourceId;
                }
    
                resultsArray.push(get(entry, 'resource'))
              }  
            } else {
              resultsArray.push(get(entry, 'resource'))              
            }   
          }
        })   
        
        console.log('Upserted ' + cursor.find().count() + ' new records.' )
      }

      resultsArray = recursiveResourceQuery(fhirClient, resourceType, searchResponse, resultsArray, cursor, function(error, result){
        logger.info("We just finished the recursive query and received the following result: " + result)
      });

      return resultsArray;
    })
    .then((resultsArray) => {
      // console.log('resultsArray', resultsArray);
      setEncounters(resultsArray);
      if(typeof callback === "function"){
        callback();
      }
      return resultsArray;
    })
    .catch((error) => {
      console.log(error)
    });
  }



  function fetchMedicationsFromFhirArray(props, arrayOfMedicationResources){
    logger.debug('CovidQueryPage.fetchMedicationsFromFhirArray()', arrayOfMedicationResources);

    let medicationReference = "";
    let medicationId = "";
    let fetchedMedicationResponse;

    logger.trace('fetchMedicationsFromFhirArray.arrayOfResources' + arrayOfMedicationResources);
    
    if(Array.isArray(arrayOfMedicationResources)){
      arrayOfMedicationResources.forEach(async function(resource){
        newMedicationId = "";
  
        if(get(resource, 'medication.reference')){
          medicationReference = get(resource, 'medication.reference');
          medicationId = FhirUtilities.pluckReferenceId(medicationReference);
        } else if (get(resource, 'medicationReference.reference')){
          medicationReference = get(resource, 'medicationReference.reference');
          medicationId = FhirUtilities.pluckReferenceId(medicationReference);
        }
  
        logger.debug('fetchMedicationsFromFhirArray.encounters[i].medicationId', medicationId);
  
        fetchedMedicationResponse = await fhirClient.read({ resourceType: 'Medication', id: medicationId });
        logger.trace('fetchedMedicationResponse', fetchedMedicationResponse);
  
        if(fetchedMedicationResponse){
          if(fetchedMedicationResponse.resourceType === "Medication"){
            if(!Medications.findOne({id: fetchedMedicationResponse.id})){
              newMedicationId = Medications.insert(fetchedMedicationResponse, {validate: false, filter: false});
              logger.verbose('Just received new medication: ' + newMedicationId);
            }    
          } else if(fetchedMedicationResponse.resourceType === "Bundle"){
            if(Array.isArray(fetchedMedicationResponse.entry)){
              fetchedMedicationResponse.entry.forEach(function(entry){
                if(get(entry, 'resource.resourceType') === "Medication"){
                  console.log('Searching for medication id: ' + get(entry, 'resource.id'));                
                  if(!Medications.findOne({id: get(entry, 'resource.id')})){
                    newMedicationId = Medications.insert(get(entry, 'resource'), {validate: false, filter: false});
                    logger.verbose('Just added a new medication: ' + newMedicationId);
                  } else {
                    console.log("Already found the medication?")
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

  function fetchPatientsFromFhirArray(props, arrayOfResources){
    logger.info('CovidQueryPage.fetchPatientsFromFhirArray()');

    let patientReference = "";
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




  //-------------------------------------------------------------------
  // UI Component Methods

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


    HTTP.get(fhirServerEndpoint + "/metadata", {headers: {
      "Accept": "application/json+fhir"
    }}, function(error, conformanceStatement){
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
    logger.trace('handleFhirEndpointChange', event.currentTarget.value)

    if(event.currentTarget.value){
      setFhirServerEndpoint(event.currentTarget.value)

      fhirClient = new Client({
        baseUrl: event.currentTarget.value
      });
    }
  }
  function handleChangeUsername(event){
    logger.trace('handleChangeUsername', event.currentTarget.value)

    if(event.currentTarget.value){
      setUsername(event.currentTarget.value)
    }
  }
  function handleChangePassword(event){
    logger.trace('handleChangePassword', event.currentTarget.value)

    if(event.currentTarget.value){
      setPassword(event.currentTarget.value)
    }
  }

  function handlePatientRowClick(id){
    console.log('CovidQueryPage.handlePatientRowClick()', id)
    // Session.set('currentPatientId', id);
    Session.set('selectedPatientId', id);

    if(typeof Patients === "object"){
      console.log('CovidQueryPage.handlePatientRowClick()', Patients.findOne({id: id}))
      // Session.set('currentPatient', Patients.findOne({id: id}));  
      Session.set('selectedPatient', Patients.findOne({id: id}));  
    }
  }

  //-----------------------------------------------------------------------------------------------
  // OAUth Popup Window 
  // https://dev.to/dinkydani21/how-we-use-a-popup-for-google-and-outlook-oauth-oci

  let windowObjectReference = null;
  let previousUrl = null;

  function receiveMessage(event){
    // Do we trust the sender of this message? (might be
    // different from what we originally opened, for example).
    // if (event.origin !== Session.get('smartOnFhir_iss')) {
    //   return;
    // }

    const { data } = event;
    // if we trust the sender and the source is our popup
    //if (data.source === 'lma-login-redirect') {
      // get the URL params and redirect to our server to use Passport to auth/login
      const { payload } = data;
      const redirectUrl = '/launch' + payload;

      window.location.pathname = redirectUrl;
    //}
   };

  function openSignInWindow(url, name){
    // remove any existing event listeners
    window.removeEventListener('message', receiveMessage);

    // window features
    const strWindowFeatures = 'toolbar=no, menubar=no, width=600, height=700, top=100, left=100';

    if (windowObjectReference === null || windowObjectReference.closed) {
      /* if the pointer to the window object in memory does not exist
        or if such pointer exists but the window was closed */
      windowObjectReference = window.open(url, name, strWindowFeatures);
    } else if (previousUrl !== url) {
      /* if the resource to load is different,
        then we load it in the already opened secondary window and then
        we bring such window back on top/in front of its parent window. */
      windowObjectReference = window.open(url, name, strWindowFeatures);
      windowObjectReference.focus();
    } else {
      /* else the window reference must exist and the window
        is not closed; therefore, we can bring it back on top of any other
        window with the focus() method. There would be no need to re-create
        the window or to reload the referenced resource. */
      windowObjectReference.focus();
    }

    // add the listener for receiving a message from the popup
    window.addEventListener("message", function (event) {
      receiveMessage(event)
    }, false);

    // assign the previous URL
    previousUrl = url;
  };



  //-----------------------------------------------------------------------------------------------
  // OAuth 
  async function smartAuthenticateWithFhirServer(){
    console.log('smartAuthenticateWithFhirServer');

    let oauthConfig = {
      "client_id": get(Meteor, 'settings.public.smartOnFhir[0].client_id'),
      "scope": get(Meteor, 'settings.public.smartOnFhir[0].scope'),
      "redirectUri": get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri'),
      // 'fhirServiceUrl': get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl')
    }

    console.log('oauthConfig', oauthConfig);
    FHIR.oauth2.authorize(oauthConfig).catch(function(error){
      console.log('Authorization error', error)
    });
  }



  async function authenticateWithFhirServer(){
    console.log('authenticateWithFhirServer', Session.get('smartOnFhir_iss'));
    fhirClient = new Client({ baseUrl: Session.get('smartOnFhir_iss') });
    const { authorizeUrl, tokenUrl } = await fhirClient.smartAuthMetadata();

    console.log('authorizeUrl', authorizeUrl)
    console.log('tokenUrl', tokenUrl)

    if(authorizeUrl && tokenUrl){
      const oauth2 = simpleOauthModule.create({
        client: {
          id: get(Meteor, 'settings.public.smartOnFhir[0].client_id'),
          secret: get(Meteor, 'settings.public.smartOnFhir[0].secret')
        },
        auth: {
          tokenHost: tokenUrl.protocol + '//' + tokenUrl.host,
          tokenPath: tokenUrl.pathname,
          authorizeHost: authorizeUrl.protocol + '//' + authorizeUrl.host,
          authorizePath: authorizeUrl.pathname
        },
        options: {
          authorizationMethod: 'body',
        }
      });
      console.log('oauth2', oauth2)

      const authorizationUri = oauth2.authorizationCode.authorizeURL({        
        client_id: get(Meteor, 'settings.public.smartOnFhir[0].client_id'),
        launch: Session.get('smartOnFhir_launch'),
        aud: Session.get('smartOnFhir_iss'),
        scope: get(Meteor, 'settings.public.smartOnFhir[0].scope'),
        state: Random.secret()
      });

      console.log('authorizationUri', authorizationUri);
      Session.set('smartOnFhir_authorizationUri', authorizationUri);

      openSignInWindow(authorizationUri, "authorizationPopup");
    }
  }
  function handleSignIn(event){
    logger.trace('handleSignIn');

    logger.trace('In theory we could try to sign in.');
    logger.trace('Username:  ' + username);
    logger.trace('Password:  ' + password);
    
    // authenticateWithFhirServer();
  }


  //-------------------------------------------------------------------
  // Render Titles and Headers

  let containerStyle = {
    paddingLeft: '100px',
    paddingRight: '100px',
    marginBottom: '100px'
  };

  let deviceTitle = 'Devices';
  let conditionsTitle = 'Conditions';
  let encountersTitle = 'Encounters';
  let locationsTitle = 'Locations';
  let immunizationsTitle = 'Immunizations';
  let medicationsTitle = 'Immunizations';
  let medicationOrdersTitle = 'Medication Orders';
  let medicationRequestsTitle = 'Medication Requests';
  let medicationStatementsTitle = 'Medication Statements';
  let observationsTitle = 'Observations';
  let patientTitle = 'Patients';
  let proceduresTitle = 'Procedures';

  if(typeof Conditions === "object"){
    conditionsTitle = conditionCount + ' Conditions';
  }
  if(typeof Devices === "object"){
    deviceTitle = deviceCount + ' Devices';
  }
  if(typeof Encounters === "object"){
    encountersTitle = encounterCount + ' Encounters';
  }
  if(typeof Immunizations === "object"){
    immunizationsTitle = immunizationCount + ' Immunizations';
  }
  if(typeof Locations === "object"){
    locationsTitle = locationCount + ' Locations';
  }
  if(typeof Medications === "object"){
    medicationsTitle = medicationCount + ' Medications';
  }
  if(typeof MedicationOrders === "object"){
    medicationOrdersTitle = medicationOrderCount + ' Medication Orders';
  }
  if(typeof MedicationRequests === "object"){
    medicationRequestsTitle = medicationRequestCount + ' Medication Requests';
  }
  if(typeof MedicationStatements === "object"){
    medicationStatementsTitle = medicationStatementCount + ' Medication Statements';
  }
  if(typeof Observations === "object"){
    observationsTitle = observationCount + ' Observations';
  }
  if(typeof Patients === "object"){
    patientTitle = patientCount + ' Patients';
  }
  if(typeof Procedures === "object"){
    proceduresTitle = procedureCount + ' Procedures';
  }
  
  selectedStartDate = moment(selectedStartDate).format("YYYY-MM-DD");
  selectedEndDate = moment(selectedEndDate).format("YYYY-MM-DD");


  //-------------------------------------------------------------------
  // Render Cards

  let conditionsCard;
  if(conditionCount > 0){
    conditionsCard= <StyledCard id="fetchedConditionssCard" style={{minHeight: '200px', marginBottom: '40px'}}>
      <CardHeader 
        id="conditionsCardCount"
        title={conditionsTitle} 
        style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <ConditionsTable
          id="fetchedConditionsTable"
          conditions={conditions}
          rowsPerPage={viewPreference_rowsPerPage}
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

  let devicesCard;
  if(deviceCount > 0){
    devicesCard = <StyledCard id="devicesCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="devicesCardCount"
        title={deviceTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <DevicesTable 
          rowsPerPage={viewPreference_rowsPerPage}
        />
      </CardContent>
    </StyledCard> 
  } 

  let encountersCard;
  if(encounterCount > 0){
    encountersCard = <StyledCard id="fetchedEncountersCard" style={{minHeight: '200px', marginBottom: '40px'}}>
      <CardHeader 
        id="encountersCardCount"
        title={encountersTitle} 
        style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <EncountersTable
          id="fetchedEncountersTable"
          encounters={encounters}
          rowsPerPage={viewPreference_rowsPerPage}
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

  let immunizationsCard;
  if(immunizationCount > 0){
    immunizationsCard = <StyledCard id="immunizationsCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="immunizationsCardCount"
        title={immunizationsTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <ImmunizationsTable 
          immunizations={immunizations}
          rowsPerPage={viewPreference_rowsPerPage}
          hideCheckboxes={true}
          hideIdentifier={true}
          hideActionIcons={true}
          hidePerformer={true}
          hidePatient={false}
          count={immunizationCount}
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearImmunizationsBtn" color="primary" className={classes.button} onClick={clearImmunizations.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard> 
  } 

  let medicationsCard;
  if(medicationCount > 0){
    medicationsCard = <StyledCard id="medicationsCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="medicationsCardCount"
        title={medicationsTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <MedicationsTable 
          medications={medications}
          hideCheckbox={true}
          hideActionIcons={true}
          hideIdentifier={true}
          hideActiveIngredient={true}
          rowsPerPage={viewPreference_rowsPerPage}
          count={medicationCount}
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearMedicationsBtn" color="primary" className={classes.button} onClick={clearMedications.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard> 
  } 

  let medicationOrdersCard;
  if(medicationOrderCount > 0){
    medicationOrdersCard = <StyledCard id="medicationOrdersCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="medicationOrdersCardCount"
        title={medicationOrdersTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <MedicationOrdersTable 
          medicationOrders={medicationOrders}
          hideCheckboxes={true}
          hideIdentifier={true}
          rowsPerPage={viewPreference_rowsPerPage}
          count={medicationOrderCount}        
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearMedicationOrdersBtn" color="primary" className={classes.button} onClick={clearMedicationOrders.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard> 
  } 

  let medicationRequestsCard;
  if(medicationRequestCount > 0){
    medicationRequestsCard = <StyledCard id="medicationRequestsCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="medicationRequestsCardCount"
        title={medicationRequestsTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <MedicationRequestsTable
          medicationRequests={medicationRequests}
          hideCheckboxes={true}
          hideIdentifier={true}
          rowsPerPage={viewPreference_rowsPerPage}
          count={medicationRequestCount}     
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearMedicationRequestsBtn" color="primary" className={classes.button} onClick={clearMedicationRequests.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard> 
  } 

  let medicationStatementsCard;
  if(medicationStatementCount > 0){
    medicationStatementsCard = <StyledCard id="medicationStatementsCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="medicationStatementsCardCount"
        title={medicationStatementsTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <MedicationStatementsTable
          medicationStatements={medicationStatements}
          displayCheckboxes={false}
          displayIdentifier={false}
          displayMedicationReference={true}
          displayReasonReference={true}
          rowsPerPage={viewPreference_rowsPerPage}
          count={medicationStatementCount}   
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearMedicationStatementsBtn" color="primary" className={classes.button} onClick={clearMedicationStatements.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard> 
  } 

  let observationsCard;
  if(observationCount > 0){
    observationsCard = <StyledCard id="observationsCard" style={{minHeight: '240px', marginBottom: '40px'}}>
      <CardHeader 
        id="observationsCardCount"
        title={observationsTitle}  
        style={{fontSize: '100%'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <ObservationsTable        
          observations={observations}
          hideCheckboxes={true}
          hideActionIcons={true}
          hideSubject={true}
          hideDevices={true}
          hideValue={false}
          hideBarcodes={true}
          hideDenominator={true}
          hideNumerator={true}
          multiComponentValues={true}
          rowsPerPage={viewPreference_rowsPerPage}
          count={observationCount}  
        />
      </CardContent>
      <CardActions style={{display: 'inline-flex', width: '100%'}} >
        <Button id="clearObservationssBtn" color="primary" className={classes.button} onClick={clearObservations.bind(this)} >Clear</Button> 
      </CardActions> 
    </StyledCard> 
  } 


  
  let proceduresCard;
  if(procedureCount > 0){
    proceduresCard = <StyledCard id="fetchedProceduresCard" style={{minHeight: '200px', marginBottom: '40px'}}>
      <CardHeader 
        id="proceduresCardCount"
        title={proceduresTitle}         
        style={{fontSize: '100%', whiteSpace: 'nowrap'}} />
      <CardContent style={{fontSize: '100%', paddingBottom: '28px'}}>
        <ProceduresTable
          id="fetchedProceduresTable"                  
          procedures={procedures}
          rowsPerPage={viewPreference_rowsPerPage}
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
  
  //-------------------------------------------------------------------
  // Render No Data Card and PatientLookup Card
  // These are a little different than the others, because they're a secondary lookup

  let noDataCard;
  if(!conditionsCard && !devicesCard && !encountersCard && !immunizationsCard && !medicationsCard && !medicationOrdersCard && !medicationRequestsCard && !medicationStatementsCard && !observationsCard && !proceduresCard){
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
          rowsPerPage={viewPreference_rowsPerPage}
          paginationCount={patientCount}
          hideActionIcons
          hideLanguage
          hideCountry
          showCounts={false}
          hideActive
          onRowClick={handlePatientRowClick}
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


  
  let headerHeight = 84;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }  

  return (
    <PageCanvas id='fetchDataFromHospitalPage' headerHeight={headerHeight} >
      <MuiPickersUtilsProvider utils={MomentUtils} libInstance={moment} local="en">
        <Grid container spacing={3} style={{paddingBottom: '80px'}}>
          <Grid item md={4} >
              <CardHeader 
                title="Step 1 - Fetch Data From Servers" 
                style={{fontSize: '100%'}} />            
            <StyledCard >
              <CardHeader 
                title="FHIR Server Authentication" 
                subheader="Please authenticate into the server."
                style={{fontSize: '100%'}} />
              <Button 
                id="fetchCapabilityStatement" 
                color="primary" 
                className={classes.button} onClick={handleFetchCapabilityStatement.bind(this)} 
                style={{float: 'right', right: '0px', marginTop: '-70px'}}
              >Capability Statement</Button> 
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item md={12}>
                    <FormControl style={{width: '100%', marginTop: '20px'}}>
                      <InputLabel>Health Record and Interoperability Resource Query</InputLabel>
                      <Input
                        id="fhirQueryUrl"
                        name="fhirQueryUrl"
                        placeholder="http://localhost:3100/baseR4/Patient?_count=20"
                        // helperText='Please enter a web address URL.'  
                        defaultValue={ fhirServerEndpoint }
                        onChange={handleFhirEndpointChange}
                        fullWidth
                        disabled
                      />
                    </FormControl>
                  </Grid>
                </Grid>
                {/* <Grid container spacing={3}>
                  <Grid item md={6}>
                    <FormControl style={{width: '100%', marginTop: '20px', marginBottom: '20px'}}>
                      <InputLabel>Username</InputLabel>
                      <Input
                        id="usernameInput"
                        name="usernameInput"
                        placeholder="alicedoe"                      
                        defaultValue=""
                        onChange={handleChangeUsername}
                        fullWidth
                      />
                    </FormControl>
                  </Grid>
                  <Grid item md={6}>
                    <FormControl style={{width: '100%', marginTop: '20px', marginBottom: '20px'}}>
                      <InputLabel>Password</InputLabel>
                      <Input
                        id="passwordInput"
                        name="passwordInput"
                        placeholder="********"
                        defaultValue=""
                        onChange={handleChangePassword}
                        fullWidth
                      />
                    </FormControl>
                  </Grid>
                </Grid> */}
              </CardContent>
              {/* <CardActions style={{display: 'inline-flex', width: '100%'}} >
                <Button id="signInButton" color="primary" className={classes.button} onClick={authenticateWithFhirServer} >Sign In With {get(Meteor, 'settings.public.smartOnFhir[0].vendor')}</Button> 
                <Button id="signInButton" color="primary" variant="contained" className={classes.button} onClick={smartAuthenticateWithFhirServer} >Smart Sign In With {get(Meteor, 'settings.public.smartOnFhir[0].vendor')}</Button> 
              </CardActions>  */}

            </StyledCard>
            <DynamicSpacer />
            <StyledCard>
              <CardHeader 
                title="Date Range" 
                subheader="Fetching data related to COVID19 coronavirus symptoms."
                style={{fontSize: '100%'}} />
              <FormControlLabel                
                control={<Checkbox checked={checkedDateRangeEnabled} onChange={handleToggleDateRange} name="checkedDateRangeEnabled" />}
                label="Enabled"
                style={{float: 'right', position: 'relative', right: '0px', top: '-70px' }}
              />

              <CardContent style={{display: 'flex'}}>
                <Grid container spacing={3}>
                  <Grid item md={6}>
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
                        disabled={checkedDateRangeEnabled ? false : true}
                      />
                    </div>
                  </Grid>
                  <Grid item md={6}>
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
                        disabled={checkedDateRangeEnabled ? false : true}
                      />
                    </div>
                  </Grid>
                </Grid>
                </CardContent>
              </StyledCard>
              <DynamicSpacer />
              <StyledCard style={{minHeight: '380px'}}>
                <CardHeader 
                  title="Clinical Parameters" 
                  subheader="Select the clinical parameters related to Covid19 you would like to search for."
                  style={{fontSize: '100%'}} />
                <CardContent>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <FormControlLabel
                          control={<Checkbox checked={checkedCovid19} onChange={handleToggleCovid19.bind(this)} name="checkedCovid19" />}
                          label="Covid19"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={checkedSuspectedCovid19} onChange={handleToggleSuspectedCovid19.bind(this)} name="checkedSuspectedCovid19" />}
                          label="Suspected Covid19"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedSerumAntibodies} onChange={handleToggleSerumAntibodies.bind(this)} name="checkedSerumAntibodies" />}
                          label="Serum Antibodies"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchConditionsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchConditions.bind(this)} fullWidth>Fetch Conditions</Button>                 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
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
                      <TableCell>
                        <Typography >
                          <Button id="fetchConditionsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchConditions.bind(this)} fullWidth>Fetch Symptoms</Button>                 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedSmoker} onChange={handleToggleSmoker.bind(this)} name="checkedSmoker" />}
                          label="Smoker"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedHypertension} onChange={handleToggleHypertension.bind(this)} name="checkedHypertension" />}
                          label="Hypertension"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedBloodTypeA} onChange={handleToggleBloodTypeA.bind(this)} name="checkedBloodTypeA" />}
                          label="Blood Type A"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchConditionsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchConditions.bind(this)} fullWidth >Fetch Pre-Existing Conditions</Button>                 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedVaccinated} onChange={handleToggleVaccinated.bind(this)} name="checkedVaccinated" />}
                          label="Vaccinated"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedPlasmaTransfer} onChange={handleTogglePlasmaTransfer.bind(this)} name="checkedPlasmaTransfer" />}
                          label="Plasma Transfer"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchImmunizationsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchImmunizations.bind(this)} fullWidth>Fetch Immunizations</Button> 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedTamiflu} onChange={handleToggleTamiflu.bind(this)} name="checkedTamiflu" />}
                          label="Tamiflu"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedHydroxychloroquine} onChange={setCheckedHydroxychloroquine.bind(this)} name="checkedHydroxychloroquine" />}
                          label="Hydroxychloroquine"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchMedicationsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchMedications.bind(this)} fullWidth>Fetch Medications</Button> 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox checked={checkedOxygenAdministration} onChange={handleToggleOxygenAdministration.bind(this)} name="checkedOxygenAdministration" />}
                          label="Oxygen Administration"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedIntubated} onChange={handleToggleIntubated.bind(this)} name="checkedIntubated" />}
                          label="Intubated"
                        />
                        <FormControlLabel                
                          control={<Checkbox disabled checked={checkedPronated} onChange={handleTogglePronated.bind(this)} name="checkedPronated" />}
                          label="Pronated"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchProceduresButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchProcedures.bind(this)} fullWidth>Fetch Procedures</Button> 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <FormControlLabel                
                          control={<Checkbox checked={checkedVentilator} onChange={handleToggleVentilator.bind(this)} name="checkedVentilator" />}
                          label="Ventilators"
                        />

                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchDevicesButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchDevices.bind(this)} fullWidth>Fetch Devices</Button> 
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <FormControlLabel
                          control={<Checkbox checked={checkedVitalSigns} onChange={handleToggleVitalSigns.bind(this)} name="checkedVitalSigns" />}
                          label="Vital Signs"
                        />
                        <FormControlLabel
                          control={<Checkbox checked={checkedLabResults} onChange={handleToggleLabResults.bind(this)} name="checkedLabResults" />}
                          label="Lab Results"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          <Button id="fetchObservationsButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchObservations.bind(this)} fullWidth>Fetch Observations</Button> 
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <DynamicSpacer />
              <CardActions style={{display: 'inline-flex', width: '100%'}} >                
                <Button id="fetchEncountersButton" color="primary" variant="contained" className={classes.button} onClick={handleFetchEncounters.bind(this)} fullWidth>Fetch Encounters</Button> 
              </CardActions>              
            </StyledCard>          
          </Grid>
          <Grid item md={4} style={{paddingBottom: '80px'}}>
            <CardHeader title="Step 2 - Received Data" style={{fontSize: '100%'}} />  
            { conditionsCard }
            { devicesCard }   
            { encountersCard }
            { immunizationsCard }
            { medicationsCard }
            { medicationOrdersCard }
            { medicationRequestsCard }
            { medicationStatementsCard }
            { observationsCard }
            { proceduresCard }
            { noDataCard }
          </Grid>
          
          <Grid item md={4}>
            <CardHeader 
                title="Step 3 - Patient Demographic Lookup" 
                style={{fontSize: '100%'}} />  
            { patientsCard }
          </Grid>
        </Grid>          
      </MuiPickersUtilsProvider>            
    </PageCanvas>
  );
}

export default CovidQueryPage;