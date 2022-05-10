const ProdutoBusiness = require("../business/produto.business");

module.exports = {
  // Inicia a sincronização de produtos, pelo frontend ou por chamada lambda
  async startSync(req, res) {
    const resposta = await ProdutoBusiness.startSync(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  // Rota para recebe ro Callback de alteração de estoque de produtos
  async callbackProdutos(req, res) {
    const resposta = await ProdutoBusiness.callbackProdutos(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  async buscarProdutos(req, res){
    const resposta = await ProdutoBusiness.buscarProdutos(req);

    res.status(resposta.statusCode).json(resposta.body);
  }
};
