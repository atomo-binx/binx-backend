const EtiquetaBusiness = require("../business/etiqueta.business");
const fs = require("fs");
const { OkStatus } = require("../modules/codes");

module.exports = {
  async etiquetaProduto(req, res, next) {
    try {
      const idsku = parseInt(req.query["idsku"]);
      const quantidade = parseInt(req.query["quantidade"]);
      const etiquetaSimples = req.query["etiquetaSimples"] || false;

      const resposta = await EtiquetaBusiness.etiquetaProduto(idsku, quantidade, etiquetaSimples);

      if (resposta.body.status === OkStatus) {
        const filename = resposta["body"]["response"]["filename"];
        fs.createReadStream(filename).pipe(res);
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
      const { pedido } = req.query;

      const resposta = await EtiquetaBusiness.etiquetaPedido(pedido);

      if (resposta.body.status === OkStatus) {
        const filename = resposta["body"]["response"]["filename"];
        fs.createReadStream(filename).pipe(res);
        return;
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async removerEtiquetas(req, res, next) {
    try {
      const resposta = await EtiquetaBusiness.removerEtiquetas();

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async etiquetaPersonalizada(req, res, next) {
    try {
      const resposta = await EtiquetaBusiness.etiquetaPersonalizada();

      if (resposta.body.status === OkStatus) {
        const filename = resposta["body"]["response"]["filename"];
        fs.createReadStream(filename).pipe(res);
        return;
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async etiquetaEstrutura(req, res, next) {
    try {
      const idsku = parseInt(req.query["idsku"]);

      const resposta = await EtiquetaBusiness.etiquetaEstrutura(idsku);

      if (resposta.body.status === OkStatus) {
        const filename = resposta["body"]["response"]["filename"];
        fs.createReadStream(filename).pipe(res);
        return;
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },
};
