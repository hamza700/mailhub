const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
        },
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
          minLength: 8,
        },
      },
      required: ['email', 'username', 'password'],
    },
  },
  required: ['body'],
};

export default schema;
