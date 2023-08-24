import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import { parseAsync } from 'json2csv';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

async function dynamodbToCSV(event, context) {
  let details;

  const params = {
    TableName: process.env.HOTELS_CONTENT_TABLE_NAME,
    ProjectionExpression:
      '#name, countryCode, destinationCode, categoryCode, categoryGroupCode',
    ExpressionAttributeNames: { '#name': 'name' },
  };
  try {
    let result = await dynamodb.scan(params).promise();
    details = result.Items;

    let lastEvaluatedKey = result.LastEvaluatedKey;
    while (lastEvaluatedKey && details.length <= 1000) {
      params.ExclusiveStartKey = lastEvaluatedKey;
      result = await dynamodb.scan(params).promise();
      details.push(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
    }
    console.log(details);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  const fields = [
    'name',
    'countryCode',
    'destinationCode',
    'categoryCode',
    'categoryGroupCode',
  ];
  const opts = { fields };

  parseAsync(details, opts)
    .then((csv) =>
      s3
        .putObject({
          Bucket: process.env.BOOKINGS_BUCKET_NAME,
          Key: 'test1.csv',
          Body: csv,
          ContentType: 'text/csv',
          // Metadata: {},
        })
        .promise()
    )
    .catch((err) => console.error(err));
}

export const handler = commonMiddleware(dynamodbToCSV).use(cors());
