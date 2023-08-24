import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import axios from 'axios';
import crypto from 'crypto';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function ratesAPI(event, context) {
  const { startDate, endDate, room, guest, hotelCode, hotelName } = event.body;

  console.log(startDate, endDate, room, guest, hotelCode);

  const hash = crypto.createHash('sha256');
  const encryption =
    process.env.APITUDE_APIKEY +
    process.env.APITUDE_SECRET +
    Math.floor(Date.now() / 1000);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Api-key': process.env.APITUDE_APIKEY,
      'X-Signature': `${hash.update(encryption).digest('hex')}`,
    },
  };

  const params = {
    stay: {
      checkIn: startDate,
      checkOut: endDate,
    },
    occupancies: [
      {
        rooms: Number(room),
        adults: Number(guest),
        children: 0,
      },
    ],
    hotels: {
      hotel: [Number(hotelCode)],
    },
  };

  let rates;

  try {
    const res = await axios.post(
      `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
      params,
      config
    );

    rates = res.data.hotels.hotels;
    console.log(res.data);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  let details;

  const params1 = {
    TableName: process.env.HOTELS_CONTENT_TABLE_NAME,
    KeyConditionExpression: '#name = :name',
    ExpressionAttributeNames: {
      '#name': 'name',
    },
    ExpressionAttributeValues: {
      ':name': hotelName,
    },
  };
  try {
    let result = await dynamodb.query(params1).promise();
    details = result.Items;

    console.log(details);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  const info = { ...details[0], ...rates[0] };

  return {
    body: JSON.stringify([info]),
    statusCode: 200,
  };
}

export const handler = commonMiddleware(ratesAPI).use(cors());
