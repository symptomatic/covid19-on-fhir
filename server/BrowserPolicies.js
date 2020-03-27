import { Meteor } from 'meteor/meteor';

Meteor.startup(function (){
    if(Package['browser-policy-common']){
        import { BrowserPolicy } from 'meteor/browser-policy-common';

        BrowserPolicy.content.allowSameOriginForAll();
        BrowserPolicy.content.allowDataUrlForAll()
        BrowserPolicy.content.allowOriginForAll('self');
        BrowserPolicy.content.allowObjectOrigin( 'self' )
        BrowserPolicy.content.allowOriginForAll('meteor.local');
        BrowserPolicy.content.allowOriginForAll('cdnjs.cloudflare.com');
        BrowserPolicy.content.allowOriginForAll('*.google.com');
        BrowserPolicy.content.allowOriginForAll('*.googleapis.com');
        BrowserPolicy.content.allowFontOrigin( 'fonts.gstatic.com' )
    
        BrowserPolicy.content.allowOriginForAll('data.cityofchicago.org');
        
        BrowserPolicy.content.allowEval();
        BrowserPolicy.content.allowInlineScripts()
        BrowserPolicy.content.allowInlineStyles()
        
        BrowserPolicy.content.allowImageOrigin("*")     
    }
});