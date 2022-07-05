const Produto = require("../models/produto.model");
const ProdutoDeposito = require("../models/produtoDeposito.model");
const Estrutura = require("../models/estrutura.model");

const Bling = require("../bling/bling");

const filename = __filename.slice(__dirname.length + 1) + " -";

const sequelize = require("../services/sequelize");
const { Op } = require("sequelize");

const http = require("../utils/http");
const { ok } = require("../modules/http");

module.exports = {
  async iniciaSincronizacao(dataAlteracao, dataInclusao, situacao) {
    console.log(filename, "Iniciando sincronização de produtos.");

    this.rotinaSincronizacao(dataAlteracao, dataInclusao, situacao);

    return ok({
      message: "Rotina de sincronização de produtos iniciada.",
    });
  },

  async rotinaSincronizacao(dataAlteracao, dataInclusao, situacao) {
    // Definição do filtro do Bling com base nos parâmetros passados
    let filtros = [];

    let analiseCompleta = situacao ? false : true;

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

      let produtos = await Bling.listaPaginaProdutos(pagina++, filtros);

      // Recebemos uma paǵina com produtos
      if (produtos.length > 0) {
        for (const produto of produtos) {
          await this.produtoTransaction(produto)
            .then(() => contadorInseridos++)
            .catch(() => contadorRejeitados++);
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

  async produtoTransaction(produto) {
    return new Promise((resolve, reject) => {
      let { depositos, estrutura, ...dadosProduto } = produto;

      (async () => {
        await sequelize.transaction(async (t) => {
          await Produto.upsert(dadosProduto, {
            transaction: t,
          });

          await ProdutoDeposito.bulkCreate(depositos, {
            updateOnDuplicate: ["quantidade"],
            transaction: t,
          });

          if (estrutura) {
            await Estrutura.destroy({
              where: {
                skupai: dadosProduto["idsku"].toString(),
              },
              transaction: t,
            });

            await Estrutura.bulkCreate(estrutura, {
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
          const nome = await Produto.findOne({
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

        // Analisar ocorrências de produtos que estão ficando zerados
        // ...

        // Monta objeto compatível com a transação de produto existe
        produto["depositos"] = depositos;

        const transaction = await this.produtoTransaction(produto);

        if (transaction) {
          console.log(
            filename,
            "Transação de callback de deposito realizada com sucesso"
          );
        } else {
          console.log(
            filename,
            "Falha na realização de transação de callback de estoque"
          );

          console.log(filename, "Dados do produto:");
        }
      }
      // Procedimento de callback finalizado
      return http.ok({
        message: "Callback de produto processado",
      });
    } catch (error) {
      console.log(
        filename,
        "Erro durante processamento de callback de produto:",
        error.message
      );
      return http.failure({
        message:
          "Erro durante processamento de callback de produto: " + error.message,
      });
    }
  },

  async buscarProdutos(req) {
    try {
      if (req.query.busca) {
        const alvoBusca = req.query.busca;

        const resultados = await Produto.findAll({
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
};
