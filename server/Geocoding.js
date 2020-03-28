import NodeGeocoder from 'node-geocoder';
import { get, has } from 'lodash';

import FhirUtilities from '../lib/FhirUtilities';

var options = {
  provider: 'google',
  // // Optional depending on the providers
  // httpAdapter: 'http', // Default
  // apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
  // formatter: null         // 'gpx', 'string', ...
};

var geocoder;
if(get(Meteor, 'settings.public.google.maps.apiKey')){
  options.apiKey = get(Meteor, 'settings.public.google.maps.apiKey');
  console.log('Geocoding options: ', options)

  geocoder = NodeGeocoder(options);
}


Meteor.methods({
  parseGeojson: function(data){
    check(data, Object);

    if(data.features && data.features.length > 0){
      data.features.forEach(function(feature){
  
        // this was initially created to parse a geojson file from Medicare
        // we want to modify it so it checks the properties for FHIR objects, 
        // and autoimports them into Symptomatic
        if(feature.properties){
          
          // build our organization object
          var newOrganization = {
            resourceType: 'Organization',
            name: '',
            address: []                      
          }
          if(feature.properties.hospital){
            newOrganization.name = feature.properties.hospital;
          }

          // there can be a bunch of addresses, 
          // so we need to build a new one seperately
          var newAddress = {
            use: 'work',
            type: 'physical',
            line: [],
            city: '',
            district: '',
            state: '',
            postalCode: ''
          };
          if(feature.properties.hospital){
            newAddress.line.push(feature.properties.hospital);
          }
          if(feature.properties.city){
            newAddress.city = feature.properties.hospcity;
          }
          if(feature.properties.hospstate){
            newAddress.state = feature.properties.hospstate;
          }

          // then add it to the organizzation
          newOrganization.address.push(newAddress);
            
          var organizationId;

          // then add the organization to the collection, and get an orgid
          if(Organizations.find({name: newOrganization.name}).count() == 0){
            organizationId = Organizations.insert(newOrganization);
            console.log('organizationId', organizationId);

            // which we'll use for the location
            var newLocation = {
              status: 'active',
              position: {},
              name: newOrganization.name,
              managingOrganization: {
                reference: organizationId,
                display: feature.properties.hospital
              }
            };

            // grab the geocoordinates
            if(feature.geometry && feature.geometry.coordinates){
              newLocation.position.longitude = feature.geometry.coordinates[0];
              newLocation.position.latitude = feature.geometry.coordinates[1];
            }          
            
            // and add to the database
            if(Locations.find({name: newLocation.name}).count() == 0){
              Locations.insert(newLocation);
            }          
          }
        }
      });



    }

  },
  geocodePatientAddresses(patientsArray){
    //check(patientsArray, Array);

    console.log('geocodePatientAddresses.patientsArray.length', patientsArray.length);

    let fhirLocations = [];
    let geocodedAddress;
    patientsArray.forEach(function(patient){

      // let's try geocoding just the first patient
      geocodedAddress = Meteor.call("geocodeAddress", get(patient, 'address[0]'));

      let newLocation = {
        resourceType: "Location",
        name: FhirUtilities.pluckName(patient),
        address:  get(patient, 'address[0]'),
        position: {
          longitude: null,
          latitude: null,
          altitude: null
        }
      }  

      if(get(geocodedAddress[0], "latitude")){
        newLocation.position.latitude = get(geocodedAddress[0], "latitude");
      }
      if(get(geocodedAddress[0], "longitude")){
        newLocation.position.longitude = get(geocodedAddress[0], "longitude");        
      }

      fhirLocations.push(newLocation);
    })
    console.log('geocodePatientAddresses().fhirLocations', fhirLocations)
    return fhirLocations;
  },
  // a single address
  geocodePatientAddress(patient){
    //check(patientsArray, Array);

    console.log('geocodePatientAddresses.patient', patient);

    // let's try geocoding just the first patient
     let geocodedAddress = Meteor.call("geocodeAddress", get(patient, 'address[0]'));

    let newLocation = {
      resourceType: "Location",
      name: FhirUtilities.pluckName(patient),
      address:  get(patient, 'address[0]'),
      position: {
        longitude: null,
        latitude: null,
        altitude: null
      }
    }  

    if(get(geocodedAddress[0], "latitude")){
      newLocation.position.latitude = get(geocodedAddress[0], "latitude");
    }
    if(get(geocodedAddress[0], "longitude")){
      newLocation.position.longitude = get(geocodedAddress[0], "longitude");        
    }

    console.log('newLocation', newLocation)
    return newLocation;
  },
  geocodeAddress: function(address){
    // check(address, Object);
    
    console.log('received a new address to geocode', address)

    // var assembledAddress = "3928 W. Cornelia Ave, Chicago, IL";
    let assembledAddress = '';
    if(get(address, 'line[0]')){
      assembledAddress = get(address, 'line[0]');
    }
    if(get(address, 'city')){
      assembledAddress = assembledAddress + ', ' + get(address, 'city');
    }
    if(get(address, 'state')){
      assembledAddress = assembledAddress + ', ' + get(address, 'state');
    }
    if(get(address, 'postalCode')){
      assembledAddress = assembledAddress + ', ' + get(address, 'postalCode');
    }
    if(get(address, 'country')){
      assembledAddress = assembledAddress + ', ' + get(address, 'country');
    }
    console.log('lets try geocoding something...', assembledAddress);

    let geocodedResult;
    if(get(Meteor, 'settings.public.google.maps.apiKey')){
      geocodedResult = geocoder.geocode(assembledAddress);
    }
    return geocodedResult;
  },
  geocodeAddressToProfile: function(address){
    check(address, Object);
    
    process.env.DEBUG && console.log('received a new address to geocode', address, this.userId)
    // var assembledAddress = "3928 W. Cornelia Ave, Chicago, IL";
    var assembledAddress = '';
    if(address.line){
      assembledAddress = address.line;
    }
    if(address.city){
      assembledAddress = assembledAddress + ', ' + address.city;
    }
    if(address.state){
      assembledAddress = assembledAddress + ', ' + address.state;
    }
    if(address.postalCode){
      assembledAddress = assembledAddress + ', ' + address.postalCode;
    }
    if(address.country){
      assembledAddress = assembledAddress + ', ' + address.country;
    }

    process.env.DEBUG && console.log('lets try geocoding something...', assembledAddress);
    geocoder.geocode(assembledAddress, Meteor.bindEnvironment(function ( err, data ) {
      process.env.DEBUG && console.log('geocoded data:', data);
      if(data){
        if(data[0] && data[0].latitude){
          Meteor.users.update({  _id: Meteor.userId()}, {$set:{
            'profile.locations.home.position.latitude': data[0].latitude
          }});
        }
        if(data[0] && data[0].longitude){
          Meteor.users.update({  _id: Meteor.userId()}, {$set:{
            'profile.locations.home.position.longitude': data[0].longitude
          }});
        }
      }
    }));
  }
});

