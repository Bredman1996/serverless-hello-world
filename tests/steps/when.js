const mode = process.env.TEST_MODE;

const APP_ROOT = "../../";
const _ = require("lodash");
const aws4 = require('aws4');
const URL = require('url');
const http = require('axios');

const viaHandler = async (event, functionName)=> {
    const handler = require(`${APP_ROOT}/functions/${functionName}`).handler;

    const context = {};

    const response = await handler(event, context);
    const contentType = _.get(response, 'headers.content-type', 'application/json');
    if(response.body && contentType == 'application/json'){
        response.body = JSON.parse(response.body);
    }
    return response;
}

const respondFrom = (httpRes) => ({
    statusCode: httpRes.status,
    body: httpRes.data,
    headers: httpRes.headers
});

const signHttpRequest = (url) => {
    const urlData = URL.parse(url);
    const opts = {
        host: urlData.hostname,
        path: urlData.pathname
    };

    aws4.sign(opts);
    return opts.headers;
};

const viaHttp = async (relPath, method, opts) => {
    const url = `${process.env.rest_api_url}/${relPath}`;
    console.log(`invoke via HTTP ${method} ${url}`);
    try{
        const data = _.get(opts, "body");
        let headers = {};
        if(_.get(opts, "iam_auth", false) === true){
            headers = signHttpRequest(url);
        }
        
        const authHeader = _.get(opts, "auth");
        if(authHeader){
            headers.Authorization = authHeader;
        }
        
        const httpReq = http.request({
            method, url, headers, data
        });
        
        const res = await httpReq;
        return respondFrom(res);
    }catch(err){
        if(err.status){
            return {
                statusCode: err.status,
                headers: err.response.headers
            };
        }else{
            throw err;
        }
    }
};

const invoke = async (event, functionName, path, method, opts) => {
    switch(mode){
        case 'handler':
            return await viaHandler(event, functionName);
        case 'http':
            return await viaHttp(path, method, opts);
        default:
            throw new Error(`unsupported mode: ${mode}`);
    }
}



const we_invoke_get_index = async () => await invoke({}, 'get-index', '', 'GET');

const we_invoke_get_restaurants = async () => await invoke({}, 'get-restaurants', 'restaurants', 'GET', { iam_auth: true }); 


const we_invoke_search_restaurants = async (theme, user) => {
    const body = JSON.stringify({ theme });
    const auth = user.idToken;
    return await invoke({ body }, 'search-restaurants', 'restaurants/search', 'POST', { body, auth });
}

module.exports = {
    we_invoke_get_index,
    we_invoke_get_restaurants,
    we_invoke_search_restaurants
};