
// import GoogleMapReact from 'google-map-react';
// import React from 'react';
// import { ReactMeteorData } from 'meteor/react-meteor-data';
// import ReactMixin from 'react-mixin';

// import Card from '@material-ui/core/Card';
// import CardContent from '@material-ui/core/CardContent';
// import CardHeader from '@material-ui/core/CardHeader';

// import { Session } from 'meteor/session';

// import { get } from 'lodash';

// import { MapDot } from './MapDot';

// import { HTTP } from 'meteor/http';


// const AnyReactComponent = ({ text }) => <Card><CardContent>{text}</CardContent></Card>;

// Session.setDefault('mapName', false);

// export class GoogleMapsPage extends React.Component {
//   constructor(props) {
//     super(props);
//   }
//   getMeteorData() {
//     let data = {
//       style: {
//         page: {
//           position: 'fixed',
//           top: '0px',
//           left: '0px',
//           height: Session.get('appHeight'),
//           width: Session.get('appWidth')
//         }
//       },
//       center: {
//         lat: 41.8359496, 
//         lng: -87.8317244
//       },
//       zoom: 14,
//       layers: {
//         heatmap: true,
//         points: true
//       },
//       geodataUrl: '/packages/symptomatic_covid19-on-fhir/geodata/illinois-epa-toxic-inventory-sites.geojson',
//       options: {
//         panControl: false,
//         mapTypeControl: false,
//         scrollwheel: false,
//         styles: [
//           {
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#f5f5f5"
//               }
//             ]
//           },
//           {
//             "elementType": "labels.icon",
//             "stylers": [
//               {
//                 "visibility": "off"
//               }
//             ]
//           },
//           {
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#616161"
//               }
//             ]
//           },
//           {
//             "elementType": "labels.text.stroke",
//             "stylers": [
//               {
//                 "color": "#f5f5f5"
//               }
//             ]
//           },
//           {
//             "featureType": "administrative.land_parcel",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#bdbdbd"
//               }
//             ]
//           },
//           {
//             "featureType": "poi",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#eeeeee"
//               }
//             ]
//           },
//           {
//             "featureType": "poi",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#757575"
//               }
//             ]
//           },
//           {
//             "featureType": "poi.park",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#e5e5e5"
//               }
//             ]
//           },
//           {
//             "featureType": "poi.park",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#9e9e9e"
//               }
//             ]
//           },
//           {
//             "featureType": "road",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#ffffff"
//               }
//             ]
//           },
//           {
//             "featureType": "road.arterial",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#757575"
//               }
//             ]
//           },
//           {
//             "featureType": "road.highway",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#dadada"
//               }
//             ]
//           },
//           {
//             "featureType": "road.highway",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#616161"
//               }
//             ]
//           },
//           {
//             "featureType": "road.local",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#9e9e9e"
//               }
//             ]
//           },
//           {
//             "featureType": "transit.line",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#e5e5e5"
//               }
//             ]
//           },
//           {
//             "featureType": "transit.station",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#eeeeee"
//               }
//             ]
//           },
//           {
//             "featureType": "water",
//             "elementType": "geometry",
//             "stylers": [
//               {
//                 "color": "#c9c9c9"
//               }
//             ]
//           },
//           {
//             "featureType": "water",
//             "elementType": "labels.text.fill",
//             "stylers": [
//               {
//                 "color": "#9e9e9e"
//               }
//             ]
//           }
//         ]
//       },
//       geoJsonLayer: Session.get('geoJsonLayer')
//     };

//     data.apiKey = get(Meteor, 'settings.public.google.maps.apiKey', '');
//     data.geodataUrl = get(Meteor, 'settings.public.google.maps.geodataUrl')

//     if(Session.get('geojsonUrl')){
//       data.geodataUrl = Session.get('geojsonUrl');
//     }

//     if(get(Meteor.user(), 'profile.locations.home.position.latitude') && get(Meteor.user(), 'profile.locations.home.position.longitude')){
//       data.center.lat = get(Meteor.user(), 'profile.locations.home.position.latitude');
//       data.center.lng = get(Meteor.user(), 'profile.locations.home.position.longitude');
//     }       
    

//     if(process.env.NODE_ENV === "test") {
//         console.log("GoogleMapsPage[data]", data);
//     }
//     return data;
//   }
//   render(){
//     var self = this;
//     var map;

//     var dataLayer = [];
//     let geoJsonLayer = this.data.geoJsonLayer;

//     if(Array.isArray(geoJsonLayer.features)){
//       console.log('Found an array of features to render.')
//       geoJsonLayer.features.forEach(function(datum){
//         if(get(datum, 'geometry.coordinates[0]') && get(datum, 'geometry.coordinates[1]')){
//           //dataLayer.push(new maps.LatLng(get(datum, 'geometry.coordinates[1]'), get(datum, 'geometry.coordinates[0]')));
//           dataLayer.push({
//             lat: get(datum, 'geometry.coordinates[1]'), 
//             lng: get(datum, 'geometry.coordinates[0]')
//           });
//         }
//       })
//     }

//     let heatMapData = {
//       options: {
//        radius: 50,
//        opacity: 0.5,
//        gradient: [
//          'rgba(255, 255, 255, 0)',
//          'rgba(251, 251, 213, 1)',
//          'rgba(249, 234, 189, 1)',
//          'rgba(247, 217, 165, 1)',
//          'rgba(243, 184, 118, 1)',
//          'rgba(242, 168, 94, 1)',
//          'rgba(240, 151, 71, 1)',
//          'rgba(238, 135, 47, 1)',
//          'rgba(236, 118, 23, 1)',
//          'rgba(210, 80, 0, 1)',
//        ]
//       },
//       positions: dataLayer
//     }
    
//     console.log('heatMapData', heatMapData)
//     if(process.env.NODE_ENV !== "test"){
//       map = <GoogleMapReact
//            id="googleMap"
//            defaultCenter={this.data.center}
//            defaultZoom={this.data.zoom}
//            options={this.data.options}
//            bootstrapURLKeys={{
//             key: this.data.apiKey,
//             libraries: 'visualization'
//            }}
//            heatmapLibrary={true}
//            heatmap={heatMapData}
//           //  yesIWantToUseGoogleMapApiInternals
//            onGoogleApiLoaded={function({map, maps}){


//             //----------------------------------------------------------------------------------------------------
//             // Diagnostics

//             if(process.env.NODE_ENV === "test"){
//                 console.log('maps', maps)
//                 console.log('map', map)
//             }
            
//             //----------------------------------------------------------------------------------------------------
//             // Layers

//             // let myLayers = new maps.MVCObject();
//             // myLayers.setValues({
//             //   hospitals: null,
//             //   laboratories: null,
//             //   patientHomes: map
//             // });

//             // let hospitalMarker = new google.maps.Marker({
//             //   map: map,
//             //   draggable: true,
//             //   // animation: google.maps.Animation.DROP,
//             //   position: {lat: 41.8955885, lng: -87.6208858}
//             // });
//             // hospitalMarker.bindTo('map', myLayers, 'parks');

//             // //show the hospitals
//             // myLayers.set('hospitals', map);

//             // //hide the laboratories
//             // myLayers.set('laboratories', null);

//             //----------------------------------------------------------------------------------------------------


//             // var dataLayer = [];

//             //   let geoJsonLayer = Session.get('geoJsonLayer');

//             //   if(Array.isArray(geoJsonLayer)){
//             //     console.log('Found an array of features to render.')
//             //     self.data.geoJsonLayer.features.forEach(function(datum){
//             //       if(get(datum, 'geometry.coordinates[0]') && get(datum, 'geometry.coordinates[1]')){
//             //         dataLayer.push(new maps.LatLng(get(datum, 'geometry.coordinates[1]'), get(datum, 'geometry.coordinates[0]')));
//             //       }
//             //     })
//             //   }

//             //   console.log('Constructed a COVID19 datalayer to render.', dataLayer)

//               console.log('Trying to render a COVID17 geojson layer.')
//               map.data.addGeoJson(self.data.geoJsonLayer, {idPropertyName:"_id"});      

//               // console.log('whatIsThis', whatIsThis)

//               // var heatmap = new maps.visualization.HeatmapLayer({
//               //   data: dataLayer,
//               //   map: map
//               // });

//               // heatmap.set('radius', 50);
//               // heatmap.set('opacity', 0.5);
//               // heatmap.set('gradient', [
//               //   'rgba(255, 255, 255, 0)',
//               //   'rgba(251, 251, 213, 1)',
//               //   'rgba(249, 234, 189, 1)',
//               //   'rgba(247, 217, 165, 1)',
//               //   'rgba(243, 184, 118, 1)',
//               //   'rgba(242, 168, 94, 1)',
//               //   'rgba(240, 151, 71, 1)',
//               //   'rgba(238, 135, 47, 1)',
//               //   'rgba(236, 118, 23, 1)',
//               //   'rgba(210, 80, 0, 1)',
//               // ]);

//               // heatmap.setMap(map);        
              
              
//               map.data.setStyle({
//                 // raw binary data (extremely fast!)
//                 icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAiklEQVR42mNgQIAoIF4NxGegdCCSHAMzEC+NUlH5v9rF5f+ZoCAwHaig8B8oPhOmKC1NU/P//7Q0DByrqgpSGAtSdOCAry9WRXt9fECK9oIUPXwYFYVV0e2ICJCi20SbFAuyG5uiECUlkKIQmOPng3y30d0d7Lt1bm4w301jQAOgcNoIDad1yOEEAFm9fSv/VqtJAAAAAElFTkSuQmCC',
    
//                 // load from a content delivery network
//                 // icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
  
//                 // load from Meteor server
//                 //icon: Meteor.absoluteUrl() + 'geodata/icons/purple-dot.png'
  
//                 // load from googleapis
//                 //icon: 'https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-a.png&text=A&psize=16&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1'
  
//                 // load a Symbol
//                 // icon: {
//                 //   path: maps.SymbolPath.CIRCLE,
//                 //   fillColor: '#EB6600',
//                 //   fillOpacity: 0.1,
//                 //   strokeColor: '',
//                 //   strokeWeight: 0.5,
//                 //   scale: 5
//                 // },
//                 fillColor: '#ffffff',
//                 fillOpacity: 0.2,
//                 strokeColor: '#EB6600',
//                 strokeWeight: 0.5
//               });

//             // } else {
//             //   console.log('Defaulting to the City of Chicago EPA toxic inventory.')
//             //   map.data.loadGeoJson(geodataUrl);

//             //   HTTP.get(geodataUrl, function(error, data){
//             //     var geojson = EJSON.parse(data.content);
//             //     if(process.env.NODE_ENV === "test"){
//             //       console.log('loadGeoJson', geojson);
//             //     }
//             //     geojson.features.forEach(function(datum){
//             //       if(get(datum, 'geometry.coordinates[0]') && get(datum, 'geometry.coordinates[1]')){
//             //         dataLayer.push(new maps.LatLng(get(datum, 'geometry.coordinates[1]'), get(datum, 'geometry.coordinates[0]')));
//             //       }
//             //     })

//             //     console.log('Constructed a datalayer to render.', dataLayer)

//             //     if(process.env.NODE_ENV === "test"){
//             //       console.log('dataLayer', dataLayer);
//             //     }

//             //     // map.data.loadGeoJson(geodataUrl);

//             //     // // load US state outline polygons from a GeoJson file
//             //     // map.data.loadGeoJson('https://storage.googleapis.com/mapsdevsite/json/states.js', { idPropertyName: 'STATE' });


//             //     // map.data.loadGeoJson(baseUrl + 'geodata/illinois-epa-toxic-inventory-sites.geojson');

//             //     // if we turn on the heatmap
//             //     var heatmap = new maps.visualization.HeatmapLayer({
//             //       data: dataLayer,
//             //       map: map
//             //     });

//             //     heatmap.set('radius', 50);
//             //     heatmap.set('opacity', 0.5);
//             //     heatmap.set('gradient', [
//             //       'rgba(255, 255, 255, 0)',
//             //       'rgba(251, 251, 213, 1)',
//             //       'rgba(249, 234, 189, 1)',
//             //       'rgba(247, 217, 165, 1)',
//             //       'rgba(243, 184, 118, 1)',
//             //       'rgba(242, 168, 94, 1)',
//             //       'rgba(240, 151, 71, 1)',
//             //       'rgba(238, 135, 47, 1)',
//             //       'rgba(236, 118, 23, 1)',
//             //       'rgba(210, 80, 0, 1)',
//             //     ]);
                
//             //     heatmap.setMap(map);
//             //   });
//             // }

//           }}
//          >            

//           {/* <div className='homeBox' lat={this.data.center.lat} lng={ this.data.center.lng} style={{width: '180px'}}>            
//             <MapOrbital />
//             <MapDot />
//           </div> */}          

//          </GoogleMapReact>;
//     } else {
//       console.log("NOTICE:  You are running in the 'test' environment.  Google Maps and other external libraries are disabled to prevent errors with the automated test runners.")
//     }
//     return(
//       <div id="mapsPage" style={this.data.style.page}>
//         {map}
//       </div>
//     );
//   }
// }

// ReactMixin(GoogleMapsPage.prototype, ReactMeteorData);
// export default GoogleMapsPage;