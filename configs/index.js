const { GraphQLClient } = require('graphql-request');

const Client = new GraphQLClient(process.env.HASURA_API, {
  credentials: 'include',
  mode: 'cors',
  headers: {
    'x-hasura-admin-secret': process.env.HASURA_SECRET_ADMIN,
  },
});

module.exports = Client;
