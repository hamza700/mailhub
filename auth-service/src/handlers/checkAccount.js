import createError from 'http-errors';
import commonMiddleware from '../lib/commonMiddleware';
import cors from '@middy/http-cors';
import AWS from 'aws-sdk';
import { getIdFromToken } from '../lib/getIdFromToken';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkAccount(event, context) {
  const token = event.headers.Authorization.split(" ")[1];

  const id = await getIdFromToken(token);

  // const body = event.body;
  let userResult;

  const params = {
    TableName: process.env.ACCOUNT_DETAILS_TABLE_NAME,
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: {
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':id': id,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();

    userResult = result.Items;
  } catch (error) {
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(userResult),
  };
}

export const handler = commonMiddleware(checkAccount).use(cors());
