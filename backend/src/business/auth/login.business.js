const cognito = require("../../aws/cognito");

const {
  IncorrectParameter,
  OkStatus,
  ErrorStatus,
  InternalServerError,
} = require("../../modules/codes");
const {
  ok,
  badRequest,
  tooManyRequests,
  failure,
} = require("../../modules/http");

module.exports = {
  async login(email, password) {
    try {
      const tokens = await cognito.login(email, password);

      return ok({
        status: OkStatus,
        response: {
          ...tokens,
        },
      });
    } catch (error) {
      switch (error.message) {
        case "Incorrect username or password.":
          return badRequest({
            status: ErrorStatus,
            code: IncorrectParameter,
            message: "Email ou senha de usuário incorretos.",
          });
        case "Password attempts exceeded":
          return tooManyRequests({
            status: "error",
            code: IncorrectParameter,
            message:
              "Tentativas de login excedidas, tente novamente dentre de alguns instantes.",
          });
        default:
          return failure({
            status: ErrorStatus,
            code: InternalServerError,
            message: `Erro durante procedimento de login: ${error.message}`,
          });
      }
    }
  },
};
