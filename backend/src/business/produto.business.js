const Produto = require("../models/produto.model");
const ProdutoDeposito = require("../models/produtoDeposito.model");
const Estrutura = require("../models/estrutura.model");

const Bling = require("../bling/bling");

const filename = __filename.slice(__dirname.length + 1) + " -";

const sequelize = require("../services/sequelize");
const debug = require("../utils/debug");
const { Op } = require("sequelize");

const { fileName, getFileName } = require("../modules/debug");
const { dateToFilename } = require("../utils/date");

const http = require("../utils/http");

module.exports = {
  async startSync(req) {
    // Os pedidos de sincronização disparados pelo frontend ou pelo lambda passam por uma etapa a mais
    // Chamamos internamente a sincronização, mas não aguardamos o resultado
    // Devolvemos ao frontend/lambda a informação de que a sincronização foi iniciada

    try {
      console.log(
        filename,
        "Iniciando nova rotina de sincronização de produtos."
      );

      // Disparar rotina de sincronização de produtos
      this.rotinaSincronizacao(req);

      // Devolver ao frontend/lambda status de sincronização
      return http.ok({
        message: "Rotina de sincronização de produtos iniciada.",
      });
    } catch (error) {
      console.log(
        filename,
        "Erro no início de sincronização de produtos:",
        error.message
      );
      return http.failure({
        message: `Erro no início de sincronização de produtos: ${error.message}`,
      });
    }
  },

  // Executa a sincronização de produtos
  async rotinaSincronizacao(req) {
    /*

    Procedimento:
    1 - Listar produtos Ativos do Bling
    2 - Listar produtos Inativos do Bling
    3 - Concatenar resultados do Bling em um único pacote
    4 - Listar produtos do banco de dados
    5 - Cruzar pacote do Bling com o do banco de dados
    6 - Atualizar produtos no banco de dados

    Situações possíveis no cruzamento de produtos:
    a) Produto existe no bling e não existe no banco: Inserir
    b) Produto existe no bling e também no banco: Atualizar
    c) Produto não existe no bling, e existe no banco: Inativar (Corrigida, verificar abaixo)

    Os casos "a" e "b" são resolvidos naturalmente com a função de update
    Caso o produto exista, será atualizado, caso não, será inserido
    Campos que devem ser atualizados: situação, preço de venda, nome, preço de custo, estoque

    */

    // Medida de tempo de execução
    let start = new Date();

    // Flags de busca
    let procurando = true;
    let paginaAlvo = 1;

    // Utilizar para debug, para restringir a quantidade de páginas buscadas
    let maximoPaginas = 5;

    //Contadores
    let contadorInseridos = 0;
    let contadorRejeitados = 0;

    // Objeto para guardar produtos que geraram erro de atualização
    let produtosRejeitados = [];

    // Flags para controlar busca por produtos ativos/inativos
    let finalizadoAtivos = false;

    // Inicia Busca
    // while (procurando && paginaAlvo <= maximoPaginas) {
    while (procurando) {
      console.log(
        filename,
        "Iniciando busca de produtos na página: ",
        paginaAlvo
      );

      // Verifica se finalizou ciclo de ativo para iniciar o de inativo
      let produtos = await Bling.listaPaginaProdutos(
        finalizadoAtivos ? "inativos" : "ativos",
        paginaAlvo++
      );

      // Ainda recebemos uma paǵina com produtos
      if (produtos.length > 0) {
        // Tenta atualizar produto por produto dos listados no Bling
        for (const produto of produtos) {
          // Transação de sincronização
          const transacao = await this.produtoTransaction(produto);

          if (transacao) {
            contadorInseridos++;
          } else {
            contadorRejeitados++;
          }
        }
      } else {
        // Recebemos uma página sem produtos, chegamos ao final?

        // Verifica primeiro se finalizou o ciclo de produtos ativos
        if (finalizadoAtivos) {
          procurando = false;
        } else {
          // Finaliza a busca por produtos ativos e inicia a busca por produtos inativos
          finalizadoAtivos = true;

          // Reseta o contador de target page
          paginaAlvo = 1;
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

    console.log(filename, "Processo de atualização finalizado");
  },

  // Callback de alteração de estoque de produtos
  async callbackProdutos(req) {
    try {
      // Para cada produto contido no verificar a seguinte rotina:
      // 1 - Upsert do produto na tabela de produtos
      // 2 - Bulk Create dos depositos, com cláusula de update on duplicate

      // O produto precisa existir na tabela de produtos para poder ser criado um registro de depósito
      // Portanto, primeiro é necessário o upsert na tabela de produtos

      // Rotina para Callback de produtos
      console.log(filename, "Iniciando rotina de callback de produto");

      let registros = null;

      // Verifica se o dado foi recebido corretamente via callback
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
        console.log(filename, "Retornando Erro");
        return http.badRequest({
          message: "Nenhuma estrutura de callback de produto válida recebida.",
        });

        // Removendo estrutura de callback de produtos em modo debug
        // Utilizar apenas quando necessários

        // // Tentar entrar no modo de Debug, quanod o callback não é recebido do Bling e sim via API
        // if (req.body.produto) {
        //   console.log(filename, "Iniciando callback de estoque em modo debug");
        //   registros = JSON.parse(req.body.produto).retorno.estoques;
        // } else {
        //   // Nenhum dado válido recebido via callback ou modo de debug
        //   console.log(
        //     filename,
        //     "Nenhuma estrutura de callback de produto válida recebida."
        //   );

        //   return http.badRequest({
        //     message: "Nenhuma estrutura de callback de produto válida recebida.",
        //   });
        // }
      }

      // Algum formato válido foi recebido, realizar procedimento de callback

      // Percorre cada produto contido no callback
      for (const registro of registros) {
        const dadosProduto = registro["estoque"];

        // Verifica se o produto retornou um nome válido
        // Correção devido um bug no Bling no dia 12/04/2022
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

          // console.log(filename, "Nome encontrado:", nome);

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

        // @Debug
        // console.log(filename, "Produto:", produto);
        // console.log(filename, "Depósitos:", depositos);

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

  async produtoTransaction(produto) {
    // Flag para guardar o status da sincronização de produto (sucesso ou falha)
    let status = false;

    // Realiza separação de dados do produto da array de depositos
    let { depositos, estrutura, ...dadosProduto } = produto;

    try {
      await sequelize.transaction(async (t) => {
        // Inserção de Produto
        await Produto.upsert(dadosProduto, {
          transaction: t,
        });

        // Inserção de Produto-Depósito
        await ProdutoDeposito.bulkCreate(depositos, {
          updateOnDuplicate: ["quantidade"],
          transaction: t,
        });

        // Inserção de Estrutura
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

        status = true;
      });
    } catch (error) {
      console.log(
        filename,
        `Erro durante a transaction - ${dadosProduto["idsku"]}: `,
        error.message
      );
    }

    return status;
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

  async forcedDelay(tempo) {
    return new Promise(async (resolve, reject) => {
      setTimeout(resolve, tempo);
    });
  },
};
