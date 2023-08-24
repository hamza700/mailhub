import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';
import cors from '@middy/http-cors';
import addAPISchema from '../lib/schemas/addAPISchema';
import { getIdFromToken } from '../lib/getIdFromToken';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function addAPI(event, context) {
  // const body = event.body;
  // const email = body.email;
  // const username = body.username;
  // const password = body.password;

  const {
    token,
    name,
    type,
    endpoint,
    username,
    password,
    status,
  } = event.body;

  const id = await getIdFromToken(token);

  const encrypted = bcrypt.hashSync(password, 10);

  const test = true;

  const api = {
    id,
    supplierId: uuid(),
    name,
    type,
    endpoint,
    username,
    password: encrypted,
    status,
    test,
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.API_TABLE_NAME,
        Item: api,
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(api),
  };
}

export const handler = commonMiddleware(addAPI)
  .use(validator({ inputSchema: addAPISchema }))
  .use(cors());
