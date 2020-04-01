# COVID19 on FHIR Hackathon  

This project implements [HL7 SANER - Situation Awareness for Novel Epidemic Response](https://github.com/AudaciousInquiry/saner-ig), and was submitted to the [Datavant Pandemic Response Hackathon](https://datavant.com/pandemic-response-hackathon/) and the [MIT Covid19 Challenge](https://covid19challenge.mit.edu/).  

The COVID19 on FHIR project's primary purpose is to query FHIR servers for COVID19 related data. We support fetching conditions, procedures, medications, encounters, and devices, using LOINC and SNOMED codes identified by our network of collaborators.  

![CovidQueryPage](https://raw.githubusercontent.com/symptomatic/covid19-on-fhir/master/screenshots/Covid19Geocoding.png)

#### Prerequisites & Related Projects    
This project is intended to be used with the following platform libraries and projects:  

- [Meteor Javascript Framework](https://www.meteor.com/)  
- [Node on FHIR](https://github.com/symptomatic/node-on-fhir)  
- [Covid19 Geomapping](https://github.com/symptomatic/covid19-geomapping)  
- [Synthea - Covid19 Module](https://github.com/synthetichealth/synthea/issues/679)  


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
git clone https://github.com/symptomatic/covid19-geomapping

# install dependencies
cd ..
meteor npm install

# run the application  
meteor run --extra-packages symptomatic:covid19-on-fhir,symptomatic:covid19-geomapping --settings packages/covid19-on-fhir/configs/settings.covid19.maps.json  
```


#### Generating a synthetic dataset of COVID19 patients   

Please see the following documentation for synthetic patient data.

- [Synthea Module for COVID19](https://github.com/synthetichealth/synthea/issues/679)  
- [Synthea Pipeline Diagram - March20th](https://github.com/symptomatic/covid19-hackathon/blob/master/screenshots/Synthea-Pipeline-March20th.png)

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

#### FAQ  

_Who is your intended user?_  
We're following the data, and haven't applied security rules or roles yet.  I'm soliciting feedback and opinion on which to prioritize first, but am trying to keep the map reusable for a number of different use cases.   

The underlying mapping technology has applications for just about every stakeholder, but there seems to be particular need at the population health level (placement of testing centers, tracking overall spread), the field dispatch level (EMTs, police, social workers), and the individual patient levels.

Those are probably the 3 stakeholders we'll be focusing on.  There's a lot of overlap, though.  Similar to Radiology in that regard.  Who is the intended user of an X-Ray?  Well, anybody who has an interest.  People take their own learnings away from maps depending on their needs.  But the layers we add on obviously have specific interest groups.  

I'm probably going to lay down hospital markers first (for the Chicagoland area); then do patient address markers for COVID19 positive patients with synthetic data.  And then assess how we want to apply the security rules and roles access from there.    


_Do you have addresses of COVID 19 patients or would that be a HIPAA/privacy issue?_  
Yes, we can actually get to the addresses of COVID19 patients via FHIR.  They will be patients who have visited hospitals or drive through clinics and been part of the official health networks, rather than self-reported data.  But we can get to that data for the hackathon.  As for HIPAA, that use case will need to be installed with Provider Launch Context and run from a HIPAA zone (but we've already set our database up in one, and are preparing for that).  We were initially worried that we would need to bounce data through Google geocoding servers to map addresses into latitude/longitude (which we will probably do with the online demo and synthetic data), but we have a lead on a docker image of a geocoding server that we can run from within our own HIPAA zone.  So, full steam ahead with COVID19 patient address data in a HIPAA compliant manner.  

_What do you mean by testing sites?_
When we talk testing sites, we are generally discussing the work involved in setting up drive-through testing sites.  [CVS is hiring something like 50,000 workers right now](https://www.linkedin.com/posts/suemedina_cvs-health-to-provide-bonuses-add-benefits-activity-6647831289669971968-TDfL), and the way this pandemic is going, we're likely to wind up having a drive-through testing center in ever CVS, Walgreens, and Walmart parking lot.    That lends itself to a structural map layer, and knowing where testing sites are and are not will help in routing patients to the closest one in early and later phases of the pandemic.  Further in the pandemic cycle, we will want to know where to put testing centers when hotspots crop up.  There will be gaps in geospatial coverage (pandemics are population density based, and geospatial in nature).  

Update (courtesy Andrea Pitkus, PhD, MLS):  Currently, drive through testing isn't a COVID-19 testing center.  It is a Drive Through Specimen Collection Center, and the specimens are sent to a a CLIA certified (or NY or WA compliant) laboratory which performs these moderate to high complexity tests with trained laboratory professionals.  Some of the testing centers are clear across the county.  It depends on with which the testing collection sites have their contracts.  

For example, Walgreens is contracted with LabCorp, so it  could be sent to NC or performed at a closer LabCorp laboratory.  They could also contract with NorthShore University Health System as they are performing testing in your area.  Walmart and CVS have contracts with Quest Diagnostics, so those may be sent to the Wooddale, IL facility performing COVID-19 testing for the upper Midwest.  If state/government entities are setting up these sites, they may be performed by state public health labs.   



#### References  
- [CDC - ICD10 Codes](https://www.cdc.gov/nchs/data/icd/ICD-10-CM-Official-Coding-Gudance-Interim-Advice-coronavirus-feb-20-2020.pdf)  
- [HL7 FHIR - COVID19 LOINC Value Set](https://chat.fhir.org/user_uploads/10155/tQQtv3GQZhC3DRmMgk59o7ly/ValueSet-covid-19-obs.json)  
- [HL7 FHIR - COVID19 SNOMED Value Set](https://confluence.ihtsdotools.org/display/snomed/SNOMED%2BCT%2BCoronavirus%2BContent)  
- [Characteristics From the Coronavirus Disease 2019 (COVID-19) Outbreak in China](https://jamanetwork.com/journals/jama/fullarticle/2762130?guestAccessKey=bdcca6fa-a48c-4028-8406-7f3d04a3e932&utm_source=For_The_Media&utm_medium=referral&utm_campaign=ftm_links&utm_content=tfl&utm_term=022420)  
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
- [COVID-19 Patient Impact & Hospital Capacity Module](https://www.cdc.gov/nhsn/acute-care-hospital/covid19/index.html)  

#### Team Acknowledgements  
- Jason Walonoski, _Bioinformatics_ (Synthea)
- James Agnew, _FHIR Hosting_ (Smile CDR)
- Chris Hafey, _DBA Backup, Business Administration_, (Fomerly Nucleus.io)  
- Andrei Rusu, _Quality Control_, (Nightwatch.js)     
- Jae Brodsky, _Statistician_  
- Sarah Sims, _Business Administration_   
- David Donohue, _Medical Advisory Board_  

#### Acknowledgements (Product Development, Review, & Early Testing)    
- Ken Salyards (SAMSHA, Health and Human Services)  
- Andrea Pitkus, PhD, MLS, (UW School of Medicine and Public Health)  
- Viet Nguyen, MD, (Board Member at Health Level Seven International)   
- Brett Johnson (Personalized Medicine Strategic Planning)   
- Mohit Saigal (Customer Focused IT and PM Leader)  
- Brian Jackson (Academic Clinical Pathologist)  
- Russell Hamm (Evangalist)  
- Rex Stock (Evangalist)  
 
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

