const DocClient = require('aws-sdk/clients/dynamodb').DocumentClient;
const dynamodb = new DocClient();
const middy = require("@middy/core");
const ssm = require("@middy/ssm");
const Log = require("@dazn/lambda-powertools-logger");
const wrap = require('@dazn/lambda-powertools-pattern-basic')

const { serviceName, stage } = process.env;
const tableName = process.env.restaurants_table;

const findRestaurantsByTheme = async (theme, count) => {
    Log.debug('searching restaurants by theme', {
        tableName,
        count
    });
    const req = {
        TableName: tableName,
        Limit: count,
        FilterExpression: "contains(themes, :theme)",
        ExpressionAttributeValues: {":theme": theme}
    };

    const resp = await dynamodb.scan(req).promise();
    Log.debug('found restaurants', {count: resp.Items.length});
    return resp.Items;
};

module.exports.handler = wrap(async (event, context) => {
    const req = JSON.parse(event.body);
    const theme = req.theme;
    const restaurants = await findRestaurantsByTheme(theme, context.config.defaultResults);
    return {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    };
}).use(ssm({
    cache: true,
    cacheExpiry: 1 * 60 * 1000,
    setToContext: true,
    fetchData: {
        config: `/${serviceName}/${stage}/search-restaurants/config`,
        secretString: `/${serviceName}/${stage}/search-restaurants/secretString`
    }
}));