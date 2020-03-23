# COVID19 Hackathon  

This package is related to the [Datavant Pandemic Response Hackathon](https://datavant.com/pandemic-response-hackathon/).


#### Design Documents  
The primary goal behind this hackathon is to stand up a COVID19 specific version of the Epidemiology on FHIR module, so we can map hospital EHR data onto Google Maps.  Primary workflow will look something like this:

- Query hospital FHIR compliant EHRs for COVID19 related LOINC and SNOMED codes.  
- Do patient demographic lookups with the received patient Ids to determine home addresses.  
- Geocode the home addresses into latitude/longitude, and assemble into a geojson file.  
- Display housing markers on Google Maps.  
- Display a heatmap on Google Maps.  

Secondary goals, include:  

- Beacon functionality to announce "I am quarantining at this location." or "I need assistance at this location".  
- Loading up static reference files, such as locations of hospitals and testing centers.    
- Proximity analysis for closest testing centers.  

Please read the following links for background design on this project:  

- [Epidemiology on FHIR Slidedeck](https://docs.google.com/presentation/d/1pHMpB_VmkfPz0a7hRyxeDX8HG9NzZyQCK7oLxAGMPFk/edit?usp=sharing)  
- [Cholera Mist - Errors in Mapmaking and Disease Theory](https://drive.google.com/open?id=0BwZijsCqmA-GUndDQmRRbGZVMzQ)  
- [Total Cost of Equipment Ownership - Achieving Greater Insight into Hospital Operating Costs](https://drive.google.com/file/d/0Bwzh7AfT-dKnTVdBNnE2emdyZUU/view?usp=sharing)  
- [Synthea Module for COVID19](https://github.com/synthetichealth/synthea/issues/679)  


#### Installation  
This project is best run on Macintosh with Chrome, and is intended to run on Linux servers in an AWS cloud environment.  Compiling to Docker is supported, but an advanced feature.

```
# install Meteor, if you don't already have it
# this is the build tool / compiler  
curl https://install.meteor.com/ | sh

# clone the Node on FHIR boilerplate
# this boilerplate is similar to WordPress
# and supports a plugin/package architecture
git clone https://github.com/symptomatic/node-on-fhir
cd node-on-fhir

# clone this package into the project
cd packages
git clone https://github.com/symptomatic/covid19-hackathon

# install dependencies
cd ..
meteor npm install

# run the application  
meteor run --extra-packages symptomatic:covid19-hackathon --settings packages/covid19-hackathon/configs/settings.covid19.maps.json  
```



#### Generating a synthetic dataset of COVID19 patients   

Please note that we are working with the [Covid19 branch](https://github.com/synthetichealth/synthea/tree/covid19) of the Synthea project.   

```
# download synthea
git clone https://github.com/PatientInsight/Synthea.git
cd synthea

# check out the covid19 branch
git checkout -b covid19
git pull origin covid19

# build the utility
./gradlew build check test

# edit the congestive_heart_failure module as needed
nano modules/covid19.json

# rebuild the utility with the updated modules
./gradlew build check test

# run synthea and create a few thousand test patients
./run_synthea -s 12345 -m *covid19* -p 1000 Illinois "Chicago"  
```


#### Set up a test server  

If you need a local FHIR server to test against, please see the [HAPI FHIR CLI tool](https://hapifhir.io/hapi-fhir/docs/tools/hapi_fhir_cli.html).    Requires Java.  
We also recommend the [smart-on-fhir/tag-uploader](https://github.com/smart-on-fhir/tag-uploader) utility to load SYnthea data into the HAPI FHIR server.   
And, of course, the [Postman](https://www.postman.com/) utility.

```
# install the hapi server (requires java)
brew install hapi-fhir-cli

# run the hapi server using DSTU2 
# most EHRs from 2015 include this supprot
hapi-fhir-cli run-server -v dstu2 -p 3100

# R4
hapi-fhir-cli run-server -v r4 -p 3100

# load the output directory into the HAPI server (DSTU3)
node index.js -d ../Synthea/output/fhir_dstu2/ -t 'more heartfailure patients' -w -S http://localhost:3100/baseDstu2/

# load the output directory into the HAPI server (R4)
node index.js -d ../Synthea/output/fhir/ -t 'more heartfailure patients' -w -S http://localhost:3100/baseR4/

# confirm that data is loaded correctly
curl http://localhost:8080/baseDstu2/Patient?_count=100
curl http://localhost:8080/baseDstu2/Encounter?_count=100

curl http://localhost:8080/baseR4/Patient?_count=100
curl http://localhost:8080/baseR4/Encounter?_count=100

```