import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
// import bcrypt from 'bcryptjs';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import { getIdFromToken } from '../lib/getIdFromToken';
// import validator from '@middy/validator';
// import addFlightSchema from '../lib/schemas/addFlightSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function addBooking(event, context) {
  const {
    // token,
    name,
    passportNumber,
    bookingReference,
    type,
  } = event.body;
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

  // let booking;

  // if (event.body.bookingId) {
  //   let bookingId = event.body.bookingId;
  //   const params1 = {
  //     TableName: process.env.BOOKINGS_TABLE_NAME,
  //     KeyConditionExpression: '#bookingId = :bookingId',
  //     ExpressionAttributeNames: {
  //       '#bookingId': 'bookingId',
  //     },
  //     ExpressionAttributeValues: {
  //       ':bookingId': bookingId,
  //     },
  //   };
  //   try {
  //     const result = await dynamodb.query(params1).promise();
  //     console.log(result);

  //     booking = result.Items;
  //   } catch (error) {
  //     console.log(error);
  //     throw new createError.InternalServerError(error);
  //   }
  // }

  // const prevType = booking[0].type;
  // const type = prevType + ',' + event.body.type;

  let bookingId;
  event.body.bookingId
    ? (bookingId = event.body.bookingId)
    : (bookingId = uuid());

  let departureDate;
  event.body.departureDate && (departureDate = event.body.departureDate);
  //  : (departureDate = booking[0].departureDate);

  let returnDate;
  event.body.returnDate && (returnDate = event.body.returnDate);
  //  : (returnDate = booking[0].returnDate);

  let checkInDate;
  event.body.checkInDate && (checkInDate = event.body.checkInDate);
  // : (checkInDate = booking[0].checkInDate);

  let checkOutDate;
  event.body.checkOutDate && (checkOutDate = event.body.checkOutDate);
  // : (checkOutDate = booking[0].checkOutDate);

  let airline;
  event.body.airline && (airline = event.body.airline);
  // : (airline = booking[0].airline);

  let hotelName;
  event.body.hotelName && (hotelName = event.body.hotelName);
  // : (hotelName = booking[0].hotelName);

  const booking1 = {
    bookingId,
    name,
    passportNumber,
    departureDate,
    returnDate,
    checkInDate,
    checkOutDate,
    airline,
    hotelName,
    bookingReference,
    accessCode,
    type,
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.BOOKINGS_TABLE_NAME,
        Item: booking1,
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(booking1),
  };
}

export const handler = commonMiddleware(addBooking)
  // .use(validator({ inputSchema: addFlightSchema }))
  .use(cors());
