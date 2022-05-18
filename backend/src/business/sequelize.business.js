const { sequelize } = require("../modules/sequelize");
const { ok, failure } = require("../modules/http");
const { SequelizeAuto } = require("sequelize-auto");
const { DatabaseFailure, OkStatus, ErrorStatus } = require("../modules/codes");
const fs = require("fs");

module.exports = {
  async connection() {
    await sequelize.authenticate();

    return ok({
      status: OkStatus,
      response: {
        message: "Teste de conexão ao banco de dados realizada com sucesso.",
      },
    });
  },

  async generate() {
    let response = null;

    const options = {
      directory: "sequelize/models",
      noAlias: true,
    };

    const auto = new SequelizeAuto(sequelize, null, null, options);

    await auto
      .run()
      .then((data) => {
        const arquivosCriados = Object.getOwnPropertyNames(data.tables).map(
          (name) => name + ".js"
        );

        fs.readdirSync("./sequelize/models").forEach((file) => {
          if (!arquivosCriados.includes(file) && file !== "init-models.js") {
            fs.unlinkSync("./sequelize/models/" + file);
          }
        });

        response = ok({
          status: OkStatus,
          response: {
            message: "Modelos do banco de dados gerados com sucesso.",
          },
        });
      })
      .catch((error) => {
        response = failure({
          status: ErrorStatus,
          code: DatabaseFailure,
          message: error.message,
        });
      });

    return response;
  },

  async force() {
    console.log("Iniciando push do banco de dados.");
    await sequelize.sync({ force: true });
    console.log("Push do banco de dados finalizado.");

    return ok({
      status: OkStatus,
      response: {
        message: "Push do banco de dados finalizado.",
      },
    });
  },
};
