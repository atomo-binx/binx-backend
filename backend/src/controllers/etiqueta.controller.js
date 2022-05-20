const stream = require("stream");
const EtiquetaBusiness = require("../business/etiqueta.business");
const fs = require("fs");
const { OkStatus } = require("../modules/codes");

module.exports = {
  async etiquetaProduto(req, res, next) {
    try {
      const idsku = parseInt(req.body["idsku"]);
      const quantidade = parseInt(req.body["quantidade"]);
      const etiquetaSimples = req.body["etiquetaSimples"] || false;

      const resposta = await EtiquetaBusiness.etiquetaProduto(
        idsku,
        quantidade,
        etiquetaSimples
      );

      if (resposta.body.status === OkStatus) {
        const filename = resposta["body"]["response"]["filename"];
        fs.createReadStream(filename).pipe(res);
        fs.unlinkSync(filename);
        return;
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async etiquetaPedido(req, res, next) {
    try {
      const { pedidos } = req.body;

      const resposta = await EtiquetaBusiness.etiquetaPedido(pedidos);

      if (resposta.body.status === OkStatus) {
        const filename = resposta["body"]["response"]["filename"];
        fs.createReadStream(filename).pipe(res);
        fs.unlinkSync(filename);
        return;
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },
};
