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
        departureDate: {
          type: 'string',
        },
        returnDate: {
          type: 'string',
        },
        airline: {
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
        'departureDate',
        'returnDate',
        'airline',
        'bookingReference',
      ],
    },
  },
  required: ['body'],
};

export default schema;
