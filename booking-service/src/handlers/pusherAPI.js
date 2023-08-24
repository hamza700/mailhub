const Pusher = require('pusher');
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import cors from '@middy/http-cors';
import axios from 'axios';
import crypto from 'crypto';

async function pusherAPI(event, context) {
  const { startDate, endDate, room, guest, hotelCode } = event.body;

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

  const params = {
    stay: {
      checkIn: startDate,
      checkOut: endDate,
    },
    occupancies: [
      {
        rooms: Number(room),
        adults: Number(guest),
        children: 0,
      },
    ],
    hotels: {
      hotel: [Number(hotelCode)],
    },
  };

  let rates;

  try {
    const res = await axios.post(
      `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
      params,
      config
    );

    rates = res.data.hotels.hotels;
    console.log(res.data);
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  const pusher = new Pusher({
    appId: '1181230',
    key: 'ca0bc1e2cf4ba8c9f16b',
    secret: 'c547bb16a62fc06f6d2a',
    cluster: 'eu',
    useTLS: true,
  });

  pusher.trigger('my-channel', 'my-event', {
    message: rates,
  });
}

export const handler = commonMiddleware(pusherAPI).use(cors());
