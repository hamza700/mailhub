import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import { v4 as uuid } from 'uuid';

var Amadeus = require('amadeus');

// const s3 = new AWS.S3();

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function uploadBooking(event, context) {
  console.log(event.Records[0].Sns);

  const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  });

  const message = event.Records[0].Sns.Message;
  const email = JSON.parse(message).content;
  const sender = JSON.parse(message).mail.source;
  console.log(email);

  let id;

  amadeus.travel
    .tripParserJobs()
    .post(
      JSON.stringify({
        data: {
          type: 'trip-parser-job',
          content: email,
        },
      })
    )
    .then(async function (response) {
      console.log(response);
      id = response.result.data.id;
      async function getTrip(amadeus, id) {
        amadeus.travel
          .tripParserJobs(id)
          .get()
          .then(async function (response) {
            console.log(response);
            var status = response.result.data.status;
            if (status !== 'COMPLETED') {
              setTimeout(getTrip, 5000, amadeus, id);
            } else {
              let booking;

              amadeus.travel
                .tripParserJobs(id)
                .result.get()
                .then(async function (response) {
                  console.log(response);
                  booking = response.result;
                  console.log(booking);
                  // const result = booking.data.id;
                  // const fileName = `${result}.json`;
                  // await s3
                  //   .putObject({
                  //     Bucket: process.env.BOOKINGS_BUCKET_NAME,
                  //     Key: fileName,
                  //     Body: JSON.stringify(booking),
                  //     ContentType: 'application/json',
                  //   })
                  //   .promise();
                  try {
                    await dynamodb
                      .put({
                        TableName: process.env.BOOKINGS_TABLE_NAME,
                        Item: {
                          bookingId: uuid(),
                          products: booking.data.products,
                          stakeholders: booking.data.stakeholders,
                          reference: booking.data.reference,
                          agencyEmail: sender,
                        },
                      })
                      .promise();
                  } catch (error) {
                    console.log(error);
                    throw new createError.InternalServerError(error);
                  }
                  return;
                })
                .catch(function (response) {
                  console.error(response);
                  return;
                });
            }
          })
          .catch(function (response) {
            console.error(response);
            return;
          });
      }
      await getTrip(amadeus, id);
    })
    .catch(function (response) {
      console.error(response);
      return;
    });
}

export const handler = commonMiddleware(uploadBooking).use(cors());
