const fs = require('fs');
const Mustache = require("mustache");
const http = require("axios");
const aws4 = require("aws4");
const URL = require("url");
const Log = require('@dazn/lambda-powertools-logger');

const restaurantsApiRoot = process.env.restaurants_api;
const ordersApiRoot = process.env.orders_api;
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
    Log.debug(`getting restaurants...`, { url: restaurantsApiRoot });
    
    const url = URL.parse(restaurantsApiRoot);
    const opts = {
        host: url.hostname,
        path: url.pathname
    };

    aws4.sign(opts);

    const httpReq = await http.get(restaurantsApiRoot, {
        headers: opts.headers
    });
    let restaurants = httpReq.data;
    Log.debug('got restaurants', { count: restaurants.length });
    return restaurants;
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
        searchUrl: `${restaurantsApiRoot}/search`,
        placeOrderUrl: ordersApiRoot
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