const http = require("../utils/http");
const filename = __filename.slice(__dirname.length + 1) + " -";

const { atualizaCusto } = require("./custo/atualiza_custo");

const Bling = require("../bling/bling");

const sequelize = require("../services/sequelize");
const { Op } = require("sequelize");

const moment = require("moment");
const { dictionary } = require("../utils/dict");

const { ok } = require("../modules/http");
const { OkStatus } = require("../modules/codes");

const { models } = require("../modules/sequelize");
const { failure } = require("../utils/http");

module.exports = {
  // Inicia análise de pedidos de compra em segundo plano
  async analisa() {
    console.log(filename, "Análise de pedidos de compra iniciada.");

    this.analisaPedidosCompra();

    return ok({
      status: OkStatus,
      response: {
        message: "Análise de pedidos de compra iniciada.",
      },
    });
  },

  // Rotina de sincronização de pedidos de compra
  async sincronizaPedidosCompra(tudo, inicio, fim, periodo, valor, situacao, pedidos) {
    try {
      // Na rotina de sincronização, duas etapas são realidas:
      // 1 - Os pedidos de compra são sincronizados (copiados do Bling para o Binx)
      // 2 - Os pedidos de compra são analisados (identificado a sua situação)

      // Por padrão, sincronizar os pedidos de compra criados no dia de hoje
      // Por padrão, sincronizar todas as situações de pedido

      // Monta filtros padrão
      let dataInicial = moment().format("DD/MM/YYYY");
      let dataFinal = dataInicial;
      let filtrosBling = `dataEmissao[${dataFinal} TO ${dataInicial}]`;

      // Sincronização através de período + valor
      if (periodo && valor) {
        let dataFinal = moment().subtract(valor, periodo).format("DD/MM/YYYY");

        filtrosBling = `dataEmissao[${dataFinal} TO ${dataInicial}]`;

        console.log(filename, "Sincronizando pedidos de compras para o período de:", valor, periodo);
      }

      // Sincronização por data de inicio e final
      if (inicio && fim) {
        filtrosBling = `dataEmissao[${inicio} TO ${fim}]`;

        console.log(filename, `Sincronizando pedidos de compra de ${inicio} até ${fim}.`);
      }

      // Sincronização de todo o período
      if (tudo) {
        if (tudo == "true") {
          filtrosBling = "";
          console.log(filename, "Sincronizando todo o período de pedidos de vendas.");
        }
      }

      // Cláusula de situação do pedido de compra
      if (situacao) {
        // Foi passada uma situação por parâmetro
        if (situacao != "all") {
          filtrosBling += `; situacao[${situacao}]`;
        }
      }

      if (pedidos) {
        console.log(filename, "Sincronizando uma lista de pedidos de compras.");

        await this.sincronizaListaPedidos(pedidos);
      } else {
        console.log(filename, "Sincronizando pedidos de compra através de filtros:", filtrosBling);

        await this.sincronizaPedidos(filtrosBling);
      }

      // Após sincronizar, chamar a função de análise de pedidos
      await this.analisaPedidosCompra(pedidos);

      return ok({
        message: "Sincronização de pedidos de compra finalizada.",
      });
    } catch (error) {
      console.log(
        filename,
        "Erro na execução de rotina de sincronização de pedidos de compra:",
        error.message
      );

      return failure({
        message: `Falha durante sincronização de pedidos de compra: ${error.message}`,
      });
    }
  },

  // Rotina de análise de pedidos de compra
  async analisaPedidosCompra(pedidos) {
    try {
      // Medida de tempo de execução
      let start = new Date();

      // Para realizar a busca de situação de pedidos de compra é necessário verificar o parametro de pedidos
      // Caso recebido uma lista, buscar dentro da maior e menor data da lista de pedidos
      // Caso não recebido, buscar dentro da maior e menor data de pedidos não concluídos do Binx

      let pedidosBinx = [];

      if (pedidos) {
        console.log(filename, "Analisando pedidos de compras com base em lista de pedidos.");

        // Adquirir todos os pedidos não concluídos do Binx
        pedidosBinx = await models.tbpedidocompra.findAll({
          where: {
            idpedidocompra: {
              [Op.in]: pedidos,
            },
          },
          order: [["datacriacao", "asc"]],
          raw: true,
        });
      } else {
        console.log(filename, "Analisando pedidos de compra com base no histórico geral.");

        // Adquirir todos os pedidos não concluídos do Binx
        pedidosBinx = await models.tbpedidocompra.findAll({
          where: {
            idstatus: {
              [Op.or]: {
                [Op.is]: null,
                [Op.or]: [0, 3],
              },
            },
          },
          order: [["datacriacao", "asc"]],
          raw: true,
        });
      }

      console.log(
        filename,
        pedidosBinx.map((ele) => [ele.idpedidocompra, ele.idstatus])
      );

      // Gerar dicionário dos pedidos retornados do Binx
      let dicPedidosBinx = dictionary(pedidosBinx, "idpedidocompra");

      console.log(filename, "Quantidade de pedidos de compra não concluídos no Binx:", pedidosBinx.length);

      // Gerar as datas de intervalo: data mais antiga e data mais nova
      let dataInicial = moment.utc(pedidosBinx[0]["datacriacao"]).format("DD/MM/YYYY");
      let dataFinal = moment.utc(pedidosBinx[pedidosBinx.length - 1]["datacriacao"]).format("DD/MM/YYYY");

      console.log(filename, "Data mais antiga:", dataInicial);
      console.log(filename, "Data mais nova:", dataFinal);

      let pedidosBling = [];

      const statusCompra = await models.tbstatuscompra.findAll({
        raw: true,
      });

      for (const status of statusCompra) {
        let pedidos = await this.listaPedidosCompra(dataInicial, dataFinal, status.idstatus);

        // Concatena a lista de pedidos do bling com os resultados dessa situação
        pedidosBling = [...pedidosBling, ...pedidos];
      }

      // Gerar dicionário com a lista de pedidos do Bling
      // Cada um dos pedidos agora possui um campo chamado "idstatus"
      // Este campo informa em qual situação do Bling o pedido foi encontrado

      let dicPedidosBling = dictionary(pedidosBling, "idpedidocompra");

      let pedidosAtualizar = [];
      let pedidosAtendidos = [];

      //Percorremos o dicionário de pedidos do Binx para trabalhar as alterações de status
      // Verificar quais pedidos precisam ser atualizados
      for (const chave in dicPedidosBinx) {
        try {
          let pedidoBling = dicPedidosBling[chave];
          let pedidoBinx = dicPedidosBinx[chave];

          // O novo status é o status que foi localizado no Bling
          let novoStatus = pedidoBling["idstatus"];

          let statusAtual = pedidoBinx["idstatus"];

          // Verifica por alterações no status
          if (novoStatus != statusAtual) {
            // Novo Status -> "Cancelado" ou "Atendido"
            if (novoStatus == 2 || novoStatus == 1) {
              // Configurar data de conclusão
              pedidoBling["dataconclusao"] = moment().format("YYYY-MM-DD HH:mm:ss");
            }

            // Novo Status -> "Em Aberto" ou "Em Andamento"
            if (novoStatus == 0 || novoStatus == 3) {
              pedidoBling["dataconclusao"] = null;
            }

            let ignorarFornecedores = [
              "7401278638", // Baú da Eletrônica
              "9172761844", // Loja Física
              "10733118103", // Transferência
            ];

            // Novo Status -> "Atendido"
            if (novoStatus == 1 && !ignorarFornecedores.includes(pedidoBling["idfornecedor"])) {
              // Alterar custos dos produtos
              pedidosAtendidos.push(pedidoBling);
            }

            // Por fim, acrescenta o objeto do pedido em uma lista de atualização
            pedidosAtualizar.push(pedidoBling);
          }
        } catch (error) {
          console.log(filename, "Falha no pedido:", chave, error.message);
        }
      }

      console.log(filename, "Quantidade de pedidos para atualizar status:", pedidosAtualizar.length);

      // O status foi localizado procurando em cada uma das listas do Bling
      // Prosseguir com a atualização dos pedidos que possuem status diferente entre Binx e Bling

      console.log(filename, "Iniciando atualizações nos pedidos de compra");

      // Após descobrir o status de cada um dos pedidos, podemos atualizar eles novamente no Binx
      let analisados = 0;
      let reprovados = [];

      for (const pedido of pedidosAtualizar) {
        // Nessa etapa o pedido é alterado por completo
        // Isso inclui dados do pedido, do fornecedor e dos itens
        await this.compraTransaction(pedido)
          .then(() => {
            analisados++;
          })
          .catch((error) => {
            // Falha na transação deste pedido de compra
            reprovados.push({
              idpedidocompra: pedido["idpedidocompra"],
              motivo: error.message,
            });
            console.log(
              filename,
              `Erro na iteração do pedido: ${pedido["idpedidocompra"]} - `,
              error.message
            );
          });
      }

      // Após atualizar os pedidos modificados no Bling, calcular os custos para pedidos atendidos
      // Pedidos atendidos irão alterar os valores de custos de produtos que contenham estruturas
      for (const pedido of pedidosAtendidos) {
        await atualizaCusto(pedido);
      }

      // Cálculo do tempo gasto na execução da tarefa
      let end = new Date();
      let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

      // Debug
      console.log(filename, "Atualização de pedidos de compra finalizada");
      console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
      console.log(filename, "Quantidade de pedidos de compra analisados:", analisados);
      console.log(filename, "Quantidade de pedidos rejeitados:", reprovados.length);
      console.log(filename, "Pedidos reprovados durante a análise:", reprovados);

      return http.ok({
        message: "Ok",
      });
    } catch (error) {
      console.log(filename, "Erro:", error.message);

      return http.failure({
        message: "Erro",
      });
    }
  },

  // Executa a sincronização de pedidos, adquirinho do Bling conforme os filtros passados
  async sincronizaPedidos(filtrosBling) {
    // Rotina para aquisição de pedidos de compra do Bling e sincronização com o Binx
    // 1 - Adquirir lista de pedidos de compra do Bling conforme filtros passados
    // 2 - Percorrer cada pedido retornado executar a sincronização

    // Medida de tempo de execução
    let start = new Date();

    // Procedimento de Busca
    let procurando = true;
    let pagina = 1;

    // Contadores de total de compras processadas e rejeitadas
    let processados = 0;
    let rejeitados = 0;
    let pedidosRejeitados = [];

    // Inicia busca de pedidos de compra no Bling conforme o parâmetro de filtros recebido
    while (procurando) {
      console.log(filename, "Iniciando busca na página:", pagina);

      const compras = await Bling.listaPaginaCompras(pagina++, filtrosBling);

      // Verifica se a chamada retornou pedidos de compra ou chegamos ao final dos resultados
      if (compras.length > 0) {
        // Passa por cada um dos resultados de pedidos de compras
        for (const compra of compras) {
          // Sincronizar o pedido
          await this.sincronizaPedido(compra)
            .then(() => {
              processados++;
            })
            .catch((error) => {
              rejeitados++;
              compra["motivo"] = error.message;
              pedidosRejeitados.push({
                idpedidocompra: compra["idpedidocompra"],
                motivo: compra["motivo"],
              });
            });
        }
      } else {
        // Chegamos ao fim das páginas de pedidos de compras
        procurando = false;
      }
    }

    console.log(filename, "Finalizando procedimento de sincronização de pedidos de compras.");

    // Cálculo do tempo gasto na execução da tarefa
    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
    console.log(filename, "Total de pedidos processados: ", processados);
    console.log(filename, "Total de pedidos recusados: ", rejeitados);

    console.log(filename, "Pedidos Rejeitados:", pedidosRejeitados);
  },

  // Executa a sincronização de pedidos de compra através de lista de pedidos de compra específicos
  async sincronizaListaPedidos(pedidos) {
    for (const pedido of pedidos) {
      try {
        const compra = await Bling.pedidoCompra(pedido);

        await this.sincronizaPedido(compra);
      } catch (error) {
        console.log(filename, `Falha na sincronização do pedido de compra: ${pedido}:`, error.message);
      }
    }
  },

  // Realiza a sincronização de 1 pedido de compra
  async sincronizaPedido(compra) {
    return new Promise((resolve, reject) => {
      console.log(
        filename,
        `Pedido de Compra: ${compra.idpedidocompra} -`,
        "Iniciando rotina de sincronização"
      );

      // Tenta realizar transação de inserção no banco de dados
      this.compraTransaction(compra)
        .then(() => {
          console.log(
            filename,
            `Pedido de Compra: ${compra.idpedidocompra} -`,
            "Transação de pedido de compra realizada com sucesso"
          );

          resolve();
        })
        .catch((error) => {
          console.log(
            filename,
            `Pedido de Compra: ${compra.idpedidocompra} -`,
            "Transação de pedido de compra não foi realizada:",
            error.message
          );

          reject(error);
        });
    });
  },

  // Realiza a transação de pedido de compra, compra produto e de fornecedor
  async compraTransaction(compra) {
    let { itens, fornecedor, categoria, parcelas, ...dadosCompra } = compra;

    return sequelize.transaction(async (t) => {
      // Tenta inserir relacionamento de fornecedor
      if (fornecedor) {
        await models.tbfornecedor.upsert(fornecedor, {
          transaction: t,
        });
      }

      // Tenta inserir a categoria do pedido de compra
      await models.tbcategoriapedidocompra.upsert(categoria, { transaction: t });

      // Tenta inserir dados do pedido de compra
      await models.tbpedidocompra.upsert(dadosCompra, { transaction: t });

      // Tenta inserir relacionamento de compra-produto
      if (itens) {
        // Apagar os registros de compra produto dessa compra antes de re-escrever
        await models.tbcompraproduto.destroy({
          where: {
            idpedidocompra: dadosCompra.idpedidocompra,
          },
          transaction: t,
        });

        if (itens.length > 0) {
          for (const relacionamento of itens) {
            await models.tbcompraproduto.create(relacionamento, { transaction: t });
          }
        }
      }

      // Apagar os registros existentes de parcelas para esse pedido de compra
      await models.tbparcelapedidocompra.destroy(
        {
          where: {
            idpedidocompra: dadosCompra.idpedidocompra,
          },
        },
        {
          transaction: t,
        }
      );

      // Tenta inserir as informações de parcelas
      if (parcelas) {
        for (const parcela of parcelas) {
          // Tenta inserir as informações da forma de pagamento associada a parcela
          // Etapa necessária para criar um novo método de pagamento no banco caso ele não exista
          await models.tbformapagamento.upsert(parcela.objFormaPagamento, {
            transaction: t,
          });

          // Tenta inserir as informções da parcela
          await models.tbparcelapedidocompra.create(parcela, {
            transaction: t,
          });
        }
      }
    });
  },

  // Lista pedidos de compra do Bling que atendam aos parâmetros passados
  async listaPedidosCompra(dataInicial, dataFinal, situacao) {
    try {
      // Montar os filtros
      let filtros = `dataEmissao[${dataInicial} TO ${dataFinal}]; situacao[${situacao}]`;

      console.log(
        filename,
        "Iniciando busca de pedidos de compra para:",
        `${dataInicial} TO ${dataFinal} - Situação: ${situacao}`
      );

      // Procedimento de Busca
      let procurando = true;
      let pagina = 1;

      let compras = [];

      while (procurando) {
        console.log(filename, "Iniciando busca na página:", pagina);

        const paginaCompras = await Bling.listaPaginaCompras(pagina++, filtros);

        // Verifica se a chamada retornou pedidos de compra ou chegamos ao final dos resultados
        if (paginaCompras.length > 0) {
          // Passa por cada um dos resultados de pedidos de compras
          for (const compra of paginaCompras) {
            // Acrescenta o campo de situação do pedido de compra
            compra["idstatus"] = situacao;

            compras.push(compra);
          }

          // O Bling possui 100 resultados por página
          // Caso a quantidade de resultados obtidas for menor que 100, com certeza é a última página
          // Já podemos adiantar o processo e evitar o próximo ciclo de busca
          if (paginaCompras.length < 100) {
            procurando = false;
          }
        } else {
          // Chegamos ao fim das páginas de pedidos de compras
          procurando = false;
        }
      }

      return compras;
    } catch (error) {
      console.log(filename, "Erro ao listar página de pedidos de compra:", error.message);
      return [];
    }
  },
};
