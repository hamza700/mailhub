import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Set a user's existing un-used reset tokens to used
 * @param {object} user user object
 */
export const expirePasswordTokens = async (user) => {
  if (!user) throw new Error(`"user" is required`);

  if (!user.password_reset_tokens) return true; // if the user has no tokens we don't need to do anything

  let updated_tokens = { ...user.password_reset_tokens }; // make copy

  // loop through tokens and update unused tokens to used
  Object.keys(user.password_reset_tokens).forEach((tokenStr) => {
    if (user.password_reset_tokens[tokenStr].used === false) {
      updated_tokens[tokenStr].used = true;
    }
  });

  // prepare params to update User with new password_reset_tokens item
  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    Key: {
      email: user.email,
    },
    UpdateExpression: 'set password_reset_tokens=:v',
    ExpressionAttributeValues: { ':v': updated_tokens },
    ReturnValues: 'ALL_NEW',
  };

  // use DynamoDB.DocumentClient to update
  await dynamodb.update(params).promise();

  return true;
};
