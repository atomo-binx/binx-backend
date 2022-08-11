const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";
const LogisticaBusiness = require("../business/logistica.business");
const VendaBusiness = require("../business/venda.business");
const Bling = require("../bling/bling");
const Puppeteer = require("../puppeteer/puppeteer");

module.exports = {
  async alterarTransportadora() {
    console.log(filename, "Iniciando procedimento de alteração de transportadora.");

    const pedidos = await models.tbpedidovenda.findAll({
      where: {
        transportadora: "Binx",
        idstatusvenda: {
          [Op.notIn]: [9, 12],
        },
      },
      raw: true,
    });

    console.log(filename, "Quantidade de pedidos para alteração:", pedidos.length);

    for (const pedido of pedidos) {
      try {
        if (pedido.idpedidovenda == 142889) continue;

        const pedidoBling = await Bling.pedidoVenda(pedido.idpedidovenda);

        const { metodosFrete } = await LogisticaBusiness.adquirirMetodosFrete(pedidoBling);

        const melhorMetodo = await this.escolherMelhorMetodo(metodosFrete, pedido);

        await Puppeteer.alterarTransportadora(
          pedido.idpedidovenda.toString(),
          melhorMetodo.servicoTraduzido
        );

        await VendaBusiness.novaSincronizaListaPedidos([pedido.idpedidovenda]);

        await models.tbpedidovenda.update(
          {
            fretetransportadora: melhorMetodo.preco,
          },
          {
            where: {
              idpedidovenda: pedido.idpedidovenda,
            },
          }
        );
      } catch (error) {
        console.log(error.message);
      }
    }
  },

  async adquirirPrazoSolicitado(pedido) {
    let prazoSolicitado = NaN;

    // Tentar definir através do campo de "serviço"
    if (pedido.servico !== null && pedido.servico !== undefined) {
      prazoSolicitado = parseInt(pedido.servico.replace(/[^0-9]/g, ""));
    }

    // Se o prazo solicitado não pode ser obtido através do campo de serviço
    // É possível que o puppeteer tenha tentado alterar esse pedido e falhou
    // Prosseguir tentando extrair o prazo solicitado a partir do campo de "alias"
    if (isNaN(prazoSolicitado)) {
      prazoSolicitado = parseInt(pedido.alias.replace(/[^0-9]/g, ""));
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
    let metodoEscolhido;

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

    if (metodoEscolhido) {
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
    }

    return metodoEscolhido;
  },
};
