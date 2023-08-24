import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';
import cors from '@middy/http-cors';
import jwt from 'jsonwebtoken';
import createUserSchema from '../lib/schemas/createUserSchema';
import { checkUniqueUsername, checkUniqueEmail } from '../lib/checkUnique';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createUser(event, context) {
  // const body = event.body;
  // const email = body.email;
  // const username = body.username;
  // const password = body.password;

  const { email, username, password } = event.body;

  const uniqueUsername = await checkUniqueUsername(username);
  const uniqueEmail = await checkUniqueEmail(email);

  console.log(uniqueUsername);

  if (uniqueUsername) {
    return {
      statusCode: 409,
      body: 'Username already exists!',
    };
  }

  console.log(uniqueEmail);

  if (uniqueEmail) {
    return {
      statusCode: 409,
      body: 'Email already registered!',
    };
  }

  const encrypted = bcrypt.hashSync(password, 10);

  const user = {
    id: uuid(),
    email,
    username,
    password: encrypted,
  };

  console.log(user);

  try {
    await dynamodb
      .put({
        TableName: process.env.USERS_TABLE_NAME,
        Item: user,
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }
  let token = jwt.sign(
    {
      username: user.username,
    },
    process.env.JWT_SECRET
  );
  return {
    statusCode: 201,
    body: JSON.stringify({ user, token: token }),
  };
}

export const handler = commonMiddleware(createUser)
  .use(validator({ inputSchema: createUserSchema }))
  .use(cors());
