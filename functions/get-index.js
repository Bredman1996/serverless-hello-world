const fs = require('fs');
const Mustache = require("mustache");
const http = require("axios");
const aws4 = require("aws4");
const URL = require("url");

const restaurantsApiRoot = process.env.restaurants_api;
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;
const awsRegion = process.AWS_REGION;

const days = [
    'Sunday',
    'Monday',
    'Tuesday', 
    'Wednesday', 
    'Thursday', 
    'Friday', 
    'Saturday'
];

const template = fs.readFileSync('static/index.html', 'utf-8');

const getRestaurants = async () => {
    console.log(`loading restaurants from ${restaurantsApiRoot}...`);
    
    const url = URL.parse(restaurantsApiRoot);
    const opts = {
        host: url.hostname,
        path: url.pathname
    };

    aws4.sign(opts);

    const httpReq = await http.get(restaurantsApiRoot, {
        headers: opts.headers
    });
    return httpReq.data;
}

module.exports.handler = async (event, context) => {
    const restaurants = await getRestaurants();
    const dayOfWeek = days[new Date().getDay()];
    const view = {
        awsRegion,
        cognitoUserPoolId,
        cognitoClientId,
        dayOfWeek,
        restaurants,
        searchUrl: `${restaurantsApiRoot}/search`
    };
    const html = Mustache.render(template, view);
    return {
        statusCode: 200,
        headers: {
            'content-type': 'text/html; charset=UTF-8'
        },
        body: html
    };
}