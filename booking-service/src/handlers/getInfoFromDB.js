import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
// let mime = require('mime-types');

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getInfoFromDB(event, context) {
  event.Records.forEach(async (record) => {
    console.log(JSON.stringify(record.dynamodb));
    let id;
    let passportNumber;
    let departureDate;
    let returnDate;
    let checkInDate;
    let checkOutDate;
    let types;

    if ((record.eventName = 'INSERT')) {
      passportNumber = record.dynamodb.NewImage.passportNumber.S;
      record.dynamodb.NewImage.type.S == 'flight'
        ? (departureDate = record.dynamodb.NewImage.departureDate.S)
        : departureDate;
      record.dynamodb.NewImage.type.S == 'flight'
        ? (returnDate = record.dynamodb.NewImage.returnDate.S)
        : returnDate;
      record.dynamodb.NewImage.type.S == 'hotel'
        ? (checkInDate = record.dynamodb.NewImage.checkInDate.S)
        : checkInDate;
      record.dynamodb.NewImage.type.S == 'hotel'
        ? (checkOutDate = record.dynamodb.NewImage.checkOutDate.S)
        : checkOutDate;
      const type = record.dynamodb.NewImage.type.S;
      // console.log(passportNumber, departureDate, returnDate);

      let userResult;

      const params = {
        TableName: process.env.CHECKLIST_TABLE_NAME,
        IndexName: 'passportNumber',
        KeyConditionExpression: '#passportNumber = :passportNumber',
        ExpressionAttributeNames: {
          '#passportNumber': 'passportNumber',
        },
        ExpressionAttributeValues: {
          ':passportNumber': passportNumber,
        },
      };

      try {
        const result = await dynamodb.query(params).promise();

        userResult = result.Items;
      } catch (error) {
        console.log(error);
        throw new createError.InternalServerError(error);
      }

      if (userResult.length == 0) {
        id = uuid();
      } else {
        id = userResult[0].id;
      }

      if (userResult.length != 0 && userResult[0].flight) {
        departureDate = userResult[0].departureDate;
        returnDate = userResult[0].returnDate;
        types = {
          ['flight']: true,
          [type]: true,
        };
      } else if (userResult.length != 0 && userResult[0].hotel) {
        checkInDate = userResult[0].checkInDate;
        checkOutDate = userResult[0].checkOutDate;
        types = {
          ['hotel']: true,
          [type]: true,
        };
      } else {
        types = {
          [type]: true,
        };
      }

      console.log(id);
      const user = {
        id,
        passportNumber,
        departureDate,
        returnDate,
        checkInDate,
        checkOutDate,
        flight: types.flight,
        hotel: types.hotel,
      };

      console.log(user);

      // if (userResult.length != 0 && userResult[0].flight) {
      //   types = {
      //     [type]: true,
      //   };
      // }
      // const params1 = {
      //   Key: {
      //     id: id,
      //   },
      //   TableName: process.env.CHECKLIST_TABLE_NAME,
      //   UpdateExpression: 'SET task=:t',
      //   ExpressionAttributeValues: { ':t': `${event.key2}` },
      //   ReturnValues: 'UPDATED_NEW',
      // };

      try {
        await dynamodb
          .put({
            TableName: process.env.CHECKLIST_TABLE_NAME,
            Item: user,
          })
          .promise();
      } catch (error) {
        console.log(error);
        throw new createError.InternalServerError(error);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ user }),
      };
    }
  });
}

export const handler = commonMiddleware(getInfoFromDB).use(cors());
