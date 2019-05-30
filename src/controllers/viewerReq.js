/**
 * @author  miztiik@github
 */

 //https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html

'use strict';
const querystring = require('querystring');

function parseCookies(headers) {
    const parsedCookie = {};
    if (headers.cookie) {
        headers.cookie[0].value.split(';').forEach((cookie) => {
            if (cookie) {
                const parts = cookie.split('=');
                parsedCookie[parts[0].trim()] = parts[1].trim();
            }
        });
    }
    return parsedCookie;
}

exports.handler = (event, context, callback) => {
    console.log("Viewer Request Event Called");
    console.log("ViewerRequestEvent: %j", event);
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;
    const headers = request.headers;

    /* Check for session-id in request cookie in viewer-request event,
     * if session-id is absent, redirect the user to sign in page with original
     * request sent as redirect_url in query params.
     */

    /* Check for session-id in cookie, if present then proceed with request */
    const parsedCookies = parseCookies(headers);
    if (parsedCookies && parsedCookies['session-id']) {
        callback(null, request);
    } else if ( request.method == "POST") {       
        // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html#lambda-examples-access-request-body-examples
        console.log("Unpacking Body Data");
        /* HTTP body is always passed as base64-encoded string. Decode it. */
        const body = Buffer.from(request.body.data, 'base64').toString();
        /* HTML forms send the data in query string format. Parse it. */
        const params = querystring.parse(body);

        let uid='', pass=''
        for (let key of Object.keys(params)) {
            if ( key.trim() == 'userId' && params[key] !== '') {
              uid = params[key]
            }
            if ( key.trim() == 'pwd' && params[key] !== '') {
              pass = params[key]
            }
        }

        if (uid !== '' && pass !== ''){

            /* URI encode the original request to be sent as redirect_url in query params */
            /*
            const encodedRedirectUrl = encodeURIComponent(`https://${headers.host[0].value}${request.uri}?${request.querystring}`);
            const response = {
                status: '302',
                statusDescription: 'Found',
                headers: {
                    location: [{
                        key: 'Location',
                        value: `http://www.example.com/signin?redirect_url=${encodedRedirectUrl}`,
                    }],
                },
            };
            */

           var authenticationData = {
            Username : 'username',
            Password : 'password',
            };
            var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
            var poolData = { UserPoolId : 'us-east-1_TcoKGbf7n',
                ClientId : '4pe2usejqcdmhi0a25jp4b5sh3'
            };
            var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            var userData = {
                Username : 'username',
                Pool : userPool
            };
            var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    var accessToken = result.getAccessToken().getJwtToken();
                    
                    /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/
                    var idToken = result.idToken.jwtToken;
                },
            
                onFailure: function(err) {
                    alert(err);
                },
            
            });



            /*
            * Generate HTTP redirect response with 302 status code and Location header.
            */
            const response = {
                status: '302',
                statusDescription: 'Found',
                headers: {
                    location: [{
                        key: 'Location',
                        value: '/home.html',
                    }],
                },
            };
            response.body = '';
            console.log("ViewerResponseEvent: %j", response);
            callback(null, response);
          }
    } else{
    callback(null, request);
    }
};