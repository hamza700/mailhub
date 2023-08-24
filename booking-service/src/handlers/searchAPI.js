import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function searchAPI(event, context) {
  const { destination, country } = event.body;

  console.log(destination);

  let ExclusiveStartKey;

  const params = {
    TableName: process.env.HOTELS_INFO_TABLE_NAME,
    ExclusiveStartKey,
    KeyConditionExpression: '#type = :type',
    FilterExpression: '#destination = :destination AND #country = :country',
    ExpressionAttributeNames: {
      '#type': 'type',
      '#destination': 'name',
      '#country': 'isoCode',
    },
    ExpressionAttributeValues: {
      ':type': 'destination',
      ':destination': {
        content: destination.toUpperCase(),
      },
      ':country': country,
    },
  };

  let destinationCode;

  try {
    let result;
    let lastEvaluatedKey = 'dummy'; // string must not be empty
    while (lastEvaluatedKey) {
      result = await dynamodb.query(params).promise();
      console.log(result);
      if (result.Items.length != 0) {
        destinationCode = result.Items[0].code;
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
    }

    console.log(destinationCode);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  let details;

  const params1 = {
    TableName: process.env.HOTELS_CONTENT_TABLE_NAME,
    IndexName: 'destinationCode',
    KeyConditionExpression: '#destinationCode = :destinationCode',
    ExpressionAttributeNames: {
      '#destinationCode': 'destinationCode',
    },
    ExpressionAttributeValues: {
      ':destinationCode': destinationCode,
    },
  };
  try {
    let result = await dynamodb.query(params1).promise();
    details = result.Items;

    let lastEvaluatedKey = result.LastEvaluatedKey;
    while (lastEvaluatedKey && details.length <= 50) {
      params1.ExclusiveStartKey = lastEvaluatedKey;
      result = await dynamodb.query(params1).promise();
      details.push(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
    }
    console.log(details.length);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    body: JSON.stringify(details),
    statusCode: 200,
  };
}

export const handler = commonMiddleware(searchAPI).use(cors());
