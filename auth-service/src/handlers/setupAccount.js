// import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';
import cors from '@middy/http-cors';
import { uploadLogoToS3 } from '../lib/uploadLogoToS3';
import setupAccountSchema from '../lib/schemas/setupAccountSchema';
import { getIdFromToken } from '../lib/getIdFromToken';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function setupAccount(event, context) {
  const {
    title,
    name,
    surname,
    mobile,
    landline,
    compName,
    accessCode,
    logo,
    email,
    address,
    postCode,
  } = event.body;

  const token = event.headers.Authorization.split(" ")[1];

  const id = await getIdFromToken(token);

  const base64 = logo.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  const logoUrl = await uploadLogoToS3(id + '.jpg', buffer);

  const account = {
    id,
    title,
    name,
    surname,
    mobile,
    landline,
    compName,
    accessCode,
    logoUrl,
    email,
    address,
    postCode,
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.ACCOUNT_DETAILS_TABLE_NAME,
        Item: account,
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(account),
  };
}

export const handler = commonMiddleware(setupAccount)
  .use(validator({ inputSchema: setupAccountSchema }))
  .use(cors());
