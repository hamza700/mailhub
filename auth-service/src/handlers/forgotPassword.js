import AWS from 'aws-sdk';
// import bcrypt from 'bcryptjs';
import commonMiddleware from '../lib/commonMiddleware';
// import createError from 'http-errors';
// import validator from '@middy/validator';
import cors from '@middy/http-cors';
// import jwt from 'jsonwebtoken';
import { expirePasswordTokens } from '../lib/expirePasswordTokens';
import { createResetToken } from '../lib/createResetToken';
import { getByEmail } from '../lib/getByEmail';
// import { forgotPasswordEmail } from '../lib/forgotPasswordEmail';
// import fs from 'fs';
// const path = require('path');

import Handlebars from 'handlebars';
// const fs = require('fs');
// const fsPromises = fs.promises;
// const Handlebars = require('handlebars');

// AWS
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: 'eu-west-1' }); // Simple email service

/**
 * Generate a reset password token and send email to the user
 * @param {*} event body.email - required
 * @param {*} res
 */
async function forgotPassword(event, context) {
  // console.log(forgotPasswordEmail);
  try {
    // Retrieve user by email provided in the request
    let user = await getByEmail(event.body.email);

    console.log(user);

    // User not found, don't send failure as that could let hackers know which emails do exist
    if (!user) {
      return { statusCode: 200 };
    }

    // expire any existing tokens for the user
    await expirePasswordTokens(user);

    // password token expires after one hour
    let expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    let token = createResetToken();

    console.log(token);

    // create a new entry in the user's password_reset_token map
    let updatedTokens = {
      ...user.password_reset_tokens, // use spread operator to copy exisiting token entries
      [token]: {
        used: false,
        expiration: expireDate.toISOString(),
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
      },
    };

    console.log(updatedTokens);

    // prepare params to update User with new password_reset_tokens item
    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        id: user[0].id,
      },
      UpdateExpression: 'set password_reset_tokens=:v',
      ExpressionAttributeValues: { ':v': updatedTokens },
      ReturnValues: 'ALL_NEW',
    };

    // use DynamoDB.DocumentClient to update
    await dynamodb.update(params).promise();

    // prep data for the email
    let url =
      'http://localhost:3000' +
      '/password/reset?token=' +
      encodeURIComponent(token) +
      '&email=' +
      event.body.email;

    console.log(url);
    // if we're offline just log and send the reset URL
    if (process.env.IS_OFFLINE) {
      console.log('password_reset_url: ' + url);
      return {
        statusCode: 200,
        body: JSON.stringify({ password_reset_url: url }),
      };
    }

    let emailData = {
      url: url,
      toEmail: event.body.email,
      expire:
        expireDate.toLocaleDateString() + ' ' + expireDate.toLocaleTimeString(),
      year: expireDate.getFullYear(),
    };

    console.log(emailData);

    // get HTML email template
    // let emailHtmlTemplate = await fsPromises.readFile(filePath);

    // <!-- BEGIN BODY // -->
    let emailHtmlTemplate =
      '<html><table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody"> <tr> <td class="bodyContent" style="padding-top: 0; padding-bottom: 0"> <img src="https://digitalhumani.com/img/logo-final.png" style="max-width: 60px" id="bodyImage"/> </td> </tr> <tr> <td valign="top" class="bodyContent"> <h1 style="color: #0a8a08 !important">Password Reset Request</h1> <h4>  If this was a mistake, just ignore this email and nothing will happen. </h4> <br /> A password reset has been requested for DigitalHumani: <br />  <br /> Email: <a href="mailto:{{ toEmail }}">{{ toEmail }}</a> <br /> Expiration: {{ expire }} <br /> <br /> <strong>Visit this link to reset your password: </strong> <br /> <a href="{{ url }}">Reset Password</a> <br /> <br /> If the link above does not work try pasting this url into your browser: <br /> {{ url }} </td> </tr> </table> </html>';
    // <!-- // END BODY -->

    console.log(emailHtmlTemplate);

    // Inject data into the template
    let templateHtml = Handlebars.compile(emailHtmlTemplate.toString());
    let bodyHtml = templateHtml(emailData);

    console.log(bodyHtml);

    // Prepare SES Parameters
    let params1 = {
      Destination: {
        ToAddresses: [emailData.toEmail],
      },
      Message: {
        Body: {
          Text: {
            Data:
              'To reset your password, please click the link below.\n\n https://' +
              emailData.url,
          },
          Html: {
            Data: bodyHtml,
          },
        },
        Subject: {
          Data: 'MailHub - Password Reset Request',
        },
      },
      Source: 'ohamza762@gmail.com',
    };

    await ses.sendEmail(params1).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(
        `Password Reset Email sent successfully to ${emailData.toEmail}`
      ),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

export const handler = commonMiddleware(forgotPassword).use(cors());
