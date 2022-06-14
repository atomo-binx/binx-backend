// Modelos
const Venda = require("../models/venda.model");
const VendaProduto = require("../models/vendaProduto.model");
const FreteForcado = require("../models/freteForcado.model");
const OcorrenciaVenda = require("../models/ocorrenciasVenda.model");
const FormaPagamento = require("../models/formaPagamento.model");

const { models } = require("../modules/sequelize");

// Business
const FreteBusiness = require("./frete.business");
const EmailBusiness = require("./email.business");

// Models
const Situacao = require("../models/status.model");

// Módulos
const Bling = require("../bling/bling");
const moment = require("moment");
const sequelize = require("../services/sequelize");

// Helpers
const filename = __filename.slice(__dirname.length + 1) + " -";
const puppetter = require("../puppeteer/puppeteer");
const http = require("../utils/http");

const axios = require("axios");
const url = "https://bling.com.br/Api/v2";
const blingApi = axios.create({ baseURL: url });

module.exports = {
  // ==================================================================================================
  // Funções Chamadas via API (Responde aos Controllers)
  // ==================================================================================================

  // Inicia procedimento de sincronização
  async iniciaSincronizacao(req) {
    // Para os pedidos de sincronização disparados pelo frontend ou pelo lambda
    // Chamamos internamente a sincronização, mas não aguardamos o resultado
    // Devolvemos ao frontend/lambda a informação de que a sincronização foi iniciada

    try {
      console.log(
        filename,
        "Iniciando nova rotina de sincronização de pedidos de venda."
      );

      // Disparar chamada de sincronização, será executa em modo assíncrono
      this.rotinaSincronizacao(req);

      // Devolver ao frontend/lambda status de sincronização
      return http.ok({
        message: "Rotina de sincronização de pedidos de venda iniciada.",
      });
    } catch (error) {
      console.log(
        filename,
        "Erro no início de sincronização de pedidos de venda:",
        error.message
      );
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
          // Adquire os dados do pedido de venda do Bling
          const venda = await Bling.pedidoVenda(pedido);

          // Executa rotina de sincronização para este pedido
          await this.sincronizaPedido(venda);
        } catch (error) {
          console.log(
            filename,
            "Erro durante a sincronização de pedido de venda:",
            error.message
          );
        }
      }
      // Procedimento de sincronização finalizado
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
              console.log(
                filename,
                "Erro ao realizar chamada de pedido ao Bling:",
                error.message
              );
            });
        } else {
          // Não foi recebido um parâmetro válido nem via 'data', nem via 'pedido'
          // Portanto, não é um modo de execução em produção, nem em debug
          console.log(
            filename,
            "Não foram recebidos dados de um pedido de venda válido."
          );
          return http.badRequest({
            message: "Não foram recebidos dados de um pedido de venda válido.",
          });
        }
      }

      console.log(
        filename,
        `Pedido de Venda: ${pedido.numero} -`,
        "Iniciando callback de vendas"
      );

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
        message:
          "Erro durante o processamento de callback de pedido de venda: " +
          error.message,
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
        console.log(
          filename,
          "Rodando localmente, tentando alterar transportadora"
        );
        // Realizar chamada de alteração de transportadora
        const transportadora = await this.alterarTransportadora(pedido);

        // Verifica se o procedimento de alteração de transportadora foi executado
        if (transportadora.status) {
          // Atualizar o valor real do frete pago para a transportadora
          pedido["fretetransportadora"] = transportadora.fretetransportadora;
        }
      } else {
        console.log(
          filename,
          "Rodando na AWS, pulando alterando de transportadora"
        );

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
    let { itens, ocorrencias, objFormaPagamento, ...dadosVenda } = venda;

    // Transação dos dados no banco de dados
    try {
      await sequelize.transaction(async (t) => {
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

  // Monta dicionário de sistuações de pedidos de venda existentes
  async dicionarioSituacoes() {
    try {
      const situacoes = await Situacao.findAll({ raw: true });

      if (situacoes.length > 0) {
        const dicionarioSituacoes = {};

        for (const registro of situacoes) {
          dicionarioSituacoes[registro.idstatus] = registro.nome;
        }

        return dicionarioSituacoes;
      } else {
        console.log(
          filename,
          "Nenhum registro de situação recuperado do banco de dados"
        );
        return false;
      }
    } catch (error) {
      console.log(
        filename,
        "Erro durante a montagem de dicionário de situações:",
        error.message
      );
      return false;
    }
  },

  // Rotina para a sincronização de pedidos, executada periodicamente
  async rotinaSincronizacao(req) {
    try {
      // Montar dicionários que são necessários para a função de sincronização

      // Dicionario de situações
      // O dicionário de situações é utilizado para verificar se foi passado um ID de situação válido
      // eslint-disable-next-line no-unused-vars
      const situacoes = await this.dicionarioSituacoes();

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

        console.log(
          filename,
          "Sincronizando todo o período de pedidos de vendas."
        );
      }

      // Nenhum parâmetro de periodo informado, informar sincronização padrão de 1 dia
      if (!req.query.period && !req.query.start && !req.query.all) {
        console.log(
          filename,
          "Sincronizando pedidos de venda para o período padrão de 1 dia."
        );
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
      let pedidosRejeitados = [];

      while (procurando) {
        console.log(filename, "Iniciando busca na página:", pagina);

        const vendas = await Bling.listaPaginaVendas(pagina++, filtros);

        // Verifica se a chamada retornou pedidos de venda ou chegamos ao final dos resultados
        if (vendas.length > 0) {
          // Passa por cada um dos resultados de pedidos de vendas
          for (const venda of vendas) {
            // Sincronizar o pedido
            const status = await this.sincronizaPedido(venda);

            // Verifica saúde da sincronização para este pedido
            if (status) {
              inseridos++;
            } else {
              rejeitados++;
              pedidosRejeitados.push(venda.idpedidovenda);
            }
          }

          // Adiantar a verificação de corte do próximo ciclo
          if (vendas.length < 100) {
            procurando = false;
          }
        } else {
          // Chegamos ao fim das páginas de pedidos de vendas
          procurando = false;
        }
      }

      console.log(
        filename,
        "Finalizando procedimento de sincronização de pedidos de vendas."
      );

      // Cálculo do tempo gasto na execução da tarefa
      let end = new Date();
      let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

      console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
      console.log(filename, "Total de pedidos inseridos: ", inseridos);
      console.log(filename, "Total de pedidos recusados: ", rejeitados);

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
};
