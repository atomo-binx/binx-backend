module.exports = {
  ok(body) {
    return {
      statusCode: 200,
      body: body,
    };
  },

  created(body) {
    return {
      statusCode: 201,
      body: body,
    };
  },

  badRequest(body) {
    return {
      statusCode: 400,
      body: body,
    };
  },

  unauthorized(body) {
    return {
      statusCode: 401,
      body: body,
    };
  },

  forbidden(body) {
    return {
      statusCode: 403,
      body: body,
    };
  },

  notFound(body) {
    return {
      statusCode: 404,
      body: body,
    };
  },

  failure(body) {
    return {
      statusCode: 500,
      body: body,
    };
  },

  conflict(body) {
    return {
      statusCode: 409,
      body: body,
    };
  },

  tooManyRequests(body) {
    return {
      statusCode: 429,
      body: body,
    };
  },
};
