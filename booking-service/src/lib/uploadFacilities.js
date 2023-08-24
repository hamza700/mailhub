import AWS from 'aws-sdk';
import axios from 'axios';
const docClient = new AWS.DynamoDB.DocumentClient();

const ddbTable = process.env.HOTELS_INFO_TABLE_NAME;

export async function uploadFacilities(config) {
  let param1 = 1;
  let param2 = 551;
  let facilities = [];

  const res = await axios.get(
    `https://api.test.hotelbeds.com/hotel-content-api/1.0/types/facilities?fields=all&language=ENG&from=${param1}&to=${param2}`,
    config
  );
  //   param1 += 1000;
  //   param2 += 1000;
  facilities = facilities.concat(res.data.facilities);
  console.log(facilities);

  let batches = [];
  const BATCH_SIZE = 25;

  while (facilities.length > 0) {
    batches.push(facilities.splice(0, BATCH_SIZE));
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
              code:
                item['code'].toString() +
                ',' +
                item['facilityGroupCode'].toString(),
              type: 'facility',
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
