const cognito = require("../aws/cognito");

const Usuario = require("../models/usuario.model");
const { models } = require("../modules/sequelize");

const {
  OkStatus,
  ErrorStatus,
  InternalServerError,
  DatabaseFailure,
  UserNotFound,
} = require("../modules/codes");

const { ok, failure, notFound } = require("../modules/http");

const http = require("../utils/http");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async lerUsuario(userId) {
    try {
      const usuario = await cognito.lerUsuario(userId);

      return ok({
        status: OkStatus,
        response: {
          usuario: usuario,
        },
      });
    } catch (error) {
      console.log(filename, "Erro na leitura de usuário:", error.message);

      return notFound({
        status: ErrorStatus,
        code: UserNotFound,
        response: `Erro durante a leitura de usuário: ${error.message}`,
      });
    }
  },

  async listarUsuarios() {
    try {
      const usuariosCognito = await cognito.listarUsuarios();

      return ok({
        status: OkStatus,
        response: {
          usuarios: usuariosCognito,
        },
      });
    } catch (error) {
      return failure({
        status: ErrorStatus,
        code: InternalServerError,
        message: `Erro ao listar usuários: ${error.message}`,
      });
    }
  },

  async cadastrarUsuario(email, nome) {
    // Rotina de Cadastro de Novo Usuário

    // 1 - Cadastrar usuário no Cognito
    // 2 - Cadastrar usuário no Binx
    // Obs: Em falha de cadastro no Binx, remover o cadastro do Cognito
    // Obs: Em falha de cadastro no Cognito, não prosseguir com o cadastro no Binx

    try {
      // 1 - Cadastrar Usuário no Cognito
      let usuarioCognito = null;

      let erroCognito = "";

      await cognito
        .cadastrarUsuario(email, nome)
        .then((usuario) => {
          usuarioCognito = usuario;
        })
        .catch((error) => {
          console.log(
            filename,
            "Falha na criação de usuário no cógnito:",
            error.message
          );
          erroCognito = error;
        });

      // Verifica status da criação de usuário no Cognito
      if (!usuarioCognito) {
        return failure({
          status: ErrorStatus,
          code: InternalServerError,
          message: `Falha na criação de usuário no cógnito: ${erroCognito}`,
        });
      }

      // 2 - Cadastrar Usuário no Binx
      let usuarioBinx = null;

      try {
        usuarioBinx = await Usuario.create(usuarioCognito);
      } catch (error) {
        console.log(
          filename,
          "Falha na criação de usuário no Binx:",
          error.message
        );

        // Reverter criação do usuário no Cognito!!!!
        // ...
      }

      // 3 - Retornar
      if (usuarioCognito && usuarioBinx) {
        return ok({
          status: OkStatus,
          response: {
            usuario: usuarioBinx,
          },
        });
      } else {
        return failure({
          status: ErrorStatus,
          code: InternalServerError,
          message: `Erro durante a criação de usuário.`,
        });
      }
    } catch (error) {
      console.log(
        filename,
        `Erro durante procedimento de criação de usuário: ${error.message}`
      );
      return failure({
        status: ErrorStatus,
        code: InternalServerError,
        message: `Erro durante procedimento de criação de usuário: ${error.message}`,
      });
    }
  },

  async atualizarUsuario(usuario) {
    try {
      const updated = await Usuario.update(
        {
          nome: usuario.nome,
        },
        {
          where: {
            idusuario: usuario.idusuario,
          },
        }
      );

      if (updated) {
        return ok({
          status: OkStatus,
          response: {
            usuario: {
              ...usuario,
            },
          },
        });
      } else {
        return ok({
          status: ErrorStatus,
          code: DatabaseFailure,
          message: "Falha na atualização do usuário no banco de dados.",
        });
      }
    } catch (error) {
      console.log(
        filename,
        `Erro durante o procedimento de completar cadastro de usuário: ${error.message}`
      );
      return http.failure({
        message: `Erro durante o procedimento de completar cadastro de usuário: ${error.message}`,
      });
    }
  },

  async sincronizarUsuarios() {
    try {
      const usuariosCognito = await cognito.listarUsuarios();

      const updated = await models.tbusuario.bulkCreate(usuariosCognito, {
        updateOnDuplicate: ["situacao", "nome"],
      });

      if (updated) {
        return ok({
          status: OkStatus,
          response: {
            message: "Usuários sincronizados com sucesso.",
          },
        });
      } else {
        return failure({
          status: ErrorStatus,
          code: DatabaseFailure,
          message: "Falha durante atualização de usuários no banco de dados.",
        });
      }
    } catch (error) {
      console.log(filename, "Erro ao sincronizar usuários:", error.message);

      return failure({
        status: ErrorStatus,
        code: InternalServerError,
        response: `Erro ao sincronizar usuários:: ${error.message}`,
      });
    }
  },
};
