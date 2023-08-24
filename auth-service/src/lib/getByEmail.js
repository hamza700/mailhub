import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getByEmail(email) {
  let emailResult;

  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    IndexName: 'email',
    KeyConditionExpression: '#email = :email',
    ExpressionAttributeNames: {
      '#email': 'email',
    },
    ExpressionAttributeValues: {
      ':email': email,
    },
  };

  const result = await dynamodb.query(params).promise();

  emailResult = result.Items;

  return emailResult;
}
