const Bling = require("../bling/bling");
const { NotFound } = require("../modules/codes");
const { ok, notFound } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const { dictionary } = require("../utils/dict");
const Decimal = require("decimal.js");
const axios = require("axios");
// const filename = __filename.slice(__dirname.length + 1) + " -";

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

    // Adquirir os métodos de frete e relação de itens e pesos
    const { metodosFrete, itens } = await this.adquirirMetodosFrete(venda);

    // Calcular peso total
    const pesoTotal = itens.reduce((acc, item) => new Decimal(acc).plus(item.pesoTotal), 0);

    // Flag de produto com peso zerado
    const possuiPesoZero = itens.map((item) => parseFloat(item.peso)).includes(0);

    // Montar resposta final para o retorno da API
    delete venda.itens;

    const resposta = {
      venda,
      itens,
      pesoTotal,
      possuiPesoZero,
      metodosFrete,
    };

    return ok({
      response: {
        logistica: resposta,
      },
    });
  },

  async adquirirMetodosFrete(venda) {
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
        quantidade: new Decimal(item.quantidade),
        peso: new Decimal(peso),
        pesoTotal: new Decimal(item.quantidade).times(peso) || 0,
      };
    });

    // Adquire métodos disponíveis de entrega para essa venda/proposta
    let metodosFrete = await this.calcularFreteFrenet(itens, venda.cep, venda.totalprodutos);

    // Realizar tradução dos métodos de ferete
    metodosFrete = await this.traduzirMetodosFrete(metodosFrete);

    return {
      itens,
      metodosFrete,
    };
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

  async traduzirMetodosFrete(metodos) {
    let correios = [];
    let metodosFrete = [...metodos];

    for (const metodo of metodosFrete) {
      if (!metodo.erro) {
        switch (metodo.transportadora) {
          // Para Dlog, traduzir e inserir na lista de métodos traduzidos
          case "DLog":
            metodo.servicoTraduzido = "DLog";
            break;

          // Para Correios, inserir na lista de ocorrências de correios
          case "Correios":
            correios.push(metodo);
            break;
        }
      }
    }

    // Verifica quantidade de ocorrências para transportadora Correios
    if (correios.length == 2) {
      // A ocorrência com menor prazo vira sedex
      if (correios[0].prazo < correios[1].prazo) {
        correios[0].servicoTraduzido = "SEDEX";
        correios[1].servicoTraduzido = "PAC";
      } else {
        correios[0].servicoTraduzido = "PAC";
        correios[1].servicoTraduzido = "SEDEX";
      }
    } else if (correios.length == 1) {
      // Apenas uma ocorrência de correios é identificada como sedex
      correios[0].servicoTraduzido = "SEDEX";
    }

    return metodosFrete;
  },
};
