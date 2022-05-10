const { CognitoJwtVerifier } = require("aws-jwt-verify");

const {
  ErrorStatus,
  IncorrectParameter,
  JWTFailure,
  JWTExpired,
} = require("../../modules/codes");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

module.exports = {
  async verifyToken(token) {
    if (token) {
      try {
        const payload = await verifier.verify(token);
        return payload;
      } catch (error) {
        return {
          status: ErrorStatus,
          code: JWTFailure,
          message: `Falha na verificação do token informado: ${error.message}`,
        };
      }
    } else {
      return {
        status: ErrorStatus,
        code: IncorrectParameter,
        message: "Nenhum token de autenticação informado.",
      };
    }
  },
};
