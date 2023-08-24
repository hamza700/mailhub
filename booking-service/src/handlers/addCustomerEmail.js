// import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
// import bcrypt from 'bcryptjs';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import { getIdFromToken } from '../lib/getIdFromToken';
// import validator from '@middy/validator';
// import addFlightSchema from '../lib/schemas/addFlightSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function addCustomerEmail(event, context) {
  const { email, reference } = event.body;
  // const { email } = event.requestContext.authorizer;
  const token = event.headers.Authorization.split(' ')[1];
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
    console.log(details);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  const accessCode = details[0].accessCode;

  let booking;

  const params1 = {
    TableName: process.env.BOOKINGS_TABLE_NAME,
    IndexName: 'reference',
    KeyConditionExpression: '#reference = :reference',
    ExpressionAttributeNames: {
      '#reference': 'reference',
    },
    ExpressionAttributeValues: {
      ':reference': reference,
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

  let bookingId = booking[0].bookingId;

  // let booking;

  const params2 = {
    TableName: process.env.BOOKINGS_TABLE_NAME,
    Key: { bookingId: bookingId },
    UpdateExpression:
      'set #customerEmail = :customerEmail, #accessCode = :accessCode',
    ExpressionAttributeNames: {
      '#customerEmail': 'customerEmail',
      '#accessCode': 'accessCode',
    },
    ExpressionAttributeValues: {
      ':customerEmail': email,
      ':accessCode': accessCode,
    },
  };
  try {
    const result = await dynamodb.update(params2).promise();
    console.log(result);

    booking = result.Items;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(booking),
  };
}

export const handler = commonMiddleware(addCustomerEmail)
  // .use(validator({ inputSchema: addFlightSchema }))
  .use(cors());
