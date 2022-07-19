const http = require("../utils/http");
const filename = __filename.slice(__dirname.length + 1) + " -";

const PedidoCompra = require("../models/pedidoCompra.model");
const CompraProduto = require("../models/compraProduto.model");
const Fornecedor = require("../models/fornecedor.model");
const StatusCompra = require("../models/status_compra.model");

const { atualizaCusto } = require("./custo/atualiza_custo");

const Bling = require("../bling/bling");

const sequelize = require("../services/sequelize");
const { Op } = require("sequelize");

const moment = require("moment");
const { dictionary } = require("../utils/dict");

const { ok } = require("../modules/http");
const { OkStatus } = require("../modules/codes");

module.exports = {
  // Inicia sincronização de pedidos de compra em segundo plano
  async sincroniza(req) {
    console.log(filename, "Sincronização de pedidos de compra iniciada.");

    this.sincronizaPedidosCompra(req.query);

    return ok({
      status: OkStatus,
      response: {
        message: "Sincronização de pedidos de compra iniciada.",
      },
    });
  },

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
  async sincronizaPedidosCompra(parametros) {
    try {
      // Na rotina de sincronização, duas etapas são realidas:
      // 1 - Os pedidos de compra são sincronizados (copiados do Bling para o Binx)
      // 2 - Os pedidos de compra são analisados (identificado a sua situação)

      // Adquire filtros da requisição
      let tudo = parametros.tudo;
      let inicio = parametros.inicio;
      let fim = parametros.fim;
      let valor = parametros.valor;
      let situacao = parametros.situacao;
      let periodo = parametros.periodo;

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

        console.log(
          filename,
          "Sincronizando pedidos de compras para o período de:",
          valor,
          periodo
        );
      }

      // Sincronização por data de inicio e final
      if (inicio && fim) {
        filtrosBling = `dataEmissao[${inicio} TO ${fim}]`;

        console.log(
          filename,
          `Sincronizando pedidos de compra de ${inicio} até ${fim}.`
        );
      }

      // Sincronização de todo o período
      if (tudo) {
        if (tudo == "true") {
          filtrosBling = "";
          console.log(
            filename,
            "Sincronizando todo o período de pedidos de vendas."
          );
        }
      }

      // Cláusula de situação do pedido de compra
      if (situacao) {
        // Foi passada uma situação por parâmetro
        if (situacao != "all") {
          filtrosBling += `; situacao[${situacao}]`;
        }
      }

      // Chamar a função de sincronização
      await this.sincronizaPedidos(filtrosBling);

      // Após sincronizar, chamar a função de análise de pedidos
      await this.analisaPedidosCompra();
    } catch (error) {
      console.log(
        filename,
        "Erro na execução de rotina de sincronização de pedidos de compra:",
        error.message
      );
    }
  },

  // Rotina de análise de pedidos de compra
  async analisaPedidosCompra() {
    try {
      // Medida de tempo de execução
      let start = new Date();

      // Adquirir todos os pedidos não concluídos do Binx
      let pedidosBinx = await PedidoCompra.findAll({
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

      console.log(
        filename,
        pedidosBinx.map((ele) => [ele.idpedidocompra, ele.idstatus])
      );

      // Gerar dicionário dos pedidos retornados do Binx
      let dicPedidosBinx = dictionary(pedidosBinx, "idpedidocompra");

      console.log(
        filename,
        "Quantidade de pedidos de compra não concluídos no Binx:",
        pedidosBinx.length
      );

      // Gerar as datas de intervalo: data mais antiga e data mais nova
      let dataInicial = moment
        .utc(pedidosBinx[0]["datacriacao"])
        .format("DD/MM/YYYY");
      let dataFinal = moment
        .utc(pedidosBinx[pedidosBinx.length - 1]["datacriacao"])
        .format("DD/MM/YYYY");

      console.log(filename, "Data mais antiga:", dataInicial);
      console.log(filename, "Data mais nova:", dataFinal);

      let pedidosBling = [];

      const statusCompra = await StatusCompra.findAll({
        raw: true,
      });

      for (const status of statusCompra) {
        let pedidos = await this.listaPedidosCompra(
          dataInicial,
          dataFinal,
          status.idstatus
        );

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
            pedidoBling["dataconclusao"] = moment().format(
              "YYYY-MM-DD HH:mm:ss"
            );
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
          if (
            novoStatus == 1 &&
            !ignorarFornecedores.includes(pedidoBling["idfornecedor"])
          ) {
            // Alterar custos dos produtos
            pedidosAtendidos.push(pedidoBling);
          }

          // Por fim, acrescenta o objeto do pedido em uma lista de atualização
          pedidosAtualizar.push(pedidoBling);
        }
      }

      console.log(
        filename,
        "Quantidade de pedidos para atualizar status:",
        pedidosAtualizar.length
      );

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
      console.log(
        filename,
        "Quantidade de pedidos de compra analisados:",
        analisados
      );
      console.log(
        filename,
        "Quantidade de pedidos rejeitados:",
        reprovados.length
      );
      console.log(
        filename,
        "Pedidos reprovados durante a análise:",
        reprovados
      );

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

    console.log(
      filename,
      "Finalizando procedimento de sincronização de pedidos de compras."
    );

    // Cálculo do tempo gasto na execução da tarefa
    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
    console.log(filename, "Total de pedidos processados: ", processados);
    console.log(filename, "Total de pedidos recusados: ", rejeitados);

    console.log(filename, "Pedidos Rejeitados:", pedidosRejeitados);
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
    return new Promise(async (resolve, reject) => {
      // Inicia transação de um relacionamento
      const t = await sequelize.transaction();

      try {
        // Realiza separação de dados de compra e lista de itens e fornecedor
        let { itens, fornecedor, ...dadosCompra } = compra;

        // Tenta inserir relacionamento de fornecedor
        if (fornecedor) {
          await Fornecedor.upsert(fornecedor, {
            transaction: t,
          });
        }

        // Tenta inserir dados do pedido de compra
        await PedidoCompra.upsert(dadosCompra, { transaction: t });

        // Tenta inserir relacionamento de compra-produto
        if (itens) {
          // Apagar os registros de compra produto dessa compra antes de re-escrever
          await CompraProduto.destroy({
            where: {
              idpedidocompra: dadosCompra.idpedidocompra,
            },
            transaction: t,
          });

          if (itens.length > 0) {
            for (const relacionamento of itens) {
              await CompraProduto.create(relacionamento, { transaction: t });
            }
          }
        }

        //Se chegamos até aqui, as inserções foram bem sucedidas
        await t
          .commit()
          .then(() => {
            resolve();
          })
          .catch((error) => {
            console.log(
              filename,
              `Pedido de Compra: ${compra.idpedidocompra} -`,
              `Erro durante o commit da transaction para o pedido de compra:`,
              error.message
            );

            reject(error);
          });
      } catch (error) {
        // Se caímos no catch, alguma inserção foi mal executada, executar rollback na transação
        await t
          .rollback()
          .then(() => {
            // Rollback bem sucedido, reject na promise original
            reject(error);
          })
          .catch((error) => {
            console.log(
              filename,
              `Pedido de Compra: ${compra.idpedidocompra} -`,
              `Erro durante o rollback da transaction para o pedido de compra:`,
              error.message
            );

            reject(error);
          });
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
      console.log(
        filename,
        "Erro ao listar página de pedidos de compra:",
        error.message
      );
      return [];
    }
  },
};
