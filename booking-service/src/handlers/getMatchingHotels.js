import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import axios from 'axios';
import crypto from 'crypto';

const s3 = new AWS.S3();

async function getMatchingHotels(event, context) {
  const {
    destination,
    arrivalTime,
    leavingTime,
    numTravellers,
    leader,
    destinationCode,
  } = JSON.parse(event.Records[0].Sns.Message);

  console.log(
    destination,
    arrivalTime,
    leavingTime,
    numTravellers,
    leader,
    destinationCode
  );

  const hash = crypto.createHash('sha256');
  const encryption =
    process.env.APITUDE_APIKEY +
    process.env.APITUDE_SECRET +
    Math.floor(Date.now() / 1000);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Api-key': process.env.APITUDE_APIKEY,
      'X-Signature': `${hash.update(encryption).digest('hex')}`,
    },
  };

  // let occupancies = {
  //   occupancies: [],
  //   1: [],
  //   2: [],
  //   3: [],
  //   4: [],
  //   5: [],
  //   6: [],
  //   7: [],
  // };

  // for (let i = 1; i < numTravellers + 1; i++) {
  //   occupancies.occupancies.push({
  //     rooms: i,
  //     adults: numTravellers,
  //     children: 0,
  //   });
  // }

  // if (occupancies.occupancies.length > 4) {
  //   occupancies['1'] = occupancies.occupancies.slice(0, 4);
  //   for (let j = 2; j < occupancies.occupancies.length - 2; j++) {
  //     occupancies[j] = occupancies.occupancies.slice(j + 2, j + 3);
  //   }
  // }

  // for (let k = 1; k <= Object.keys(occupancies).length + 3; k++) {
  //   if (occupancies[k].length === 0) delete occupancies[k];
  // }

  // console.log(occupancies);

  // if (occupancies.occupancies.length <= 4) {
  //   const params1 = {
  //     stay: {
  //       checkIn: arrivalTime,
  //       checkOut: leavingTime,
  //     },
  //     occupancies: occupancies.occupancies,
  //     destination: {
  //       code: destinationCode,
  //     },
  //   };

  //   try {
  //     const res = await axios.post(
  //       `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
  //       params1,
  //       config
  //     );
  //     console.log(res.hotels);
  //   } catch (error) {
  //     console.log(error);
  //     throw new createError.InternalServerError(error);
  //   }
  // } else {
  //   for (let l = 1; l < Object.keys(occupancies).length; l++) {
  //     console.log(occupancies[l]);
  //     let params1 = {
  //       stay: {
  //         checkIn: arrivalTime,
  //         checkOut: leavingTime,
  //       },
  //       occupancies: occupancies[l],
  //       destination: {
  //         code: destinationCode,
  //       },
  //     };

  //     try {
  //       const res = await axios.post(
  //         `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
  //         params1,
  //         config
  //       );
  //       console.log(res.data.hotels);
  //       console.log(res.data.hotels.hotels[0].rooms);
  //     } catch (error) {
  //       console.log(error);
  //       throw new createError.InternalServerError(error);
  //     }
  //   }
  // }

  function objSlice(obj, lastExclusive) {
    var filteredKeys = Object.keys(obj).slice(0, lastExclusive);
    var newObj = {};
    filteredKeys.forEach(function (key) {
      newObj[key] = obj[key];
    });
    return newObj;
  }

  let offers = [];

  for (
    let i = Math.ceil(numTravellers / 3);
    i <= Math.ceil(numTravellers / 2);
    i++
  ) {
    const params1 = {
      stay: {
        checkIn: arrivalTime,
        checkOut: leavingTime,
      },
      occupancies: [
        {
          rooms: i,
          adults: numTravellers,
          children: 0,
        },
      ],
      destination: {
        code: destinationCode,
      },
    };

    try {
      const res = await axios.post(
        `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
        params1,
        config
      );
      console.log(res.data.hotels);
      res.data.hotels.hotels.map((x) => console.log(x.rooms));
      // res.data.hotels.hotels.map((x) =>
      //   x.rooms.map((y) => y.rates.map((z) => console.log(z)))
      // );
      res.data.hotels.hotels.map((x) =>
        x.rooms.map((y) =>
          y.rates.map((z) =>
            offers.push({
              ...objSlice(x, 10),
              room: { ...objSlice(y, 2), rate: z },
            })
          )
        )
      );
      console.log(offers);
    } catch (error) {
      console.log(error);
      throw new createError.InternalServerError(error);
    }
  }

  const fileName = `${leader} - ${destination}.json`;
  await s3
    .putObject({
      Bucket: process.env.OFFERS_BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(offers),
      ContentType: 'application/json',
    })
    .promise();

  return {
    statusCode: 200,
  };
}

export const handler = commonMiddleware(getMatchingHotels).use(cors());
