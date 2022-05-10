module.exports = {
  ok(body) {
    return {
      statusCode: 200,
      body,
    };
  },

  created(body) {
    return {
      statusCode: 201,
      body,
    };
  },

  badRequest(body) {
    return {
      statusCode: 400,
      body,
    };
  },

  failure(body) {
    return {
      statusCode: 500,
      body,
    };
  },
};
