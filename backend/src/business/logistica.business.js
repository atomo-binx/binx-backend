const Bling = require("../bling/bling");
const { IncorrectParameter, NotFound } = require("../modules/codes");
const { ok, badRequest, notFound, failure } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";
const { dictionary } = require("../utils/dict");
const axios = require("axios");

module.exports = {
  async calcularFrete(numero, tipo, venda) {
    if (numero && tipo) {
      if (tipo === "pedido") venda = await Bling.pedidoVenda(numero);
      if (tipo === "proposta") venda = await Bling.propostaComercial(numero);
    }

    if (venda.length === 0) {
      return notFound({
        code: NotFound,
        message: "O pedido ou proposta informada não foi encontrada.",
      });
    }

    // Adquirir os produtos no Binx
    let itens = await models.tbproduto.findAll({
      attributes: ["idsku", "peso"],
      where: {
        idsku: {
          [Op.in]: venda.itens.map((item) => item.idsku),
        },
      },
      raw: true,
    });

    // Gerar dicionário de produtos obtidos do Binx
    const dicionarioPesos = dictionary(itens, "idsku");

    // Mesclar os produtos da venda com os resultados do Binx
    itens = venda.itens.map((item) => {
      const peso = dicionarioPesos[item.idsku] ? dicionarioPesos[item.idsku].peso : 0;

      return {
        idsku: item.idsku,
        nome: item.nome,
        quantidade: item.quantidade,
        peso: parseFloat(peso),
        pesoTotal: parseInt(item.quantidade) * peso || 0,
      };
    });

    // Flag de produto com peso zerado
    const possuiPesoZero = itens.map((item) => parseFloat(item.peso)).includes(0);

    // Adquire métodos disponíveis de entrega para essa venda/proposta
    const metodosFrete = await this.calcularFreteFrenet(itens, venda.cep, venda.totalprodutos);

    // Montar resposta final para o retorno da API
    delete venda.itens;

    const resposta = {
      dados: venda,
      itens,
      possuiPesoZero,
      metodosFrete,
    };

    return ok({
      response: {
        logistica: resposta,
      },
    });
  },

  async calcularFreteFrenet(itens, cep, valor) {
    const ShippingItemArray = itens
      .filter((item) => parseFloat(item.peso) > 0)
      .map((item) => {
        return {
          Quantity: parseInt(item.quantidade),
          Weight: parseFloat(item.peso),
        };
      });

    const body = {
      SellerCEP: "07094000",
      RecipientCEP: cep.replace(/[^0-9]/g, ""),
      ShipmentInvoiceValue: parseFloat(valor),
      ShippingItemArray: ShippingItemArray,
    };

    console.log(body);

    // A API da Frenet não possui código de erro, apenas um campo chamado "message"
    // Todas as requisições retornam código HTTP 200, portanto um erro não será capturado
    // É preciso verificar pelo campo "message" na resposta para verificar erro/sucesso

    const frenetApi = axios.create({
      baseURL: "http://api.frenet.com.br",
      headers: { token: process.env.FRENET_TOKEN },
    });

    const respostaFrenet = await frenetApi.post("/shipping/quote", body);

    if (respostaFrenet.data["ShippingSevicesArray"]) {
      const resultadosFrenet = respostaFrenet.data["ShippingSevicesArray"];

      const metodosFrete = resultadosFrenet.map((resultado) => {
        if (resultado["Error"]) {
          let respostaErro = resultado["Msg"].replace(".", "");

          if (respostaErro.includes("ERP-007")) {
            respostaErro = "CEP de origem não pode postar para o CEP de destino.";
          }

          return {
            transportadora: resultado["Carrier"],
            servico: resultado["ServiceDescription"],
            erro: resultado["Error"],
            resposta: respostaErro,
          };
        } else {
          const OriginalShippingPrice = parseFloat(resultado["OriginalShippingPrice"]).toFixed(2);
          const ShippingPrice = parseFloat(resultado["ShippingPrice"]).toFixed(2);

          return {
            transportadora: resultado["Carrier"],
            servico: resultado["ServiceDescription"],
            preco: Math.max(OriginalShippingPrice, ShippingPrice),
            prazoOriginal: parseInt(resultado["OriginalDeliveryTime"]),
            prazoGordura: parseInt(resultado["DeliveryTime"]),
          };
        }
      });

      return metodosFrete;
    } else {
      return [];
    }
  },
};
