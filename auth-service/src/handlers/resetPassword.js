import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import cors from '@middy/http-cors';
import { hashPassword } from '../lib/utils';
import { usePasswordToken } from '../lib/usePasswordToken';
import { getByEmail } from '../lib/getByEmail';

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Reset password
 * @param {*} event - body.email, body.token, body.password1, body.password2
 * @param {*} res
 */
async function resetPassword(event, context) {
  // reset password
  try {
    // compare the two passwords - error if don't match
    let user = await getByEmail(event.body.email);

    if (event.body.password1 !== event.body.password2) {
      throw new Error('Passwords do not match');
    }

    // find the token entry in DynamoDB - returns error if no token or expired
    // if successful, update token to used = 1
    await usePasswordToken({
      token: event.body.token,
      email: event.body.email,
    });

    // generate hash for new password for User
    let password = hashPassword(event.body.password1);

    console.log(password);
    // prepare params to update User with new password item
    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        id: user[0].id,
      },
      UpdateExpression: 'set password=:v',
      ExpressionAttributeValues: { ':v': password },
    };

    // use DynamoDB.DocumentClient to update
    await dynamodb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password Reset Successful' }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

export const handler = commonMiddleware(resetPassword).use(cors());
