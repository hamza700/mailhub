import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
// import validator from '@middy/validator';
import cors from '@middy/http-cors';
import axios from 'axios';
import crypto from 'crypto';

// const s3 = new AWS.S3();

const docClient = new AWS.DynamoDB.DocumentClient();

const ddbTable = process.env.HOTELS_CONTENT_TABLE_NAME;

async function uploadHotelsContent(event, context) {
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
    TableName: process.env.PARAMS_TABLE_NAME,
    KeyConditionExpression: '#code = :code',
    ExpressionAttributeNames: {
      '#code': 'code',
    },
    ExpressionAttributeValues: {
      ':code': '1',
    },
  };

  let param1;
  let param2;

  try {
    const result = await docClient.query(params).promise();
    console.log(result);

    param1 = result.Items[0].param1;
    param2 = result.Items[0].param2;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  let hotels = [];

  for (var i = 0; i < 25; i++) {
    const res = await axios.get(
      `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?fields=all&language=ENG&from=${param1}&to=${param2}`,
      config
    );

    hotels = res.data.hotels;

    let batches = [];
    const BATCH_SIZE = 25;

    while (hotels.length > 0) {
      batches.push(hotels.splice(0, BATCH_SIZE));
    }

    console.log(`Total batches: ${batches.length}`);

    let batchCount = 0;

    await Promise.all(
      batches.map(async (item_data, i) => {
        // Set up the params object for the DDB call
        const params = {
          RequestItems: {},
        };
        params.RequestItems[ddbTable] = [];

        item_data.forEach((item) => {
          // console.log(item);

          // for (let key of Object.keys(item)) {
          //   //   // An AttributeValue may not contain an empty string
          //   //   // if (item['code']) console.log(item);
          //   //   // var code = item['code'];
          //   //   // console.log(code);

          //   if (item[key] === '') delete item[key];
          //   //   // console.log(key);
          // }

          // Build params
          params.RequestItems[ddbTable].push({
            PutRequest: {
              Item: {
                ...item,
                name: item['name'].content,
                // code: item['code'],
              },
            },
          });
        });

        // Push to DynamoDB in batches
        try {
          batchCount++;
          console.log('Trying batch: ', batchCount);
          const result = await docClient.batchWrite(params).promise();
          console.log('Success: ', result);
        } catch (err) {
          console.error('Error: ', err);
        }
      })
    );

    param1 += 100;
    param2 += 100;
    console.log(hotels);
  }

  // const file = hotels;
  // const fileName = `hotels.json`;

  // await s3
  //   .putObject({
  //     Bucket: process.env.HOTELS_CONTENT_BUCKET_NAME,
  //     Key: fileName,
  //     Body: JSON.stringify(file),
  //     ContentType: 'application/json',
  //     // Metadata: {},
  //   })
  //   .promise();

  try {
    await docClient
      .put({
        TableName: process.env.PARAMS_TABLE_NAME,
        Item: {
          code: '1',
          param1: param1,
          param2: param2,
        },
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = commonMiddleware(uploadHotelsContent).use(cors());
