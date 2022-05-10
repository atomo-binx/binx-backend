const ProspeccaoBussines = require("../business/prospeccao.business");

module.exports = {
  // Criar um novo registro de prospecção
  async criarProspeccao(req, res) {
    const resposta = await ProspeccaoBussines.criarProspeccao(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  // Criar um novo registro de prospecção
  async atualizarProspeccao(req, res) {
    const resposta = await ProspeccaoBussines.atualizarProspeccao(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  // Validar um novo registro de prospecção para verificar se ele é permitido
  async validarProspeccao(req, res) {
    const resposta = await ProspeccaoBussines.validarProspeccao(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  // Listar as prospecções existentes
  async listarProspeccoes(req, res) {
    const resposta = await ProspeccaoBussines.listarProspeccoes(req);

    res.status(resposta.statusCode).json(resposta.body);
  },
};
