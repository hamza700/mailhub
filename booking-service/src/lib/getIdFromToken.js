import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getIdFromToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const username = decoded.username;

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

  const result = await dynamodb.query(params).promise();

  userResult = result.Items;

  const id = userResult[0].id;
  console.log(id);

  return id;
}
