import AWS from 'aws-sdk';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getBookingDetails(event) {
  let bookingDetails = {
    destination: '',
    arrivalTime: '',
    leavingTime: '',
    numTravellers: '',
    leader: '',
    destinationCode: ''
  };

  bookingDetails.destination =
    event.Records[0].dynamodb.NewImage.products.L[0].M.air.M.end.M.address.M.cityName.S;
  bookingDetails.arrivalTime =
    event.Records[0].dynamodb.NewImage.products.L[0].M.air.M.end.M.dateTime.S;
  bookingDetails.leavingTime =
    event.Records[0].dynamodb.NewImage.products.L[1].M.air.M.start.M.dateTime.S;
  bookingDetails.numTravellers =
    event.Records[0].dynamodb.NewImage.stakeholders.L.length;
  bookingDetails.leader =
    event.Records[0].dynamodb.NewImage.stakeholders.L[0].M.names.L[0].M
      .firstName.S +
    ' ' +
    event.Records[0].dynamodb.NewImage.stakeholders.L[0].M.names.L[0].M.lastName
      .S;

  bookingDetails.arrivalTime = bookingDetails.arrivalTime.split('T')[0];
  bookingDetails.leavingTime = bookingDetails.leavingTime.split('T')[0];

  console.log(bookingDetails);

  let ExclusiveStartKey;

  const params = {
    TableName: process.env.HOTELS_INFO_TABLE_NAME,
    ExclusiveStartKey,
    KeyConditionExpression: '#type = :type',
    FilterExpression: '#name = :name',
    ExpressionAttributeNames: {
      '#type': 'type',
      '#name': 'name',
    },
    ExpressionAttributeValues: {
      ':type': 'destination',
      ':name': {
        content: bookingDetails.destination,
      },
    },
  };

  try {
    let result;
    let lastEvaluatedKey = 'dummy'; // string must not be empty
    while (lastEvaluatedKey) {
      result = await dynamodb.query(params).promise();
      console.log(result);
      if (result.Items.length != 0) {
        bookingDetails.destinationCode = result.Items[0].code;
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
    }

    console.log(bookingDetails.destinationCode);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return bookingDetails;
}
