import AWS from 'aws-sdk';
import createError from 'http-errors';
import axios from 'axios';
import crypto from 'crypto';
// import bcrypt from 'bcryptjs';
// import commonMiddleware from '../lib/commonMiddleware';
// import createError from 'http-errors';
// import validator from '@middy/validator';
// import cors from '@middy/http-cors';
// import jwt from 'jsonwebtoken';
// import { forgotPasswordEmail } from '../lib/forgotPasswordEmail';
// import fs from 'fs';
// const path = require('path');

// import Handlebars from 'handlebars';
// const fs = require('fs');
// const fsPromises = fs.promises;
// const Handlebars = require('handlebars');

// AWS
const ses = new AWS.SES({ region: 'eu-west-1' }); // Simple email service

/**
 * Generate a reset password token and send email to the user
 * @param {*} event body.email - required
 * @param {*} res
 */
async function sendHotelOffers(event, context) {
  // console.log(forgotPasswordEmail);
  const {
    destination,
    customerEmail,
    arrivalTime,
    leavingTime,
    numTravellers,
    leader,
    destinationCode,
  } = JSON.parse(event.Records[0].Sns.Message);

  console.log(
    destination,
    arrivalTime,
    leavingTime,
    numTravellers,
    leader,
    destinationCode
  );

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

  function objSlice(obj, lastExclusive) {
    var filteredKeys = Object.keys(obj).slice(0, lastExclusive);
    var newObj = {};
    filteredKeys.forEach(function (key) {
      newObj[key] = obj[key];
    });
    return newObj;
  }

  let offers = [];

  for (
    let i = Math.ceil(numTravellers / 3);
    i <= Math.ceil(numTravellers / 2);
    i++
  ) {
    const params1 = {
      stay: {
        checkIn: arrivalTime,
        checkOut: leavingTime,
      },
      occupancies: [
        {
          rooms: i,
          adults: numTravellers,
          children: 0,
        },
      ],
      destination: {
        code: destinationCode,
      },
    };

    try {
      const res = await axios.post(
        `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
        params1,
        config
      );
      console.log(res.data.hotels);
      res.data.hotels.hotels.map((x) => console.log(x.rooms));
      // res.data.hotels.hotels.map((x) =>
      //   x.rooms.map((y) => y.rates.map((z) => console.log(z)))
      // );
      res.data.hotels.hotels.map((x) =>
        x.rooms.map((y) =>
          y.rates.map((z) =>
            offers.push({
              ...objSlice(x, 10),
              room: { ...objSlice(y, 2), rate: z },
            })
          )
        )
      );
      console.log(offers);
    } catch (error) {
      console.log(error);
      throw new createError.InternalServerError(error);
    }
  }

  // Prepare SES Parameters
  let params1 = {
    Destination: {
      ToAddresses: [customerEmail],
    },
    Source: 'bookings@mymailhub.net',
    Template: process.env.HOTEL_OFFERS_TEMPLATE,
    TemplateData: `{ \"location\": \"${destination}\"}`,
  };

  await ses.sendTemplatedEmail(params1).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(
      `Email Campaign Message sent successfully to ${customerEmail}`
    ),
  };
}

export const handler = sendHotelOffers;
