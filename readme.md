#COVID19 Hackathon

This package is related to the [Datavant Pandemic Response Hackathon](https://datavant.com/pandemic-response-hackathon/).


#### Design Documents  
Please read the following links for background design on this project:  

- [Epidemiology on FHIR Slidedeck](https://docs.google.com/presentation/d/1pHMpB_VmkfPz0a7hRyxeDX8HG9NzZyQCK7oLxAGMPFk/edit?usp=sharing)  
- [Cholera Mist - Errors in Mapmaking and Disease Theory](https://drive.google.com/open?id=0BwZijsCqmA-GUndDQmRRbGZVMzQ)  
- [Total Cost of Equipment Ownership - Achieving Greater Insight into Hospital Operating Costs](https://drive.google.com/file/d/0Bwzh7AfT-dKnTVdBNnE2emdyZUU/view?usp=sharing)  


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




