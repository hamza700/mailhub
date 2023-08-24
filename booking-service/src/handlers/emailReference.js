import AWS from 'aws-sdk';
// import bcrypt from 'bcryptjs';
import commonMiddleware from '../lib/commonMiddleware';
// import createError from 'http-errors';
// import validator from '@middy/validator';
import cors from '@middy/http-cors';
// import jwt from 'jsonwebtoken';
// import { forgotPasswordEmail } from '../lib/forgotPasswordEmail';
// import fs from 'fs';
// const path = require('path');

import Handlebars from 'handlebars';
// const fs = require('fs');
// const fsPromises = fs.promises;
// const Handlebars = require('handlebars');

// AWS
const ses = new AWS.SES({ region: 'eu-west-1' }); // Simple email service

/**
 * Generate a reset password token and send email to the user
 * @param {*} event body.email - required
 * @param {*} res
 */
async function emailReference(event, context) {
  // console.log(forgotPasswordEmail);
  if (event.Records[0].eventName == 'INSERT') {
    try {
      let agencyEmail = event.Records[0].dynamodb.NewImage.agencyEmail.S;

      let reference = event.Records[0].dynamodb.NewImage.reference.S;

      let leader =
        event.Records[0].dynamodb.NewImage.stakeholders.L[0].M.names.L[0].M
          .firstName.S +
        ' ' +
        event.Records[0].dynamodb.NewImage.stakeholders.L[0].M.names.L[0].M
          .lastName.S;

      // prep data for the email
      let url = 'http://localhost:3000' + '/products';

      console.log(url);

      let emailData = {
        url: url,
        toEmail: agencyEmail,
        reference: reference,
        leader: leader,
      };

      console.log(emailData);

      // get HTML email template
      // let emailHtmlTemplate = await fsPromises.readFile(filePath);

      // <!-- BEGIN BODY // -->
      let emailHtmlTemplate =
        '<html><table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody"> <tr> <td class="bodyContent" style="padding-top: 0; padding-bottom: 0"> <img src="https://digitalhumani.com/img/logo-final.png" style="max-width: 60px" id="bodyImage"/> </td> </tr> <tr> <td valign="top" class="bodyContent"> <h1 style="color: #0a8a08 !important">New Email Campaign</h1> Below is the reference for customer {{ leader }} <br />  <br /> Reference: {{ reference }} <br /> <br /> <strong>Visit this link to start a campaign: </strong> <br /> <a href="{{ url }}">Start Campaign</a> <br /> <br /> If the link above does not work try pasting this url into your browser: <br /> {{ url }} </td> </tr> </table> </html>';
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
                'To start a campaign for this customer, please click the link below.\n\n https://' +
                emailData.url,
            },
            Html: {
              Data: bodyHtml,
            },
          },
          Subject: {
            Data: 'MailHub - New Customer Campaign',
          },
        },
        Source: 'bookings@mymailhub.net',
      };

      await ses.sendEmail(params1).promise();
      return {
        statusCode: 200,
        body: JSON.stringify(
          `Email Campaign Message sent successfully to ${emailData.toEmail}`
        ),
      };
    } catch (error) {
      console.log({ error: error.message });

      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }
}

export const handler = commonMiddleware(emailReference).use(cors());
