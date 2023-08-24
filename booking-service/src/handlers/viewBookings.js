import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import { getIdFromToken } from '../lib/getIdFromToken';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function viewBookings(event, context) {
  const token = event.headers.Authorization.split(" ")[1];
  const queryName = event.queryStringParameters.name;

  const id = await getIdFromToken(token);

  let details;

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
    console.log(result);

    details = result.Items;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  const accessCode = details[0].accessCode;
  console.log(accessCode);

  let booking;

  const params1 = {
    TableName: process.env.BOOKINGS_TABLE_NAME,
    IndexName: 'accessCode',
    KeyConditionExpression: '#accessCode = :accessCode',
    ExpressionAttributeNames: {
      '#accessCode': 'accessCode',
    },
    ExpressionAttributeValues: {
      ':accessCode': accessCode,
    },
  };
  try {
    const result = await dynamodb.query(params1).promise();
    console.log(result);

    booking = result.Items;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  let filteredBookings;
  queryName
    ? (filteredBookings = booking.filter(({ name }) => name == queryName))
    : (filteredBookings = booking);

  if (filteredBookings.length == 0) {
    throw new createError.NotFound(
      `Bookings with name "${queryName}" not found!`
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify(filteredBookings),
  };
}

export const handler = commonMiddleware(viewBookings).use(cors());
