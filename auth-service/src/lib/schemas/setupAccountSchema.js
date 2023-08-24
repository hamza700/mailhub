const schema = {
  properties: {
    body: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        surname: {
          type: 'string',
        },
        mobile: {
          type: 'number',
          minLength: 11,
        },
        landline: {
          type: 'number',
          minLength: 11,
        },
        compName: {
          type: 'string',
        },
        accessCode: {
          type: 'string',
        },
        logo: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
        address: {
          type: 'string',
        },
        postCode: {
          type: 'string',
        },
      },
      required: [
        'name',
        'landline',
        'mobile',
        'title',
        'surname',
        'compName',
        'accessCode',
        'logo',
        'email',
        'address',
        'postCode',
      ],
    },
  },
  required: ['body'],
};

export default schema;
