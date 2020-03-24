

FhirUtilities = {
  pluckReferenceId(reference){
    let identifier = ""
    let referenceParts = [];
    if(reference){
      // split the string apart according to slashes
      referenceParts = reference.split("/");

      // get the last part of the string
      identifier = referenceParts[referenceParts.length - 1];  
    }
    return identifier;
  },
  generateDateQuery(chainPrefix, startDate, endDate ){
    let dateQuery = '';

    if(chainPrefix){
      dateQuery = chainPrefix;
    }
    if(startDate){
      dateQuery = dateQuery + 'date=gt' + startDate
    }
    if(startDate && endDate){
      dateQuery = dateQuery + '&';
    }
    if(chainPrefix){
      dateQuery = dateQuery + chainPrefix;
    }

    if(endDate){
      dateQuery = dateQuery + 'date=lt' + endDate
    }
    if(startDate || endDate){
      dateQuery = dateQuery;
    }
 
    return dateQuery;
  }
}

export default FhirUtilities;