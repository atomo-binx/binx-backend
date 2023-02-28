const EmailBusiness = require("./email.business");
const Bling = require("../bling/bling");
const moment = require("moment");
const sequelize = require("../services/sequelize");
const { models } = require("../modules/sequelize");
const filename = __filename.slice(__dirname.length + 1) + " -";
const { ok, failure } = require("../modules/http");

module.exports = {
  async sincronizaPedidosVenda(all, periodo, situacao, unidade, tempo, pedidos) {
    let filtros = [];

    let dataHoje = moment().format("DD/MM/YYYY");
    let dataAnterior = moment().subtract(1, "days").format("DD/MM/YYYY");

    // Por padrão, sincronizar período de 1 dia
    let filtroEmissao = `dataEmissao[${dataAnterior} TO ${dataHoje}]`;

    // Sincronizar por unidade de tempo + valor
    if (unidade && tempo) {
      let dataAnterior = moment().subtract(unidade, tempo).format("DD/MM/YYYY");
      filtroEmissao = `dataEmissao[${dataAnterior} TO ${dataHoje}]`;
    }

    // Sincronizar por período definido
    if (periodo) filtroEmissao = `dataEmissao[${periodo}]`;

    // Sincronizar todo o período
    if (all) filtroEmissao = "";

    // Cláusula de situação
    if (situacao) filtros.push(`idSituacao[${situacao}]`);

    // Concatenar e montar o filtro final
    filtros.push(filtroEmissao);
    filtros = filtros.length > 1 ? filtros.join(";") : filtros[0];

    if (pedidos) {
      console.log(filename, "Sincronizando uma lista de pedidos de venda.");
      await this.sincronizaListaPedidos(pedidos);

      return ok({
        response: "Sincronização de pedidos de venda finalizada.",
      });
    } else {
      console.log(filename, "Sincronizando através de filtros:", filtros);
      await this.sincronizaPaginasPedidos(filtros);

      return ok({
        response: "Sincronização de pedidos de venda finalizada.",
      });
    }
  },

  async callbackVendas(pedido) {
    try {
      const venda = Bling.desestruturaPedidoVenda(pedido);

      console.log(filename, `Pedido de Venda: ${venda.idpedidovenda} - Iniciando callback`);

      await this.sincronizaPedido(venda);

      return ok({
        message: `Callback de pedido de venda processado com sucesso.`,
      });
    } catch (error) {
      console.log(filename, `Falha durante callback de pedido de venda: ${error.message}`);
      return failure({
        message: `Falha durante callback de pedido de venda: ${error.message}`,
      });
    }
  },

  async sincronizaPaginasPedidos(filtros) {
    let inseridos = 0;

    let start = new Date();

    let procurando = true;
    let pagina = 1;

    while (procurando) {
      console.log(filename, "Iniciando busca na página:", pagina);

      const vendas = await Bling.listaPaginaVendas(pagina++, filtros);

      if (vendas.length > 0) {
        for (const venda of vendas) {
          try {
            await this.sincronizaPedido(venda);
            inseridos++;
          } catch (error) {
            console.log(
              filename,
              `Pedido de Venda: ${venda.idpedidovenda} -`,
              `Falha durante sincronização: ${error.message}`
            );
          }
        }

        // Adiantar a verificação de corte do próximo ciclo
        if (vendas.length < 100) {
          procurando = false;
        }
      } else {
        procurando = false;
      }
    }

    console.log(filename, "Finalizando procedimento de sincronização de pedidos de vendas.");

    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento:", elapsedTime);
    console.log(filename, "Total de pedidos sincronizados:", inseridos);
  },

  async sincronizaListaPedidos(pedidos) {
    let inseridos = 0;

    let start = new Date();

    for (const pedido of pedidos) {
      try {
        const venda = await Bling.pedidoVenda(pedido);

        await this.sincronizaPedido(venda);

        inseridos++;
      } catch (error) {
        console.log(filename, `Pedido de Venda: ${pedido} -`, error.message);
      }
    }

    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento:", elapsedTime);
    console.log(filename, "Total de pedidos sincronizados:", inseridos);
  },

  async vendaTransaction(pedido) {
    let { itens, ocorrencias, objFormaPagamento, objContato, ...dadosVenda } = pedido;

    return sequelize.transaction(async (t) => {
      // Atualiza entidade de forma de pagamento no banco de dados
      if (objFormaPagamento) {
        await models.tbformapagamento.upsert(objFormaPagamento, {
          transaction: t,
        });
      }

      // Atualiza entidade de contato no banco de dados
      if (objContato) {
        await models.tbcontato.upsert(objContato, {
          transaction: t,
        });
      }

      // Atualiza dados do pedido de venda
      await models.tbpedidovenda.upsert(dadosVenda, { transaction: t });

      // Atualiza relacionamentos de venda-produto
      if (itens) {
        await models.tbvendaproduto.destroy({
          where: {
            idpedidovenda: dadosVenda["idpedidovenda"],
          },
          transaction: t,
        });

        for (const relacionamento of itens) {
          await models.tbvendaproduto.upsert(relacionamento, {
            transaction: t,
          });
        }
      }

      // Tenta inserir relacionamentos de ocorrencias
      if (ocorrencias) {
        await models.tbocorrenciavenda.destroy({
          where: {
            idpedidovenda: dadosVenda["idpedidovenda"],
          },
          transaction: t,
        });

        for (const ocorrencia of ocorrencias) {
          await models.tbocorrenciavenda.create(
            {
              idocorrencia: "default",
              ...ocorrencia,
            },
            {
              transaction: t,
            }
          );
        }
      }
    });
  },

  async sincronizaPedido(pedido) {
    console.log(filename, `Pedido de Venda: ${pedido.idpedidovenda} - Iniciando sincronização.`);

    const pedidoExistente = await models.tbpedidovenda.findByPk(pedido.idpedidovenda);

    if (!pedidoExistente) {
      // Salvar o alias de transportadora
      if (pedido.transportadora === "Binx") {
        pedido["alias"] = pedido.servico;
      }

      // Na primeira inserção, calcular o custo de cada um dos produtos presentes na venda
      pedido.itens.forEach((produto) => {
        console.log(produto);
      });
    }

    return this.vendaTransaction(pedido).then(() => {
      return EmailBusiness.rotinaEmail(pedido);
    });
  },
};
