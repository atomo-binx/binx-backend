const stream = require("stream");
const EtiquetaBusiness = require("../business/etiqueta.business");
const fs = require("fs");

module.exports = {
  async etiquetaProduto(req, res) {
    const resposta = await EtiquetaBusiness.etiquetaProduto(req);

    if (resposta.statusCode == 200) {
      const filename = resposta.body;

      fs.createReadStream(filename).pipe(res);
    } else {
      res.status(resposta.statusCode).json(resposta.body);
    }
  },

  async etiquetaPedido(req, res) {
    const resposta = await EtiquetaBusiness.etiquetaPedido(req);

    if (resposta.statusCode == 200) {
      const filename = resposta.body;

      fs.createReadStream(filename).pipe(res);
    } else {
      res.status(resposta.statusCode).json(resposta.body);
    }
  },
};
