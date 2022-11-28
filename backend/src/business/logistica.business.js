const Bling = require("../bling/bling");
const { NotFound } = require("../modules/codes");
const { ok, notFound } = require("../modules/http");
const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const { dictionary } = require("../utils/dict");
const Decimal = require("decimal.js");
const axios = require("axios");
const filename = __filename.slice(__dirname.length + 1) + " -";

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

    // Caso o cálculo seja de pedido de venda, escolher método de frete mais adequado
    let metodoEscolhido = {};
    let alias = null;
    let prazoSolicitado = null;

    try {
      if (tipo === "pedido") {
        metodoEscolhido = await this.escolherMelhorMetodo(metodosFrete, venda);
        alias = await this.adquirirAlias(venda.idpedidovenda);
        prazoSolicitado = await this.adquirirPrazoSolicitado(venda, alias);
      }
    } catch (error) {
      console.log(filename, error.message);
    }

    const resposta = {
      venda,
      itens,
      pesoTotal,
      possuiPesoZero,
      metodosFrete,
      metodoEscolhido,
      alias,
      prazoSolicitado,
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
    const shippingItens = itens
      .filter((item) => parseFloat(item.peso) > 0)
      .map((item) => {
        return {
          Quantity: parseInt(item.quantidade),
          Weight: parseFloat(item.peso),
        };
      });

    console.log(filename, "Objeto inicial de Shipping Array:", shippingItens);

    let pesoTotal = shippingItens.reduce((acc, current) => acc + current.Quantity * current.Weight, 0);

    pesoTotal = Number(Number(pesoTotal).toFixed(3));

    console.log(filename, "Peso total acumulado:", pesoTotal);

    const ShippingItemArray = [
      {
        Quantity: 1,
        Weight: pesoTotal,
      },
    ];

    console.log(filename, "Objeto final de Shipping Array:", ShippingItemArray);

    const body = {
      SellerCEP: "07094000",
      RecipientCEP: cep.replace(/[^0-9]/g, ""),
      ShipmentInvoiceValue: parseFloat(valor),
      ShippingItemArray: ShippingItemArray,
    };

    console.log(filename, "Requisição enviada a Frenet:");
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

      console.log(filename, "Resposta da Frenet:");
      console.log(resultadosFrenet);

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

  async adquirirPrazoSolicitado(pedido, alias = null) {
    let prazoSolicitado = NaN;

    // Tentar definir através do campo de "serviço"
    if (pedido.servico !== null && pedido.servico !== undefined) {
      prazoSolicitado = parseInt(pedido.servico.replace(/[^0-9]/g, ""));
    }

    // Se o prazo solicitado não pode ser obtido através do campo de serviço
    // É possível que o puppeteer tenha tentado alterar esse pedido e falhou
    // Prosseguir tentando extrair o prazo solicitado a partir do campo de "alias"
    if (isNaN(prazoSolicitado)) {
      if (!alias) {
        alias = await this.adquirirAlias(pedido.idpedidovenda);
      }

      if (alias !== undefined && alias !== null) {
        prazoSolicitado = parseInt(alias.replace(/[^0-9]/g, ""));
      }
    }

    // Caso nenhuma das tentativas tenha obtido sucesso, não será possível calcular o frete
    if (isNaN(prazoSolicitado)) {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} - Não foi possível identificar o prazo solicitado.`
      );
      throw Error(
        `Pedido de Venda: ${pedido.idpedidovenda} - Não foi possível identificar o prazo solicitado.`
      );
    }

    return prazoSolicitado;
  },

  async escolherMelhorMetodo(metodosFrete, pedido) {
    // Variáveis para controle na tabela de frete forçado
    let valorSedex, valorPac, valorDlog;
    let prazoSedex, prazoPac, prazoDlog;

    // Variáveis para escolha de método
    let melhorPreco = Infinity;
    let metodoEscolhido = null;

    // Adquirir o prazo solicitado
    let prazoSolicitado;

    try {
      prazoSolicitado = await this.adquirirPrazoSolicitado(pedido);
    } catch (error) {
      throw Error(error.message);
    }

    for (const metodo of metodosFrete) {
      if (!metodo.erro) {
        // Salva os valores de cada método que retornaram como resultado
        // Para o cálculo de frete executado pelo Puppeteer, considerar o prazo com gordura
        // Esse prazo é o mesmo que o cliente obteve nos resultados do site
        switch (metodo.servicoTraduzido) {
          case "DLog":
            valorDlog = metodo.preco;
            prazoDlog = metodo.prazoGordura;
            break;
          case "SEDEX":
            valorSedex = metodo.preco;
            prazoSedex = metodo.prazoGordura;
            break;
          case "PAC":
            valorPac = metodo.preco;
            prazoPac = metodo.prazoGordura;
            break;
          default:
            break;
        }

        if (metodo.prazoGordura <= prazoSolicitado && metodo.preco < melhorPreco) {
          metodoEscolhido = metodo;
          melhorPreco = metodo.preco;
        }
      }
    }

    if (metodoEscolhido) {
      // Aplicar nova regra de seleção caso a transportadora escolhida seja Correios
      // Caso o método escolhido seja Correios (SEDEX ou PAC), verificar o prazo da DLog
      // Se o prazo da DLog atender, forçar a escolha como DLog, mesmo que o preço seja maior
      if (metodoEscolhido.transportadora === "Correios") {
        const metodoDlog = metodosFrete.filter((metodo) => metodo.transportadora === "DLog")[0];

        if (metodoDlog) {
          if (metodoDlog.prazoGordura <= prazoSolicitado) {
            metodoEscolhido = metodoDlog;
            melhorPreco = metodoDlog.preco;

            // Escrever no banco de dados que o frete foi forçado
            await models.tbfreteforcado.upsert({
              idpedidovenda: pedido.idpedidovenda,
              valorsedex: valorSedex,
              prazosedex: prazoSedex,
              valorpac: valorPac,
              prazopac: prazoPac,
              valordlog: valorDlog,
              prazodlog: prazoDlog,
              prazosolicitado: prazoSolicitado,
            });
          }
        }
      }
    }

    if (metodoEscolhido != undefined) {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Serviço solicitado: ${pedido.servico}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Alias registrado: ${pedido.alias}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Prazo solicitado: ${prazoSolicitado}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Método escolhido: ${metodoEscolhido.servicoTraduzido}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Prazo do método escolhido: ${metodoEscolhido.prazoGordura}`
      );
    } else {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda}:`,
        "Não foi possível escolher um método de frete para este pedido."
      );
    }

    return metodoEscolhido;
  },

  async adquirirAlias(idpedidovenda) {
    const alias = await models.tbpedidovenda.findByPk(idpedidovenda, {
      attributes: ["alias"],
      raw: true,
    });

    if (Object.prototype.hasOwnProperty.call(alias, "alias")) {
      return alias.alias;
    }

    return null;
  },
};
