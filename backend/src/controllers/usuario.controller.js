const business = require("../business/usuario.business");

const validation = require("../modules/validation");

const UserIdValidator = require("../validators/usuario/id.rules");
const NomeValidator = require("../validators/usuario/nome.rules");
const EmailValidator = require("../validators/usuario/email.rules");

module.exports = {
  // Lista todos os usuários existentes
  async listarUsuarios(req, res, next) {
    try {
      const response = await business.listarUsuarios();

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  // Realiza leitura de um usuário especifico
  async lerUsuario(req, res, next) {
    try {
      const userId = req.params["id"];

      const rules = [[userId, UserIdValidator]];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const response = await business.lerUsuario(userId);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }

    const { status, usuario } = await business.lerUsuario(req);

    if (status) {
      res.status(200).send(usuario);
    } else {
      res.status(500).send({
        message: "Falha na leitura de usuário",
      });
    }
  },

  // Criar um novo usuário
  async cadastrarUsuario(req, res, next) {
    try {
      const { nome, email } = req.body;

      const rules = [
        [nome, NomeValidator],
        [email, EmailValidator],
      ];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const response = await business.cadastrarUsuario(email, nome);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },

  // Completar um cadastro durante o primeiro acesso
  async atualizarUsuario(req, res, next) {
    try {
      const { usuario } = req.body;

      const response = await business.atualizarUsuario(usuario);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
