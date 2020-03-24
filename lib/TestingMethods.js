

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import moment from 'moment';


Meteor.methods({
  simulateCovidFetch(modality){
    console.log("simulateCovidFetch", modality);

    Session.set("fhirKitClientStartDate", "2014-11-01")
    Session.set("fhirKitClientStartDate", "2014-11-30")

    let newDate = "2014-11-15";
    let newEncounter;
    let newPatient;
    let newPatientId;
    let newEncounterId;

    for (let index = 0; index < 100; index++) {
      
      newPatientId = Random.id();

      // step 1 - create patient; generate ID
      newPatient = {
        _id: newPatientId,
        id: newPatientId,
        resourceType: "Patient"
      }
      newPatientId = Patients.insert(newPatient)

      // step 2 - create encounters
      newEncounterId = Random.id();

      newEncounter = {
        _id: newEncounterId,
        id: newEncounterId,
        resourceType: "Encounter",
        subject: {
          reference: 'Subject/' + newPatientId
        },
        type: [{
          coding: [{
            code: "84114007"
          }]
        }],
        class: {
          code: "IMP"
        },
        period: {
          start: new Date(newDate),
          end: new Date(moment(newDate).add(1, 'days'))
        }
      }

      Encounters.insert(newEncounter, {filter: 'false', validate: 'false'})   
      
      // Encounters.update({_id: newEncounterId}, {$set: {
      //   id: newEncounterId
      // }})
    }
    if(Meteor.isClient){
      Session.set("lastUpdated", new Date())
    }
  }
});



