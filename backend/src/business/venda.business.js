const FreteForcado = require("../models/freteForcado.model");

const { models } = require("../modules/sequelize");

const FreteBusiness = require("./frete.business");
const EmailBusiness = require("./email.business");

const Bling = require("../bling/bling");
const moment = require("moment");
const sequelize = require("../services/sequelize");

const filename = __filename.slice(__dirname.length + 1) + " -";
const puppetter = require("../puppeteer/puppeteer");
const http = require("../utils/http");

const { ok, failure } = require("../modules/http");

const axios = require("axios");
const url = "https://bling.com.br/Api/v2";
const blingApi = axios.create({ baseURL: url });

module.exports = {
  // ==================================================================================================
  // Funções Chamadas via API (Responde aos Controllers)
  // ==================================================================================================

  // Inicia procedimento de sincronização
  async iniciaSincronizacao(req) {
    try {
      console.log(filename, "Iniciando nova rotina de sincronização de pedidos de venda.");

      this.rotinaSincronizacao(req);

      return http.ok({
        message: "Rotina de sincronização de pedidos de venda iniciada.",
      });
    } catch (error) {
      console.log(filename, "Erro no início de sincronização de pedidos de venda:", error.message);
      return http.failure({
        message: `Erro no início de sincronização de pedidos de venda: ${error.message}`,
      });
    }
  },

  // Sincroniza um pedido de venda específico (ou uma lista de pedidos de venda)
  async sincronizaPedidos(req) {
    if (req.body.pedidos) {
      const pedidos = req.body.pedidos;

      for (const pedido of pedidos) {
        try {
          const venda = await Bling.pedidoVenda(pedido);

          await this.sincronizaPedido(venda);
        } catch (error) {
          console.log(filename, "Erro durante a sincronização de pedido de venda:", error.message);
        }
      }
      return true;
    } else {
      return false;
    }
  },

  // Rota para receber o Callback de alteração de pedido de venda do Bling
  async callbackVendas(req) {
    try {
      // Rotina para Callback de pedido de vendas
      console.log(filename, "Iniciando rotina de callback de venda");

      // Recebe dados do pedido
      let pedido = null;

      if (req.body.data) {
        // Debug: Salvar callbacks
        // const file = dateToFilename();
        // const data = req.body.data;

        // debug.save(
        //   "callbacks_venda/" + file + ".json",
        //   JSON.parse(JSON.stringify(data))
        // );

        // Dados de pedido recebidos via 'data' enviado pelo callback do Bling
        pedido = JSON.parse(req.body.data).retorno.pedidos[0].pedido;
      } else {
        // Não foi recebido um parâmetro válido via 'data'
        // Mas a execução pode estar ocorrendo via debug
        // Verificar por um parâmetro válido de pedido
        if (req.body.pedido) {
          console.log(filename, "Callback operando em modo Debug");

          const numeroPedido = req.body.pedido;

          await blingApi
            .get(`/pedido/${numeroPedido}/json`, {
              params: {
                apikey: process.env.BLING_API_KEY,
              },
            })
            .then((result) => {
              pedido = result.data.retorno.pedidos[0].pedido;
            })
            .catch((error) => {
              console.log(filename, "Erro ao realizar chamada de pedido ao Bling:", error.message);
            });
        } else {
          // Não foi recebido um parâmetro válido nem via 'data', nem via 'pedido'
          // Portanto, não é um modo de execução em produção, nem em debug
          console.log(filename, "Não foram recebidos dados de um pedido de venda válido.");
          return http.badRequest({
            message: "Não foram recebidos dados de um pedido de venda válido.",
          });
        }
      }

      console.log(filename, `Pedido de Venda: ${pedido.numero} -`, "Iniciando callback de vendas");

      // Desestrutura pedido de venda
      const venda = Bling.desestruturaPedidoVenda(pedido);

      // Após desestruturar o pedido de venda recebido via callback, podemos sincronizar o pedido
      await this.sincronizaPedido(venda);

      return http.ok({
        message: "Callback de pedido de venda processado",
      });
    } catch (error) {
      console.log(
        filename,
        "Erro durante processamento de callback de pedido de venda:",
        error.message
      );
      return http.failure({
        message: "Erro durante o processamento de callback de pedido de venda: " + error.message,
      });
    }
  },

  // ==================================================================================================
  // Funções Internas
  // ==================================================================================================

  // Função verificar a necessidade de alteração de transportadora
  async verificaTransportadora(pedido) {
    if (
      pedido.transportadora === "Binx" &&
      pedido.idstatusvenda != 12 &&
      pedido.idstatusvenda != 9
    ) {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        "Necessário atualizar método de transporte do pedido."
      );

      // Iremos tentar alterar a transportadora, salvar o alias original do pedido
      // Essa alteração é realizada diretamente no objeto passado como parâmetro
      pedido["alias"] = pedido.servico;

      // TEMP:
      // Alterar a transportadora apenas se rodando localmente
      let port = process.env.PORT;
      if (port == "" || port == null) {
        console.log(filename, "Rodando localmente, tentando alterar transportadora");
        // Realizar chamada de alteração de transportadora
        const transportadora = await this.alterarTransportadora(pedido);

        // Verifica se o procedimento de alteração de transportadora foi executado
        if (transportadora.status) {
          // Atualizar o valor real do frete pago para a transportadora
          pedido["fretetransportadora"] = transportadora.fretetransportadora;
        }
      } else {
        console.log(filename, "Rodando na AWS, pulando alterando de transportadora");

        // console.log(
        //   filename,
        //   "Rodando na AWS, porém, tentando alterar transportadora"
        // );

        // // Realizar chamada de alteração de transportadora
        // const transportadora = await this.alterarTransportadora(pedido);

        // // Verifica se o procedimento de alteração de transportadora foi executado
        // if (transportadora.status) {
        //   // Atualizar o valor real do frete pago para a transportadora
        //   pedido["fretetransportadora"] = transportadora.fretetransportadora;
        // }
      }
    } else {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        "Não é necessário realizar modificação de transportadora"
      );
    }
  },

  // Função para alterar a transportadora no Bling
  async alterarTransportadora(pedido) {
    try {
      // Adquirir prazo solicitado pelo cliente
      const prazoSolicitado = parseInt(pedido.servico.replace(/[^0-9]/g, ""));

      // Realiza chamada de cálculo de frete
      const resposta = await FreteBusiness.calcularFreteVenda(pedido);

      // Verifica se foi retornado um frete válido para o pedido
      if (resposta.status) {
        let metodosFrete = resposta.resposta.frete;

        // console.log(
        //   "Métodos de frete retornados da frenet:",
        //   `Pedido de Venda: ${pedido.idpedidovenda} -`,
        //   metodosFrete
        // );

        // Aplicar lógica de seleção
        let metodoEscolhido = null;
        let melhorPrazo = 99999;
        let melhorPreco = 99999;

        // Variáveis para a "tradução" dos serviços
        // Traduzir de "normal", "economico", e "expresso", para dlog, pac e sedex
        let qntdMetodosCorreios = 0;
        let correios = [];

        // "Traduzir" métodos
        for (const metodo of metodosFrete) {
          if (!metodo.erro) {
            switch (metodo.transportadora) {
              // Para Dlog, traduzir e inserir na lista de métodos traduzidos
              case "DLog":
                // Traduz o método para a Dlog
                metodo.servico = "dlog";
                break;

              // Para Correios, contabilizar, e inserir na lista de ocorrências de correios
              case "Correios":
                // eslint-disable-next-line no-unused-vars
                qntdMetodosCorreios++;
                correios.push(metodo);
                break;
            }
          }
        }

        // console.log(filename, "Métodos traduzidos:", metodosFrete);

        // Verifica quantidade de ocorrências para transportadora Correios
        if (correios.length == 2) {
          // A ocorrência com menor prazo vira sedex
          if (correios[0].prazo < correios[1].prazo) {
            // Traduz métodos
            correios[0].servico = "sedex";
            correios[1].servico = "pac";
          } else {
            // Traduz métodos
            correios[0].servico = "pac";
            correios[1].servico = "sedex";
          }
        } else if (correios.length == 1) {
          // Apenas uma ocorrência de correios é identificada como sedex
          correios[0].servico = "sedex";
        }

        // Código de Debug para forçar a escolha de método
        // metodosFrete = [
        //   { transportadora: "DLog", servico: "dlog", preco: "2", prazo: 3 },
        //   {
        //     transportadora: "Correios",
        //     servico: "sedex",
        //     preco: "8.88",
        //     prazo: 4,
        //   },
        //   {
        //     transportadora: "Correios",
        //     servico: "pac",
        //     preco: "3.33",
        //     prazo: 4,
        //   },
        // ];

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
            if (
              metodo.prazo <= prazoSolicitado &&
              parseFloat(metodo.preco) < parseFloat(melhorPreco)
            ) {
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

          // Atualizar método de frete no Bling através do puppeteer
          const alteracao = await puppetter.alterarTransportadora(
            pedido.idpedidovenda,
            metodoEscolhido
          );

          if (alteracao) {
            console.log(
              filename,
              `Pedido de Venda: ${pedido.idpedidovenda} -`,
              "Alteração de transportadora no Bling executado com sucesso"
            );

            // Se chegou até aqui, foi possível alterar a transportadora com sucesso
            // Retorna o valor do método de frete escolhido
            return {
              status: true,
              fretetransportadora: melhorPreco,
            };
          } else {
            console.log(
              filename,
              `Pedido de Venda: ${pedido.idpedidovenda} -`,
              "Falha na alteração de transportadora no Bling"
            );
          }
        } else {
          console.log(
            filename,
            `Pedido de Venda: ${pedido.idpedidovenda} -`,
            "Não foi possível escolher um método de frete para este pedido"
          );
        }
      } else {
        console.log(
          filename,
          `Pedido de Venda: ${pedido.idpedidovenda} -`,
          "Falha na requisição de frete na API da Frenet"
        );
      }

      // Se a execução chegou até aqui, não foi escolhido nenhum método de frete
      // Retornar um status de execução negativa
      return {
        status: false,
      };
    } catch (error) {
      console.log(
        filename,
        `Pedido de Venda: ${pedido.idpedidovenda} -`,
        "Erro durante o procedimento de alteração de transportadora:",
        error.message
      );
      // Retornar um status de execução negativa
      return {
        status: false,
      };
    }
  },

  // Realiza a transção de pedido de venda e de venda-produto, com os itens
  async vendaTransaction(venda) {
    // Realiza separação de dados de venda e lista de itens
    let { itens, ocorrencias, objFormaPagamento, objContato, ...dadosVenda } = venda;

    // Transação dos dados no banco de dados
    try {
      await sequelize.transaction(async (t) => {
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

        // Tenta inserir dados do pedido de venda
        await models.tbpedidovenda.upsert(dadosVenda, { transaction: t });

        // Tenta inserir relacionamento de venda-produto
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

      // Operações no banco de dados finalizadas com sucesso
      return true;
    } catch (error) {
      // Falha nas operaçõs no banco de dados
      console.log(
        filename,
        `Pedido de Venda: ${dadosVenda["idpedidovenda"]} -`,
        `Erro durante a transação de pedido de venda:`,
        error.message
      );

      return false;
    }
  },

  // Rotina para a sincronização de pedidos, executada periodicamente
  async rotinaSincronizacao(req) {
    try {
      // A nova função de sincronização irá buscar apenas pedidos com situação em aberto
      // Os itens da compra são inseridos neste momento, quando a compra é criada

      // Primeiro precisamos verificar qual o periodo de sincronização desejado

      // Por padrão, vamos sincronizar para o período de 1 dia
      let dataHoje = moment().format("DD/MM/YYYY");
      let dataAnterior = moment().subtract(1, "days").format("DD/MM/YYYY");
      let filtros = `dataEmissao[${dataAnterior} TO ${dataHoje}]`;

      // Sincronização através de período + valor
      if (req.query.period && req.query.value) {
        let dataAnterior = moment()
          .subtract(req.query.value, req.query.period)
          .format("DD/MM/YYYY");

        filtros = `dataEmissao[${dataAnterior} TO ${dataHoje}]`;

        console.log(
          filename,
          "Sincronizando pedidos de vendas para o período de:",
          req.query.value,
          req.query.period
        );
      }

      // Sincronização por data de inicio e final
      if (req.query.start && req.query.end) {
        filtros = `dataEmissao[${req.query.start} TO ${req.query.end}]`;

        console.log(
          filename,
          `Sincronizando pedidos de venda de ${req.query.start} até ${req.query.end}.`
        );
      }

      // Sincronização de todo o período
      if (req.query.all) {
        if (req.query.all == "true") filtros = "";

        console.log(filename, "Sincronizando todo o período de pedidos de vendas.");
      }

      // Nenhum parâmetro de periodo informado, informar sincronização padrão de 1 dia
      if (!req.query.period && !req.query.start && !req.query.all) {
        console.log(filename, "Sincronizando pedidos de venda para o período padrão de 1 dia.");
      }

      // Cláusula de situação do pedido de venda
      if (req.query.situacao) {
        // Foi passada uma situação por parâmetro
        if (req.query.situacao != "all") {
          if (filtros.length > 0) {
            filtros += `; idSituacao[${req.query.situacao}]`;
          } else {
            filtros = ` idSituacao[${req.query.situacao}]`;
          }
        }
      } else {
        // Não foi passada uma situação por parâmetro, sincronizar pedidos em aberto (6)

        // ATENÇÃO:
        // Como agora a sincronização ainda está rodando localmente por conta do bloqueio do puppeteer,
        // Caso o puppeteer falhe com o pedido em aberto, o callback não irá corrigir a transportadora
        // E o pedido irá prosseguir na árvore de status com transportadora "Binx"
        // Para corrigir isso por enquanto, desconsiderar o status padrão "am aberto"
        // Sincronizar todos os status, o que estiver como Binx irá ser corrigido

        if (filtros.length > 0) {
          // filtros += "; idSituacao[6]";
        } else {
          // filtros = " idSituacao[6]";
        }
      }

      // Medida de tempo de execução
      let start = new Date();

      // Procedimento de Busca
      let procurando = true;
      let pagina = 1;

      // Contadores de total de vendas inseridas e rejeitadas
      let inseridos = 0;
      let rejeitados = 0;

      while (procurando) {
        console.log(filename, "Iniciando busca na página:", pagina);

        const vendas = await Bling.listaPaginaVendas(pagina++, filtros);

        if (vendas.length === 0) procurando = false;

        for (const venda of vendas) {
          await this.sincronizaPedido(venda)
            .then(() => inseridos++)
            .catch(() => {
              rejeitados++;
            });
        }

        // Adiantar a verificação de corte do próximo ciclo
        if (vendas.length > 0 && vendas.length < 100) {
          procurando = false;
        }
      }

      console.log(filename, "Finalizando procedimento de sincronização de pedidos de vendas.");

      // Cálculo do tempo gasto na execução da tarefa
      let end = new Date();
      let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

      console.log(filename, "Tempo gasto no procedimento:", elapsedTime);
      console.log(filename, "Total de pedidos inseridos:", inseridos);
      console.log(filename, "Total de pedidos recusados:", rejeitados);

      return true;
    } catch (error) {
      console.log(
        filename,
        "Erro na execução de rotina de sincronização de pedidos de venda:",
        error.message
      );
      return false;
    }
  },

  // Realiza a sincronização de 1 pedido de venda
  async sincronizaPedido(venda) {
    console.log(
      filename,
      `Pedido de Venda: ${venda.idpedidovenda} - Iniciando rotina de sincronização`
    );

    // Verifica necessidade de alteração de transportadora
    await this.verificaTransportadora(venda);

    // Tenta realizar transação de inserção no banco de dados
    const transaction = await this.vendaTransaction(venda);

    // Verifica o status da transação de inserção da venda no banco de dados
    // transaction ? inseridos++ : rejeitados++;
    if (transaction) {
      console.log(
        filename,
        `Pedido de Venda: ${venda.idpedidovenda} - Transação de pedido de venda realizada com sucesso`
      );

      // Executar Rotina de Email
      await EmailBusiness.rotinaEmail(venda);

      return true;
    } else {
      console.log(
        filename,
        `Pedido de Venda: ${venda.idpedidovenda} - Transação de pedido de venda não foi realizada`
      );
      return false;
    }
  },

  // ================================================================================
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
      await this.novaSincronizaListaPedidos(pedidos);
    } else {
      console.log(filename, "Sincronizando através de filtros:", filtros);
      await this.novaSincronizaPaginasPedidos(filtros);
    }
  },

  async novaSincronizaPaginasPedidos(filtros) {
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
            await this.novaSincronizaPedido(venda);
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

  async novaSincronizaListaPedidos(pedidos) {
    let inseridos = 0;

    let start = new Date();

    for (const pedido of pedidos) {
      try {
        const venda = await Bling.pedidoVenda(pedido);

        await this.novaSincronizaPedido(venda);

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

  async novaVendaTransaction(pedido) {
    // Realiza separação de dados de venda e lista de itens
    let { itens, ocorrencias, objFormaPagamento, ...dadosVenda } = pedido;

    // Transação dos dados no banco de dados
    return sequelize.transaction(async (t) => {
      // Atualiza entidade de forma de pagamento no banco de dados
      if (objFormaPagamento) {
        await models.tbformapagamento.upsert(objFormaPagamento, {
          transaction: t,
        });
      }

      // Tenta inserir dados do pedido de venda
      await models.tbpedidovenda.upsert(dadosVenda, { transaction: t });

      // Tenta inserir relacionamento de venda-produto
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

  async novaCallbackVendas(pedido) {
    try {
      const venda = Bling.desestruturaPedidoVenda(pedido);

      console.log(filename, `Pedido de Venda: ${venda.idpedidovenda} - Iniciando callback`);

      await this.novaSincronizaPedido(venda);

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

  async novaSincronizaPedido(pedido) {
    console.log(filename, `Pedido de Venda: ${pedido.idpedidovenda} - Iniciando sincronização.`);

    // Caso a transportadora ainda seja "Binx", o pedido está sendo inserido
    // Para essas situações, precisamos salvar o alias original do pedido
    if (pedido.transportadora === "Binx") {
      pedido["alias"] = pedido.servico;
    }

    return this.novaVendaTransaction(pedido).then(() => {
      return EmailBusiness.rotinaEmail(pedido);
    });
  },
};
