const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        passportNumber: {
          type: 'string',
        },
        checkInDate: {
          type: 'string',
        },
        checkOutDate: {
          type: 'string',
        },
        hotelName: {
          type: 'string',
        },
        bookingReference: {
          type: 'string',
        },
      },
      required: [
        'token',
        'name',
        'passportNumber',
        'checkInDate',
        'checkOutDate',
        'hotelName',
        'bookingReference',
      ],
    },
  },
  required: ['body'],
};

export default schema;
