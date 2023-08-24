import AWS from 'aws-sdk';
import axios from 'axios';
const docClient = new AWS.DynamoDB.DocumentClient();

const ddbTable = process.env.HOTELS_INFO_TABLE_NAME;

export async function uploadAccommodations(config) {
  let param1 = 1;
  let param2 = 9;
  let accommodations = [];

  const res = await axios.get(
    `https://api.test.hotelbeds.com/hotel-content-api/1.0/types/accommodations?fields=all&language=ENG&from=${param1}&to=${param2}`,
    config
  );
  //   param1 += 1000;
  //   param2 += 1000;
  accommodations = accommodations.concat(res.data.accommodations);
  console.log(accommodations);

  let batches = [];
  const BATCH_SIZE = 25;

  while (accommodations.length > 0) {
    batches.push(accommodations.splice(0, BATCH_SIZE));
  }

  console.log(`Total batches: ${batches.length}`);

  let batchCount = 0;

  await Promise.all(
    batches.map(async (item_data, i) => {
      // Set up the params object for the DDB call
      const params = {
        RequestItems: {},
      };
      params.RequestItems[ddbTable] = [];

      item_data.forEach((item) => {
        // Build params
        params.RequestItems[ddbTable].push({
          PutRequest: {
            Item: {
              ...item,
              type: 'accommodation',
            },
          },
        });
      });

      console.log(params.RequestItems[ddbTable][0].PutRequest.Item);

      // Push to DynamoDB in batches
      try {
        batchCount++;
        console.log('Trying batch: ', batchCount);
        const result = await docClient.batchWrite(params).promise();
        console.log('Success: ', result.UnprocessedItems);
      } catch (err) {
        console.error('Error: ', err);
      }
    })
  );

  return;
}
