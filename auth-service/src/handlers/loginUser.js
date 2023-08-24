import createError from 'http-errors';
import loginUserSchema from '../lib/schemas/loginUserSchema';
import commonMiddleware from '../lib/commonMiddleware';
import validator from '@middy/validator';
import cors from '@middy/http-cors';
import bcrypt from 'bcryptjs';
import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function loginUser(event, context) {
  const { username, password } = event.body;

  // const body = event.body;
  let userResult;

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'username',
    KeyConditionExpression: '#username = :username',
    ExpressionAttributeNames: {
      '#username': 'username',
    },
    ExpressionAttributeValues: {
      ':username': username,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();

    userResult = result.Items;
  } catch (error) {
    throw new createError.InternalServerError(error);
  }

  if (
    typeof userResult !== 'undefined' &&
    userResult.length === 1
  ) {
    const compareResult = bcrypt.compareSync(
      password,
      userResult[0].password
    );
    if (compareResult) {
      let token = jwt.sign(
        {
          username: userResult[0].username,
        },
        process.env.JWT_SECRET
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          token: token,
        }),
      };
    }
  }
  return {
    statusCode: 404,
    body: JSON.stringify(userResult),
  };
}

export const handler = commonMiddleware(loginUser)
  .use(validator({ inputSchema: loginUserSchema }))
  .use(cors());
