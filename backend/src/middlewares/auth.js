const TokenBusiness = require("../business/auth/token.business");

async function protectedRoute(req, res, next) {
  const token = extractToken(req.headers);

  if (process.env.USE_AUTH === "true") {
    const decoded = await TokenBusiness.verifyToken(token);

    if (decoded["status"] === "error") {
      return res.status(401).json(decoded);
    }

    req.token = decoded;

    next();
  } else {
    next();
  }
}

function extractToken(headers) {
  const authorization = headers["authorization"];
  const token = authorization ? authorization.split(" ")[1] : "";
  return token;
}

module.exports = { protectedRoute };
