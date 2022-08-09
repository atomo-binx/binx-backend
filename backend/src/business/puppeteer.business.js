const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";
const LogisticaBusiness = require("../business/logistica.business");
const Bling = require("../bling/bling");

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
      console.log(pedido.idpedidovenda);

      const pedidoBling = await Bling.pedidoVenda(pedido.idpedidovenda);

      if (pedidoBling.length === 0) {
        console.log(filename, `O pedido de venda ${pedido.idpedidovenda} não foi encontrado.`);
        continue;
      }

      const { metodosFrete } = await LogisticaBusiness.adquirirMetodosFrete(pedidoBling);

      console.log({ metodosFrete });
    }
  },

  async escolherMelhorMetodo(metodosFrete) {
    // Variáveis para controle na tabela de frete forçado
    let valorSedex = 0;
    let valorPac = 0;
    let valorDlog = 0;

    let prazoSedex = 0;
    let prazoPac = 0;
    let prazoDlog = 0;

    // Aplica lógica de seleção de melhor método
    for (const metodo of metodosFrete) {
      // Salva os valores de cada método que retornaram como resultado
      switch (metodo.servico) {
        case "dlog":
          valorDlog = parseFloat(metodo.preco);
          prazoDlog = parseInt(metodo.prazo);
          break;
        case "sedex":
          valorSedex = parseFloat(metodo.preco);
          prazoSedex = parseInt(metodo.prazo);
          break;
        case "pac":
          valorPac = parseFloat(metodo.preco);
          prazoPac = parseInt(metodo.prazo);
          break;
        default:
          break;
      }

      // Aplica seleção de método
      if (!metodo.erro) {
        if (metodo.prazo <= prazoSolicitado && parseFloat(metodo.preco) < parseFloat(melhorPreco)) {
          metodoEscolhido = metodo.servico;
          melhorPrazo = metodo.prazo;
          melhorPreco = metodo.preco;
        }
      }
    }

    // Já possui um método escolhido
    if (metodoEscolhido) {
      // Aplicar nova regra de seleção caso a transportadora escolhida seja Correios
      if (metodoEscolhido === "sedex" || metodoEscolhido === "pac") {
        for (const metodo of metodosFrete) {
          // Verificação forçada para Dlog
          if (metodo.servico === "dlog") {
            // Verificar se o prazo da dlog atende
            if (metodo.prazo <= prazoSolicitado) {
              // Prazo atende, forçar dlog
              console.log(
                filename,
                `Pedido de Venda: ${pedido.idpedidovenda} - Forçando escolha de frete para DLOG`
              );
              metodoEscolhido = metodo.servico;
              melhorPrazo = metodo.prazo;
              melhorPreco = metodo.preco;

              // Escrever no banco de dados que o frete foi forçado
              await FreteForcado.upsert({
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
        `Prazo solicitado: ${prazoSolicitado}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Método escolhido: ${metodoEscolhido}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Prazo do método escolhido: ${melhorPrazo}`
      );

      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        `Preço do método escolhido: ${melhorPreco}`
      );
    }
  },
};
