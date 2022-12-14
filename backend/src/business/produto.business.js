const Bling = require("../bling/bling");

const filename = __filename.slice(__dirname.length + 1) + " -";

const sequelize = require("../services/sequelize");
const { Op } = require("sequelize");

const http = require("../utils/http");

const { models } = require("../modules/sequelize");
const { ok } = require("../utils/http");

module.exports = {
  async sincronizaProdutos(dataAlteracao, dataInclusao, situacao, skusNumericos, produtos) {
    // Definição do filtro do Bling com base nos parâmetros passados
    let filtros = [];

    if (situacao) {
      filtros.push(`situacao[${situacao}]`);
    } else {
      filtros.push(`situacao[A]`);
    }

    if (dataAlteracao && !dataInclusao) {
      filtros.push(`dataAlteracao[${dataAlteracao}]`);
    }

    if (dataInclusao && !dataAlteracao) {
      filtros.push(`dataInclusao[${dataInclusao}]`);
    }

    filtros = filtros.length > 1 ? filtros.join(";") : filtros[0];

    if (produtos) {
      console.log(filename, "Sincronizando uma lista de produtos.");
      await this.sincronizaListaProdutos(produtos);
    } else {
      console.log(filename, "Sincronizando através de filtros:", filtros);
      await this.sincronizaPaginaProdutos(filtros, situacao, skusNumericos);
    }
  },

  async produtoTransaction(produto) {
    return new Promise((resolve, reject) => {
      let { depositos, estrutura, ...dadosProduto } = produto;

      (async () => {
        await sequelize.transaction(async (t) => {
          await models.tbproduto.upsert(dadosProduto, {
            transaction: t,
          });

          await models.tbprodutoestoque.bulkCreate(depositos, {
            updateOnDuplicate: ["quantidade"],
            transaction: t,
          });

          if (estrutura) {
            await models.tbestrutura.destroy({
              where: {
                skupai: dadosProduto["idsku"].toString(),
              },
              transaction: t,
            });

            await models.tbestrutura.bulkCreate(estrutura, {
              updateOnDuplicate: ["quantidade"],
              transaction: t,
            });
          }
        });
        resolve();
      })().catch((error) => {
        console.log(
          filename,
          `Produto ${produto.idsku} - Erro durante transação de produto: ${error.message}`
        );
        reject(error);
      });
    });
  },

  async callbackProdutos(req) {
    try {
      console.log(filename, "Iniciando rotina de callback de produto");

      let registros = null;

      if (req.body.data) {
        // Debug: Salvar callbacks
        // const file = dateToFilename();
        // const data = req.body.data;

        // debug.save(
        //   "callbacks_estoque/" + file + ".json",
        //   JSON.parse(JSON.stringify(data))
        // );

        registros = JSON.parse(req.body.data).retorno.estoques;
      } else {
        return http.badRequest({
          message: "A estrutura de callback de produto recebida não é válida.",
        });
      }

      // Algum formato válido foi recebido, realizar procedimento de callback

      // Percorre cada produto contido no callback
      for (const registro of registros) {
        const dadosProduto = registro["estoque"];

        // Verifica se o produto retornou um nome válido
        // Correção devido um bug no Bling descoberto no dia 12/04/2022
        // Foi percebido, que o callback de movimentação de estoque não está retornando o nome dos produtos
        // O nome retorna apenas para produtos "VIR ...", mas não para SKU's numéricos
        if (dadosProduto["nome"] == null) {
          const nome = await models.tbproduto.findOne({
            attributes: ["nome"],
            where: {
              idsku: dadosProduto["codigo"],
            },
            raw: true,
          });

          if (nome) {
            dadosProduto["nome"] = nome["nome"];
          }
        }

        // Gera objeto referente ao produto
        const produto = {
          idsku: dadosProduto["codigo"],
          nome: dadosProduto["nome"],
        };

        // Gera objeto referente aos depósitos
        const depositos = Bling.desestruturaDepositos(dadosProduto);

        // Monta objeto compatível com a transação de produto existe
        produto["depositos"] = depositos;

        // Analisar ocorrências de produtos que estão ficando zerados
        await this.verificaProdutoZerado(produto);

        // Executa transação de produto via callback
        await this.produtoTransaction(produto)
          .then(() => {
            console.log(filename, "Transação de callback de deposito realizada com sucesso");
          })
          .catch(() => {
            console.log(filename, "Falha na realização de transação de callback de estoque");

            console.log(filename, "Dados do produto:");
          });
      }
      // Procedimento de callback finalizado
      return http.ok({
        message: "Callback de produto processado",
      });
    } catch (error) {
      console.log(filename, "Erro durante processamento de callback de produto:", error.message);
      return http.failure({
        message: "Erro durante processamento de callback de produto: " + error.message,
      });
    }
  },

  async buscarProdutos(req) {
    try {
      if (req.query.busca) {
        const alvoBusca = req.query.busca;

        const resultados = await models.tbproduto.findAll({
          attributes: ["idsku", "nome", "localizacao"],
          where: {
            [Op.or]: [
              {
                nome: {
                  [Op.like]: `%${alvoBusca}%`,
                },
              },
              {
                idsku: {
                  [Op.like]: `%${alvoBusca}%`,
                },
              },
              {
                localizacao: {
                  [Op.like]: `%${alvoBusca}%`,
                },
              },
            ],
            situacao: 1,
          },
          raw: true,
        });

        console.log(resultados);

        return http.ok({
          resultados,
        });
      } else {
        console.log(filename, "Nenhum dado válido de busca recebido.");
        return http.badRequest({
          message: "Nenhum dado válido de busca recebido.",
        });
      }
    } catch (error) {
      console.log(filename, `Erro ao buscar produtos: ${error.message}`);
      return http.failure({
        message: `Erro ao buscar produtos: ${error.message}`,
      });
    }
  },

  async verificaProdutoZerado(callback) {
    try {
      // Adquirir quantidade atual do callback em estoque
      const produtoDeposito = await models.tbprodutoestoque.findOne({
        attributes: ["quantidade", "minimo"],
        where: {
          idestoque: "7141524213",
          idsku: callback["idsku"],
        },
        raw: true,
      });

      const quantidadeAtual = produtoDeposito.quantidade;

      const depositoGeral = callback.depositos.filter((deposito) => deposito.idestoque === "7141524213");

      const novaQuantidade = depositoGeral[0].quantidade;

      if (novaQuantidade <= 0 && quantidadeAtual >= 1) {
        // Produto acabou de zerar
        await models.tbprodutoszerados.create({
          idsku: callback.idsku,
          quantidadeanterior: quantidadeAtual,
          quantidade: novaQuantidade,
          minimo: produtoDeposito.minimo,
        });
      }

      if (novaQuantidade !== quantidadeAtual) {
        console.log(
          filename,
          "SKU:",
          callback.idsku,
          "Nova quantidade:",
          novaQuantidade,
          "Quantidade atual:",
          quantidadeAtual
        );
      }
    } catch (error) {
      console.log(filename, "Falha durante procedimento de verificação de itens zerados:", error.message);
    }
  },

  async sincronizaPaginaProdutos(filtros, situacao, skusNumericos) {
    let analiseCompleta = situacao ? false : true;

    // Medida de tempo de execução
    let start = new Date();

    // Flags de busca
    let procurando = true;
    let pagina = 1;

    //Contadores
    let contadorInseridos = 0;
    let contadorRejeitados = 0;

    // Flags para controlar busca por produtos ativos/inativos
    let finalizadoAtivos = false;

    // Inicia busca
    while (procurando) {
      console.log(filename, "Iniciando busca de produtos na página: ", pagina);

      // Caso não tenha sido informado uma situação, a busca será realizada nas duas situações
      // Então é necessário verificar o término de uma situação, para começar a outra
      if (analiseCompleta) {
        if (finalizadoAtivos) filtros = filtros.replace("[A]", "[I]");
      }

      // Listar página de produtos

      // Para gerar os ID da Componex e do Magento, basta informar um terceiro parâmetro de ID da loja
      // Deve ser alterado em conjunto com a função de desestruturar produtos do módulo do Bling
      let produtos = await Bling.listaPaginaProdutos(pagina++, filtros, "203382852");

      // Recebemos uma paǵina com produtos
      if (produtos.length > 0) {
        for (const produto of produtos) {
          let sync = true;

          // Verfificar cláusula de verificação de SKUs numéricos
          const regex = /^[0-9]+$/;
          if (!regex.test(produto.idsku) && skusNumericos) sync = false;

          if (sync) {
            await this.produtoTransaction(produto)
              .then(() => contadorInseridos++)
              .catch(() => contadorRejeitados++);
          }
        }
      } else {
        // Recebemos uma página sem produtos, chegamos ao final?

        if (analiseCompleta) {
          // Verificar se o ciclo de produtos "ativos" foi finalizado
          if (finalizadoAtivos) {
            procurando = false;
          } else {
            // Finaliza a busca por produtos "ativos" e inicia a busca por produtos "inativos"
            finalizadoAtivos = true;

            // Reseta o contador de target page
            pagina = 1;
          }
        } else {
          // Não está sendo feita a análise completa (ativos e inativos), podemos finalizar a busca
          procurando = false;
        }
      }
    }

    console.log(filename, "Ciclo de sincronização de produtos finalizado.");

    // Cálculo do tempo gasto na execução da tarefa
    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
    console.log(filename, "Total de produtos inseridos: ", contadorInseridos);
    console.log(filename, "Total de produtos recusados: ", contadorRejeitados);
  },

  async sincronizaListaProdutos(produtos) {
    let inseridos = 0;
    let rejeitados = 0;

    let start = new Date();

    for (const produto of produtos) {
      const produtoBling = await Bling.produto(produto);

      await this.produtoTransaction(produtoBling)
        .then(() => inseridos++)
        .catch(() => rejeitados++);
    }

    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento:", elapsedTime);
    console.log(filename, "Total de pedidos sincronizados:", inseridos);
  },

  async listarProdutosNomeSku() {
    const produtos = await models.tbproduto.findAll({
      attributes: ["idSku", "nome"],
      raw: true,
    });

    return ok({
      produtos,
    });
  },
};
