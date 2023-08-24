import AWS from 'aws-sdk';
import axios from 'axios';
const docClient = new AWS.DynamoDB.DocumentClient();

const ddbTable = process.env.HOTELS_INFO_TABLE_NAME;

export async function uploadDestinations(config) {
  let param1 = 1;
  let param2 = 1000;
  let destinations = [];

  for (var i = 0; i < 5; i++) {
    const res = await axios.get(
      `https://api.test.hotelbeds.com/hotel-content-api/1.0/locations/destinations?fields=all&language=ENG&from=${param1}&to=${param2}`,
      config
    );
    param1 += 1000;
    param2 += 1000;
    destinations = destinations.concat(res.data.destinations);
    console.log(destinations);
  }

  let batches = [];
  const BATCH_SIZE = 25;

  while (destinations.length > 0) {
    batches.push(destinations.splice(0, BATCH_SIZE));
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
        for (let key of Object.keys(item)) {
          if (item['name']) {
            item['name'].content = item['name'].content.toUpperCase();
          }

          // console.log(item['name']);
          console.log(key);
        }
        // Build params
        params.RequestItems[ddbTable].push({
          PutRequest: {
            Item: {
              ...item,
              type: 'destination',
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
