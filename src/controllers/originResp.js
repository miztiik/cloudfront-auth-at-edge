/**
 * @author  miztiik@github
 */
'use strict';
exports.handler = async function(event, context, callback) {
    
function add(h, k, v) {
        h[k.toLowerCase()] = [
            {
                key: k,
                value: v
            }
        ];
    }


//Get contents of Request
const request = event.Records[0].cf.request;
//Get contents of response
const response = event.Records[0].cf.response;
const headers = response.headers;

console.log("OriginRequest: %j", request);


if (headers['cloudfront-viewer-country']) {
    const countryCode = headers['cloudfront-viewer-country'][0].value;
    console.log("Viewer-country: %j", countryCode);
}


//Set new headers
headers['strict-transport-security'] = [{key: 'Strict-Transport-Security', value: 'max-age= 63072000; includeSubdomains; preload'}]; 

 
// Reduce XSS risks
add(headers, "X-Content-Type-Options", "nosniff");
add(headers, "X-XSS-Protection", "1; mode=block");
add(headers, "X-Frame-Options", "DENY");

add(headers, "Referrer-Policy", "same-origin");

// Custom Headers
add(headers, "Custom-Origin-Headers", "Mystique-Added-At-Origin-Response");

//Return modified response
/*
console.log("ResponsePostProcessing: %j", response);
console.log("RequestPostProcessing: %j", request);
*/

console.log("OriginResponse: %j", response);

//Return modified response
callback(null, response);

};