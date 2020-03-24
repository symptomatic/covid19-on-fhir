import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button } from '@material-ui/core';

import { get } from 'lodash';
import JSON5 from 'json5';



let apiKey = get(Meteor, 'settings.public.interfaces.default.auth.username', '');
let usePseudoCodes = get(Meteor, 'settings.public.usePseudoCodes', false);
let fhirBaseUrl = get(Meteor, 'settings.public.interfaces.default.channel.endpoint', false);


// =========================================================================================
// HELPER FUNCTIONS


// function isFhirServerThatRequiresApiKey(){
//   if(["https://syntheticmass.mitre.org/v1/fhir"].includes(get(Meteor, 'settings.public.interfaces.default.channel.endpoint'))){
//     return true;
//   } else {
//     return false
//   }
// }





//============================================================================================================================
// FETCH

export function FetchButtons(props){
  function clearPatient(){
    console.log('clearPatient!');
    Session.set('selectedPatientId', false);
    Session.set('selectedPatient', false);
  }
  function clearAllData(){
    console.log('clearPatient!');

  }
  return (
    <div>
      <Button className={props.classes.button} onClick={ clearPatient.bind() } >
        Clear Patient
      </Button>
      <Button className={props.classes.button} onClick={ clearAllData.bind() } >
        Clear All Data
      </Button>
      {/* <Button className={props.classes.button} onClick={ queryAllEncountersForDaterange.bind(this) } >
        1. Fetch Encounters
      </Button> */}
    </div>
  );
}



