module.exports = {
  // Código de retorno para status de operações bem sucedidas
  OkStatus: "ok",

  // Código de retorno para status de operações que não foram bem sucedidas
  ErrorStatus: "error",

  // Erro interno de operação do sistema
  InternalServerError: "InternalServerError",

  // Parâmetro inexistente ou mal formatado
  IncorrectParameter: "IncorrectParameter",

  // O número de tentativas limite para uma requisição foram excedidas
  TooManyRequests: "TooManyRequests",

  // Falha na manipulação de algum registro de escrita ou leitura no banco de dados
  DatabaseFailure: "DatabaseFailure",

  JWTFailure: "JWTFailure",
  JWTExpired: "JWTExpired",
};
