import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import cors from '@middy/http-cors';
// import { getByEmail } from '../lib/getByEmail';
import { hashPassword } from '../lib/utils';
import createError from 'http-errors';
import { getIdFromToken } from '../lib/getIdFromToken';
import bcrypt from 'bcryptjs';

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Update password
 * @param {*} event - body.email, body.currentPassword, body.password1, body.password2
 * @param {*} res
 */
const updatePassword = async (event, res) => {
  try {
    const token = event.headers.Authorization.split(' ')[1];

    const id = await getIdFromToken(token);

    // const body = event.body;
    let user;

    const params = {
      TableName: process.env.USERS_TABLE_NAME,
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

      user = result.Items;
    } catch (error) {
      throw new createError.InternalServerError(error);
    }
    // User not found
    if (!user)
      throw new Error(
        'User with provided email not found. Could not reset password.'
      );

    // Validate current password
    if (
      !event.body.currentPassword ||
      //   !comparePassword(event.body.currentPassword, user.password)
      !bcrypt.compareSync(event.body.currentPassword, user[0].password)
    ) {
      throw new Error('Current Password Incorrect. Could not update password.');
    }

    // compare the two new passwords - error if don't match
    if (event.body.password1 !== event.body.password2) {
      throw new Error('New passwords do not match. Could not update password.');
    }

    // set new password for User
    let password = hashPassword(event.body.password1);

    // prepare params to update User with new password_reset_tokens item
    const params1 = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        id: user[0].id,
      },
      UpdateExpression: 'set password=:v',
      ExpressionAttributeValues: { ':v': password },
      ReturnValues: 'ALL_NEW',
    };

    // use DynamoDB.DocumentClient to update
    await dynamodb.update(params1).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password Update Successful' }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export const handler = commonMiddleware(updatePassword).use(cors());
