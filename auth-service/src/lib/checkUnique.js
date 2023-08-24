import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function checkUniqueUsername(username) {
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

  console.log(userResult);

  if (userResult.length > 0) {
    return true;
  } else {
    return false;
  }
}

export async function checkUniqueEmail(email) {
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

  console.log(emailResult);

  if (emailResult.length > 0) {
    return true;
  } else {
    return false;
  }
}
