const docClient = require("aws-sdk/clients/dynamodb").DocumentClient;
const dynamoDb = new docClient();
const middy = require("@middy/core");
const ssm = require("@middy/ssm");

const { serviceName, stage } = process.env;
const tableName = process.env.restaurants_table;


const getRestaurants = async (count) => {
    const req = {
        TableName: tableName,
        Limit: count
    };

    const resp = await dynamoDb.scan(req).promise();
    return resp.Items;
}

module.exports.handler = middy(async (event, context) => {
    const restaurants = await getRestaurants(context.config.defaultResults);
    const response = {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    };
    return response;
}).use(ssm({
    cache: true,
    cacheExpiry: 1 * 60 * 1000,
    setToContext: true,
    fetchData:{
        config: `/${serviceName}/${stage}/get-restaurants/config`
    }
}));