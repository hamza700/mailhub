// const AWS = require('aws-sdk');
// const s3 = new AWS.S3();

// // const docClient = new AWS.DynamoDB.DocumentClient();
// // const { v4: uuidv4 } = require('uuid');

// const ddbTable = process.env.BOOKINGS_TABLE_NAME;

// // The Lambda handler
// exports.handler = async (event) => {
//   console.log(JSON.stringify(event, null, 2));
//   console.log('Using DDB table: ', ddbTable);

//   await Promise.all(
//     event.Records.map(async (record) => {
//       try {
//         console.log('Incoming record: ', record);

//         // Get original text from object in incoming event
//         const originalText = await s3
//           .getObject({
//             Bucket: event.Records[0].s3.bucket.name,
//             Key: event.Records[0].s3.object.key,
//           })
//           .promise();

//         // Upload JSON to DynamoDB
//         // const jsonData = JSON.parse(originalText.Body.toString('utf-8'));
//         // let type;
//         // jsonData.data.products[0].air ? (type = 'Flight') : null;
//         // jsonData.data.products
//         // console.log(jsonData);
//         // await ddbLoader(jsonData);
//       } catch (err) {
//         console.error(err);
//       }
//     })
//   );
// };

// // Load JSON data to DynamoDB table
// // const ddbLoader = async (data) => {
// // Separate into batches for upload
// // let batches = [];
// // const BATCH_SIZE = 25;

// // if (data.charAt(0) == '-') {
// //   const data1 = data.split('application/json');
// //   // console.log(data1);
// //   const data2 = data1[1];
// //   // console.log(data1[0]);
// //   // console.log(data1[1]);
// //   // console.log(data2);
// //   const data3 = data2.split('----------------------------');
// //   // console.log(data3);
// //   const data4 = data3[0];
// //   console.log(data4);
// //   const data5 = JSON.parse(data4);
// //   // console.log(data5);

// //   while (data5.length > 0) {
// //     batches.push(data5.splice(0, BATCH_SIZE));
// //   }
// // } else {
// // while (data.length > 0) {
// //   batches.push(data.splice(0, BATCH_SIZE));
// // }
// // // }

// // console.log(`Total batches: ${batches.length}`);

// // let batchCount = 0;

// // Save each batch
// //   await Promise.all(
// //     batches.map(async (item_data) => {
// //       // Set up the params object for the DDB call
// //       const params = {
// //         RequestItems: {},
// //       };
// //       params.RequestItems[ddbTable] = [];

// //       // item_data.forEach((item) => {
// //       //   for (let key of Object.keys(item)) {
// //       //     // An AttributeValue may not contain an empty string
// //       //     // console.log(item);
// //       //     // console.log(key);
// //       //     if (
// //       //       key === 'listFlight' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       item['accessCode'] = item[key][0].AccessCode.toString();
// //       //     } else if (
// //       //       key === 'listAcc' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       item['accessCode'] = item[key][0].AccessCode.toString();
// //       //     }

// //       //     if (key === 'AllGuestName' && item[key] !== null) {
// //       //       item['name'] = item[key].split(',')[0];
// //       //     }

// //       //     if (key === 'BookingType' && item[key] !== null) {
// //       //       item['type'] = item[key];
// //       //     }

// //       //     if (key === 'FileBookingId' && item[key] !== null) {
// //       //       item['bookingReference'] = item[key];
// //       //     }

// //       //     if (
// //       //       key === 'listFlight' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       if (
// //       //         item[key][0].FlightDetails !== null &&
// //       //         item[key][0].FlightDetails.length !== 0
// //       //       ) {
// //       //         var date;
// //       //         if (item[key][0].FlightDetails[0].DepartDate !== null) {
// //       //           date = item[key][0].FlightDetails[0].DepartDate;
// //       //           date = date.replace('/Date(', '').replace(')/', '');
// //       //           date = new Date(parseInt(date)).toISOString();
// //       //           date = date.split('T')[0];
// //       //           item['departureDate'] = date;
// //       //         }
// //       //       }
// //       //     }

// //       //     if (
// //       //       key === 'listFlight' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       if (
// //       //         item[key][0].FlightPaxDetails !== null &&
// //       //         item[key][0].FlightPaxDetails.length !== 0
// //       //       )
// //       //         item[key][0].FlightPaxDetails[0].PassportNumber !== null
// //       //           ? (item['passportNumber'] =
// //       //               item[key][0].FlightPaxDetails[0].PassportNumber)
// //       //           : (item['passportNumber'] = 'null');
// //       //     }

// //       //     if (
// //       //       key === 'listFlight' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       if (
// //       //         item[key][0].FlightDetails !== null &&
// //       //         item[key][0].FlightDetails.length !== 0
// //       //       )
// //       //         item[key][0].FlightDetails[0].AirlineName !== null
// //       //           ? (item['airline'] = item[key][0].FlightDetails[0].AirlineName)
// //       //           : (item['airline'] = 'null');
// //       //     }

// //       //     if (
// //       //       key === 'listAcc' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       item['hotelName'] = item[key][0].HotelName;
// //       //     }

// //       //     if (
// //       //       key === 'listAcc' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       var date1;
// //       //       if (item[key][0].CheckInDate !== null) {
// //       //         date1 = item[key][0].CheckInDate;
// //       //         date1 = date1.replace('/Date(', '').replace(')/', '');
// //       //         date1 = new Date(parseInt(date1)).toISOString();
// //       //         date1 = date1.split('T')[0];
// //       //         item['checkInDate'] = date1;
// //       //       }
// //       //     }

// //       //     if (
// //       //       key === 'listAcc' &&
// //       //       item[key] !== null &&
// //       //       item[key].length !== 0
// //       //     ) {
// //       //       var date2;
// //       //       if (item[key][0].CheckOutDate !== null) {
// //       //         date2 = item[key][0].CheckOutDate;
// //       //         date2 = date2.replace('/Date(', '').replace(')/', '');
// //       //         date2 = new Date(parseInt(date2)).toISOString();
// //       //         date2 = date2.split('T')[0];
// //       //         item['checkOutDate'] = date2;
// //       //       }
// //       //     }

// //       //     if (item[key] !== 'accessCode' || item[key] !== 'departureDate')
// //       //       delete item[key];
// //       //   }

// //         // console.log(item);

// //         // Build params
// //         params.RequestItems[ddbTable].push({
// //           PutRequest: {
// //             Item: {
// //               bookingId: uuidv4(),
// //               ...item,
// //             },
// //           },
// //         });
// //       });

// //       console.log(params.RequestItems['BookingsTable-dev'][0].PutRequest.Item);

// //       // Push to DynamoDB in batches
// //       try {
// //         batchCount++;
// //         console.log('Trying batch: ', batchCount);
// //         const result = await docClient.batchWrite(params).promise();
// //         console.log('Success: ', result);
// //       } catch (err) {
// //         console.error('Error: ', err);
// //       }
// //     })
// //   );
// // };
