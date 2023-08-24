const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
      required: ['username', 'password'],
    },
  },
  required: ['body'],
};

export default schema;
