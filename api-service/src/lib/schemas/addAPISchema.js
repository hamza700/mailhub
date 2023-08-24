const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        endpoint: {
          type: 'string',
        },
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
        status: {
          type: 'string',
        },
      },
      required: ['name', 'type', 'endpoint', 'username', 'password', 'status'],
    },
  },
  required: ['body'],
};

export default schema;
