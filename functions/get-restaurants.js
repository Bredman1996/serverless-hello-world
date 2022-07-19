const docClient = require("aws-sdk/clients/dynamodb").DocumentClient;
const dynamoDb = new docClient();

const defaultResults = process.env.defaultResults || 8;
const tableName = process.env.restaurants_table;

const getRestaurants = async (count) => {
    const req = {
        TableName: tableName,
        Limit: count
    };

    const resp = await dynamoDb.scan(req).promise();
    return resp.Items;
}

module.exports.handler = async (event, context) => {
    const restaurants = await getRestaurants(defaultResults);
    const response = {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    };
    return response;
};