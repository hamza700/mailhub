import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import cors from '@middy/http-cors';
// let mime = require('mime-types');
const s3 = new AWS.S3();

async function uploadJSONToS3(event, context) {
  const file = event.body;
  const fileName = `${Date.now()}.json`;

  console.log(file);
  console.log(fileName);

  await s3
    .putObject({
      Bucket: process.env.BOOKINGS_BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(file),
      ContentType: 'application/json',
      // Metadata: {},
    })
    .promise();

  return;
}

export const handler = commonMiddleware(uploadJSONToS3).use(cors());
