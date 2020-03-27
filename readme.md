# COVID19 on FHIR Hackathon  

This package is related to the [Datavant Pandemic Response Hackathon](https://datavant.com/pandemic-response-hackathon/).

We have already completed the following data fetching utility, which queries FHIR compliant EHRs for COVID19 related LOINC and SNOMED codes.
![CovidQueryPage](https://raw.githubusercontent.com/symptomatic/covid19-hackathon/master/screenshots/CovidQueryPage.png)


Update:  We've now enabled Google Maps.  This is the canvas we are working, and making available.  Please contact us with any hospital or community public health geomapping needs.  
![CovidQueryPage](https://raw.githubusercontent.com/symptomatic/covid19-hackathon/master/screenshots/Covid19-RawMap.png)

For the remainder of the hackathon, we will be creating a heatmap like the following, to display where COVID19 outbreaks are occuring.  We intend to support housing level mapping of COVID19 data, and make this available to hospitals via the EHR app stores.
![FHIR Heatmap](https://raw.githubusercontent.com/symptomatic/covid19-on-fhir/master/design/food-desert-heatmap.jpg)  

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
- [Synthea Pipeline Diagram - March20th](https://github.com/symptomatic/covid19-hackathon/blob/master/screenshots/Synthea-Pipeline-March20th.png)

#### Use Cases  



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
git clone https://github.com/symptomatic/covid19-on-fhir

# install dependencies
cd ..
meteor npm install

# run the application  
meteor run --extra-packages symptomatic:covid19-on-fhir --settings packages/covid19-on-fhir/configs/settings.covid19.maps.json  
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

# load the output directory into the HAPI server (DSTU2 / STU3)
node index.js -d ../Synthea/output/fhir_dstu2/ -t 'something covid releated' -w -S http://localhost:3100/baseDstu2/

# load the output directory into the HAPI server (R4)
node index.js -d ../Synthea/output/fhir/ -t 'something covid releated' -w -S http://localhost:3100/baseR4/

# confirm that data is loaded correctly
curl http://localhost:8080/baseDstu2/Patient?_count=100
curl http://localhost:8080/baseDstu2/Encounter?_count=100

curl http://localhost:8080/baseR4/Patient?_count=100
curl http://localhost:8080/baseR4/Encounter?_count=100

```

#### References  
- [CDC - ICD10 Codes](https://www.cdc.gov/nchs/data/icd/ICD-10-CM-Official-Coding-Gudance-Interim-Advice-coronavirus-feb-20-2020.pdf)  
-[HL7 FHIR - COVID19 LOINC Value Set](https://chat.fhir.org/user_uploads/10155/tQQtv3GQZhC3DRmMgk59o7ly/ValueSet-covid-19-obs.json)  
[HL7 FHIR - COVID19 SNOMED Value Set](https://confluence.ihtsdotools.org/display/snomed/SNOMED%2BCT%2BCoronavirus%2BContent)  
- [Characteristics From the Coronavirus Disease 2019 (COVID-19) Outbreak in China
9 charts that explain the coronavirus pandemic](https://jamanetwork.com/journals/jama/fullarticle/2762130?guestAccessKey=bdcca6fa-a48c-4028-8406-7f3d04a3e932&utm_source=For_The_Media&utm_medium=referral&utm_campaign=ftm_links&utm_content=tfl&utm_term=022420)  
- [Merk Manual - Overview of Mechanical Ventilation](https://www.merckmanuals.com/professional/critical-care-medicine/respiratory-failure-and-mechanical-ventilation/overview-of-mechanical-ventilation)    
- [WHO Now Officially Recommends to Avoid Taking Ibuprofen For COVID-19 Symptoms](https://www.sciencealert.com/who-recommends-to-avoid-taking-ibuprofen-for-covid-19-symptoms?fbclid=IwAR1OSm9RDEyax2bpeTagBbJpNfCfXQEJUVSpvr0HQQhVc_6vm9jTdZRWUTk)    
- [Are patients with hypertension and diabetes mellitus at increased risk for COVID-19 infection?](https://www.thelancet.com/journals/lanres/article/PIIS2213-2600(20)30116-8/fulltext) 
- [People with blood type A may be more vulnerable to coronavirus](https://www.scmp.com/news/china/society/article/3075567/people-blood-type-may-be-more-vulnerable-coronavirus-china-study?fbclid=IwAR3BOAAY2u4AOgb9jtFYT5vxV8HaOEmNgsRq-sgM5T_poKF_JRa6OdoWzO0)  
- [Hydroxychloroquine and azithromycin as a treatment of COVID-19](https://www.mediterranee-infection.com/wp-content/uploads/2020/03/Hydroxychloroquine_final_DOI_IJAA.pdf?fbclid=IwAR3A5tbNB49G8cNd5VprVhjnaO_j7Xx40euWEdmHaMGdcRxG1UoKWYQLu6Y)  
- [Azithromycin induces anti-viral effects in cultured bronchial epithelial cells from COPD patients](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4923851/?fbclid=IwAR3H41tJ6zKmHueqqeqdlUKSMyjQKu8XXqusywdcp_06EXJOYebCd5P-kDU)    
- [Clinical Pathways from the University of Chicago Medicine](https://hdsi.uchicago.edu/uchicago-medicine-covid-19-pathways/)  
- [COVID-19: Adult Ambulatory Clinics](https://hdsi.uchicago.edu/wp-content/uploads/2020/03/2020-03-24-AgileMD-_-COVID-19_-Ambulatory-Clinics.pdf)    
- [COVID-19: Adult ED](https://hdsi.uchicago.edu/wp-content/uploads/2020/03/2020-03-24-AgileMD-_-COVID-19_-Adult-ED.pdf)    
- [COVID-19: Adult Inpatient](https://hdsi.uchicago.edu/wp-content/uploads/2020/03/2020-03-24-AgileMD-_-COVID-19_-Adult-Inpatient.pdf)    
- [COVID-19: Adult Respiratory Failure and Cardiac Arrest](https://hdsi.uchicago.edu/wp-content/uploads/2020/03/2020-03-24-AgileMD-_-COVID-19_-Adult-Respiratory-Failure-and-Cardiac-Arrest.pdf)  



#### A Prayer for Health Care Workers  

May the One who blessed our ancestors
Bless all those who put themselves at risk to care for the sick
Physicians and nurses and orderlies
Technicians and home health aides
EMTs and pharmacists
(And bless especially _______)
Who navigate the unfolding dangers of the world each day,
To tend to those they have sworn to help.
Bless them in their coming home and bless them in their going out.
Ease their fear. Sustain them.
Source of all breath, healer of all beings,
Protect them and restore their hope.
Strengthen them, that they may bring strength;
Keep them in health, that they may bring healing.
Help them know again a time when they can breathe without fear.
Bless the sacred work of their hands.
May this plague pass from among us, speedily and in our days.

- Rabbi Ayelet Cohen, March 2020