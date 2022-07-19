const Produto = require("../models/produto.model");
const Estoque = require("../models/deposito.model");
const ProdutoEstoque = require("../models/produtoDeposito.model");
const Disponibilidade = require("../models/disponibilidade.model");
const DisponibilidadeCurva = require("../models/disponibilidadeCurva.model");
const Curva = require("../models/curva.model");
const PedidoCompra = require("../models/pedidoCompra.model");
const CompraProduto = require("../models/compraProduto.model");

const sequelize = require("../services/sequelize");
const { Op, QueryTypes } = require("sequelize");
const moment = require("moment");
const fs = require("fs");
const { OkStatus } = require("../modules/codes");
const { dateToFilename } = require("../utils/date");
const validator = require("validator");

const filename = __filename.slice(__dirname.length + 1) + " -";

const ExcelJS = require("exceljs");
const http = require("../utils/http");
const { ok } = require("../utils/http");

module.exports = {
  async salvarDashboardDiario() {
    try {
      // Gerar dados do dashboard de compras
      let resposta = await this.dashboard();

      // Verificar se os dados do dashboard foram gerados com sucesso
      if (resposta.statusCode == 200) {
        // Prosseguir com os salvamentos diários

        // Criar uma nova transação para executar as rotinas de salvamento
        // As duas rotinas devem ser executadas com sucesso
        const t = await sequelize.transaction();

        // Tenta salvar histórico de disponibilidade
        const { pdisponivel, pDisponivelPorCurva } = resposta.body;

        console.log(
          filename,
          "Valores a serem salvos:",
          pdisponivel,
          pDisponivelPorCurva
        );

        // Tenta salvar o histórico de disponibilidade de produtos
        try {
          await Disponibilidade.create({
            data: new Date(),
            valor: pdisponivel,
            transaction: t,
          });
          console.log(
            filename,
            "Valor diário de disponibilidade do dashboard de compras salvo com sucesso"
          );
        } catch (error) {
          console.log(
            filename,
            `Erro no salvamento das informações diárias do dashboard de compras: ${error.message}`
          );

          // Executando Rollback e retornando
          await t.rollback().catch((error) => {
            console.log(
              filename,
              `Erro durante o rollback no procedimento de salvamento do dashboard de compras: ${error.message}`
            );
          });

          // Retornando falha no procedimento
          return http.failure({
            message:
              "Falha no procedimento de salvar valores diários do dashboard de compras",
          });
        }

        // Tenta salvar o histórico de disponibilidade das curvas
        try {
          await DisponibilidadeCurva.create({
            data: new Date(),
            curva_1: pDisponivelPorCurva[0],
            curva_2: pDisponivelPorCurva[1],
            curva_3: pDisponivelPorCurva[2],
            curva_4: pDisponivelPorCurva[3],
            transaction: t,
          });
          console.log(
            filename,
            "Valor diário de disponibilidade por curva do dashboard de compras salvo com sucesso"
          );
        } catch (error) {
          console.log(
            filename,
            `Erro no salvamento das informações diárias do dashboard de compras: ${error.message}`
          );

          // Executando Rollback e retornando
          await t.rollback().catch((error) => {
            console.log(
              filename,
              `Erro durante o rollback no procedimento de salvamento do dashboard de compras: ${error.message}`
            );
          });

          // Retornando falha no procedimento
          return http.failure({
            message:
              "Falha no procedimento de salvar valores diários do dashboard de compras",
          });
        }

        let commitStatus = true;

        // Caso chegamos até aqui, executar o commit da transaction
        await t.commit().catch((error) => {
          console.log(
            filename,
            `Erro durante o commit da transaction de salvar valores diários do dashboard de compras ${error.message}`
          );

          commitStatus = true;
        });

        // Verifica status do procedimento de salvar valores diários
        if (commitStatus) {
          return http.ok({
            message:
              "Procedimento de salvar valores diários do dashboard de compras finalizado",
          });
        } else {
          return http.failure({
            message: `Falha durante o procedimento de commit ao salvar valores diários do dashboard de compras.`,
          });
        }
      } else {
        // Não é um catch, não temos mensagem de erro aqui
        return http.failure({
          message:
            "Falha na aquisição do dashboard de compras, não foi possível realizar o procedimento de salvar valores diários.",
        });
      }
    } catch (error) {
      console.log(
        filename,
        `Erro durante o procedimento de salvar dashboard de compras: ${error.message}`
      );
      return http.failure({
        message: `Erro durante o procedimento de salvar dashboard de compras: ${error.message}`,
      });
    }
  },

  async dashboard() {
    // Configurações de relacionamento
    Produto.hasMany(ProdutoEstoque, {
      foreignKey: "idsku",
    });

    ProdutoEstoque.hasMany(Estoque, {
      foreignKey: "idestoque",
    });

    Estoque.belongsTo(ProdutoEstoque, {
      foreignKey: "idestoque",
    });

    try {
      // Lista Produtos - Massa de Dados Bruta
      // Buscamos apenas os produtos Ativos e com SKU numérico, e do depósito geral
      const produtosQuery = await Produto.findAll({
        attributes: ["idsku", "nome", "curva"],
        where: {
          situacao: true,
          idsku: {
            [Op.regexp]: "^[0-9]+$",
          },
        },
        include: [
          {
            model: ProdutoEstoque,
            required: true,
            attributes: ["quantidade", "maximo", "minimo"],
            include: [
              {
                model: Estoque,
                required: true,
                attributes: [],
                where: {
                  nome: "Geral",
                },
              },
            ],
          },
        ],
        raw: true,
      });

      // Desestrutura dados dos produtos com base na query bruta
      let produtos = produtosQuery.map((produto) => ({
        idsku: produto.idsku,
        nome: produto.nome,
        curva: produto.curva,
        quantidade: produto["ProdutoDepositos.quantidade"],
        minimo: produto["ProdutoDepositos.minimo"],
        maximo: produto["ProdutoDepositos.maximo"],
      }));

      // Variáveis para as contagens de produtos
      let contProdutosAtivos = produtos.length;
      let contProdutosDisponiveis = 0;
      let contProdutosIndisponiveis = 0;
      let contAbaixoMin = 0;
      let contIndisponiveisPorCurva = [0, 0, 0, 0];
      let contProdutosPorCurva = [0, 0, 0, 0];
      let disponibilidadePorCurva = [0, 0, 0, 0];
      let pDisponibilidadePorCurva = [0, 0, 0, 0];
      let contAbaixoMinPorCurva = [0, 0, 0, 0];

      let dicionarioCurvas = {
        "Curva A": 0,
        "Curva B": 1,
        "Curva C": 2,
      };

      // Arrays para realizar a exportação dos itens considerados para o dash
      let consideradosAtivos = produtos;
      let consideradosDisponiveis = [];
      let consideradosIndisponiveis = [];
      let consideradosAbaixoMin = [];

      // Realiza contagem dos produtos
      for (const produto of produtos) {
        // Conta produtos Disponíveis
        if (produto.quantidade > 0) {
          contProdutosDisponiveis++;
          consideradosDisponiveis.push(produto);
        }

        // Conta produtos Indisponíveis
        if (produto.quantidade <= 0) {
          contProdutosIndisponiveis++;
          consideradosIndisponiveis.push(produto);

          // Contabiliza produto como indisponivel por curva
          // A curva do produto vira uma chave no dicionário
          let idxCurva = dicionarioCurvas[produto["curva"]];

          if (idxCurva != undefined) {
            // Contabilizar na curva associada do produto
            contIndisponiveisPorCurva[idxCurva]++;
          } else {
            // Produtos que não possuem nenhuma curva associada
            contIndisponiveisPorCurva[3]++;
          }
        }

        // Conta produtos abaixo do mínimo
        if (produto.quantidade >= 1 && produto.quantidade < produto.minimo) {
          contAbaixoMin++;
          consideradosAbaixoMin.push(produto);

          // Adiciona indicador de quantidade abaixo do mínimo por curva
          switch (produto.curva) {
            case "Curva A":
              contAbaixoMinPorCurva[0] = contAbaixoMinPorCurva[0] + 1;
              break;
            case "Curva B":
              contAbaixoMinPorCurva[1] = contAbaixoMinPorCurva[1] + 1;
              break;
            case "Curva C":
              contAbaixoMinPorCurva[2] = contAbaixoMinPorCurva[2] + 1;
              break;
            case "Sem Curva":
              contAbaixoMinPorCurva[3] = contAbaixoMinPorCurva[3] + 1;
              break;

            default:
              break;
          }
        }

        // Realiza contagem de produtos por Curva
        let idxCurva = dicionarioCurvas[produto["curva"]];

        if (idxCurva != undefined) {
          contProdutosPorCurva[idxCurva]++;
        } else {
          // Produtos que não possuem nenhuma curva associada
          contProdutosPorCurva[3]++;
        }
      }

      // Calcula disponibilidade de produtos por curva
      for (let i = 0; i < 4; i++) {
        disponibilidadePorCurva[i] =
          contProdutosPorCurva[i] - contIndisponiveisPorCurva[i];
      }

      // Calcula a porcentagem de disponibilidade de produtos por curva
      for (let i = 0; i < 4; i++) {
        pDisponibilidadePorCurva[i] = parseFloat(
          (
            (100 * disponibilidadePorCurva[i]) /
            contProdutosPorCurva[i]
          ).toFixed(1)
        );
      }

      // Calcula Porcentagem de produtos disponíveis:
      let porcentagemDisponiveis = (
        (100 * contProdutosDisponiveis) /
        contProdutosAtivos
      ).toFixed(1);

      // Calcula Porcentagem de produtos indisponíveis
      let porcentagemIndisponiveis = (
        (100 * contProdutosIndisponiveis) /
        contProdutosAtivos
      ).toFixed(1);

      // Calcula Porcentagem de produtos abaixo do estoque minimo
      let porcentagemAbaixoMin = (
        (100 * contAbaixoMin) /
        contProdutosAtivos
      ).toFixed(1);

      // Calcula Porcentagem de produtos indisponiveis por curva
      let porcentagemIndisponiveisCurva = [0, 0, 0, 0];

      // Calcula porcentagem de Indisponibilidade por Curva em relação aos items indisponiveis
      for (let i = 0; i < 4; i++) {
        porcentagemIndisponiveisCurva[i] = parseFloat(
          (
            (100 * contIndisponiveisPorCurva[i]) /
            contProdutosIndisponiveis
          ).toFixed(1)
        );
      }

      console.log(filename, "Produtos ativos: ", contProdutosAtivos);
      console.log(filename, "Produtos disponíveis: ", contProdutosDisponiveis);
      console.log(
        filename,
        "Produtos indisponíveis: ",
        contProdutosIndisponiveis
      );
      console.log(filename, "Produtos abaixo do mínimo: ", contAbaixoMin);
      console.log(
        filename,
        "Porcentagem de produtos disponíveis: ",
        porcentagemDisponiveis,
        "%"
      );
      console.log(
        filename,
        "Porcentagem de produtos indisponíveis: ",
        porcentagemIndisponiveis,
        "%"
      );
      console.log(
        filename,
        "Porcentagem de produtos abaixo do minimo: ",
        porcentagemAbaixoMin,
        "%"
      );
      console.log(
        filename,
        "Indisponibilidade por curva:",
        contIndisponiveisPorCurva
      );
      console.log(
        filename,
        "Porcentagem de indisponibilidade por curva:",
        porcentagemIndisponiveisCurva
      );
      console.log(
        filename,
        "Contagem de produtos por curva:",
        contProdutosPorCurva
      );
      console.log(
        filename,
        "Disponibilidade por Curva:",
        disponibilidadePorCurva
      );
      console.log(
        filename,
        "Porcentagem de Disponibilidade por Curva:",
        pDisponibilidadePorCurva
      );
      console.log(
        filename,
        "Quantidade de itens abaixo do mínimo por curva:",
        contAbaixoMinPorCurva
      );

      // Adquire os últimos valores de disponibilidade de produtos para montar o gráfico de histórico
      let ultimasDisponibilidades = await Disponibilidade.findAll({
        attributes: ["data", "valor"],
        limit: 7,
        order: [["data", "desc"]],
        raw: true,
      });

      // Adquire os últimos valores de disponibilidades por curva, para o gráfico de histórico
      let ultimasDisponibilidadesCurva = await DisponibilidadeCurva.findAll({
        attributes: ["data", "curva_1", "curva_2", "curva_3", "curva_4"],
        limit: 7,
        order: [["data", "desc"]],
        raw: true,
      });

      // Monta a resposta para enviar ao frontend
      let resposta = {
        ativos: contProdutosAtivos,
        disponiveis: contProdutosDisponiveis,
        indisponiveis: contProdutosIndisponiveis,
        abaixoMin: contAbaixoMin,
        pdisponivel: porcentagemDisponiveis,
        pindisponivel: porcentagemIndisponiveis,
        pAbaixoMin: porcentagemAbaixoMin,
        indisponivelPorCurva: contIndisponiveisPorCurva,
        pIndisponivelCurva: porcentagemIndisponiveisCurva,
        pDisponivelPorCurva: pDisponibilidadePorCurva,
        disponibilidades: ultimasDisponibilidades,
        disponiblidadesCurva: ultimasDisponibilidadesCurva,
        abaixoMinPorCurva: contAbaixoMinPorCurva,
      };

      // Exportação para Excel
      if (false) {
        let nomesParaExportar = [
          "Ativos",
          "Disponiveis",
          "Indisponiveis",
          "Abaixo",
        ];

        let dadosParaExportar = [
          consideradosAtivos,
          consideradosDisponiveis,
          consideradosIndisponiveis,
          consideradosAbaixoMin,
        ];

        // Exporta os dados para o Excel
        await this.exportaExcel(nomesParaExportar, dadosParaExportar);
      }

      // Retorna resposta para chamada da API
      return http.ok(resposta);
    } catch (error) {
      console.log(
        filename,
        `Erro durante o processamento do dashboard de compras: ${error.message}`
      );
      return http.failure({
        messa: `Erro durante o processamento do dashboard de compras: ${error.message}`,
      });
    }
  },

  async exportaExcel(nomes, dados) {
    // Objeto Excel para ser trabalhado
    const workbook = new ExcelJS.Workbook();

    // Array de planilhas que serão criadas
    let worksheets = [];

    // Cria programaticamente cada uma das planilhas
    for (let nome in nomes) {
      const sheet = workbook.addWorksheet(nomes[nome]);

      sheet.columns = [
        { header: "SKU", key: "idsku", width: 6 },
        { header: "Nome", key: "name", width: 32 },
        { header: "Quantidade", key: "qntd" },
        { header: "Minimo", key: "min" },
        { header: "Maximo", key: "max" },
      ];

      // sheet.addRow(["SKU", "Nome", "Categoria", "Contador"]);
      worksheets.push(sheet);
    }

    // Percorre cada categoria de dados ordenados preenchendo sua determinada planilha
    for (let i = 0; i < worksheets.length; i++) {
      for (let itemIdx = 0; itemIdx < dados[i].length; itemIdx++) {
        let item = dados[i][itemIdx];
        worksheets[i].addRow([
          item.idsku,
          item.nome,
          item.quantidade,
          item.minimo,
          item.maximo,
        ]);
      }
    }

    // Escreve arquivo final
    await workbook.xlsx
      .writeFile("./exports/dashboard_compras.xlsx")
      .then(() => console.log(filename, "Arquivo excel exportado com sucesso"))
      .catch((error) =>
        console.log(filename, "Erro ao exportar arquivo excel: ", error.message)
      );
  },

  async disponibilidade() {
    // Possibilidades:

    // Mês atual
    // Mês passado
    // Últimos 30 dias
    // Últimos 3 meses
    // Todo o período
    // Customizado

    try {
      // Verificar por parâmetros
      // Por padrão considerar o período de 30 dias

      // Para a conta, considerar 1 dia a menos do cálculo, pois a data é inclusiva
      // Por ex: para trazer 3 dias (3 resultados),subtrair "2" do número de dias
      // Isso irá contar o dia atual, e mais 2 dias para trás

      let dataFinal = moment(moment().endOf("day")).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      console.log(filename, "Data Final:", dataFinal);

      let dataInicio = moment(
        moment().subtract(30, "days").startOf("day")
      ).format("YYYY-MM-DD HH:mm:ss");
      console.log(filename, "Data Inicio:", dataInicio);

      // if(req.query.inicio && req.query.final){

      // }

      const resultados = await Disponibilidade.findAll({
        attributes: ["data", "valor"],
        order: [["data", "desc"]],
        where: {
          data: {
            [Op.between]: [dataInicio, dataFinal],
          },
        },
        raw: true,
      });

      return http.ok(resultados);
    } catch (error) {
      return http.failure({
        message: `Falha: ${error.message}`,
      });
    }
  },

  async analiseCompras() {
    // Configurações de relacionamento

    // Produto, Curva - 1:N
    Produto.belongsTo(Curva, {
      foreignKey: "idcurva",
    });

    // ProdutoEstoque, Estoque - 1:N
    ProdutoEstoque.belongsTo(Estoque, {
      foreignKey: "idestoque",
    });

    Estoque.hasMany(ProdutoEstoque, {
      foreignKey: "idestoque",
    });

    // ProdutoEstoque, Produto - 1:N
    ProdutoEstoque.belongsTo(Produto, {
      foreignKey: "idsku",
    });

    Produto.hasMany(ProdutoEstoque, {
      foreignKey: "idsku",
    });

    // Produto, Estoque - N:N - Tabela de junção ProdutoEstoque
    Produto.belongsToMany(Estoque, {
      through: ProdutoEstoque,
    });

    // Início do procedimento
    console.log(filename, "Iniciando conjunto de querys");
    let queryStart = new Date();

    const produtos = await Produto.findAll({
      attributes: ["idsku", "nome"],
      where: {
        situacao: 1,
        idsku: {
          [Op.regexp]: "^[0-9]+$",
        },
      },
      include: [
        {
          model: Curva,
          required: false,
          attributes: ["nome"],
        },
        {
          model: ProdutoEstoque,
          required: false,
          attributes: ["minimo", "maximo"],
          where: {
            idestoque: 7141524213,
          },
        },
      ],
      raw: true,
    });

    const pedidos = await Produto.findAll({
      attributes: ["idsku"],
      where: {
        situacao: true,
        idsku: {
          [Op.notLike]: "%CONS%",
        },
      },
      include: [
        {
          model: CompraProduto,
          required: false,
          attributes: ["idpedidocompra", "idsku"],

          include: [
            {
              model: PedidoCompra,
              required: false,
              attributes: ["idpedidocompra"],
              where: {
                idstatus: {
                  [Op.ne]: 2,
                },
              },
            },
          ],
        },
      ],
      group: "idsku",
      raw: true,
    });

    console.log("Produtos:", produtos.length);
    // console.log(produtos[0]);

    console.log("Pedidos:", pedidos.length);
    console.log(pedidos);
    // console.log(pedidos[0]);

    // Debug de tempo gasto na execução das querys
    let queryEnd = new Date();
    let queryElapsed = new Date(queryEnd - queryStart)
      .toISOString()
      .slice(11, -1);
    console.log(filename, "Tempo gasto nas querys: ", queryElapsed);

    return http.ok({
      message: "Ok",
      time: queryElapsed,
    });
  },

  async relatorioPrecificacao() {
    const query = (
      await fs.promises.readFile("src/queries/relatorio_precificacao.sql")
    ).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo = "exports/relatorio-precificacao-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async relatorioUltimoCusto() {
    const query = (
      await fs.promises.readFile("src/queries/ultimo_custo.sql")
    ).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo = "exports/relatorio-ultimo-custo-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async relatorioSituacaoEstoque() {
    const query = (
      await fs.promises.readFile("src/queries/situacao_estoque.sql")
    ).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo =
      "exports/relatorio-situacao-estoque-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async relatorioCompraProduto() {
    const query = (
      await fs.promises.readFile("src/queries/compra_produto.sql")
    ).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo = "exports/relatorio-compra-produto-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async relatorioTransferencia() {
    const query = (
      await fs.promises.readFile("src/queries/transferencia.sql")
    ).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo = "exports/relatorio-transferencia-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async relatorioMontagemKits() {
    const query = (
      await fs.promises.readFile("src/queries/montagem_kits.sql")
    ).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo = "exports/relatorio-montagem-kits-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async exportToExcel(lista, arquivo) {
    const workbook = new ExcelJS.Workbook();

    let worksheets = [];

    let nomes = [];
    for (const name in lista[0]) {
      nomes.push(name);
    }

    const sheet = workbook.addWorksheet("Relatório");

    let sheetColumns = [];

    for (const nome of nomes) {
      sheetColumns.push({
        header: nome,
      });
    }

    sheet.columns = sheetColumns;

    worksheets.push(sheet);

    // Insere cada um dos itens da lista como sendo uma linha na tabela
    for (const item of lista) {
      let row = [];

      for (const nome of nomes) {
        // console.log(
        //   "Coluna:",
        //   nome,
        //   "| Tipo:",
        //   typeof item[nome],
        //   "| Valor:",
        //   item[nome]
        // );

        if (typeof item[nome] === "string") {
          if (validator.isDecimal(item[nome], { locale: "pt-BR" })) {
            item[nome] = parseFloat(item[nome].replace(",", "."));
          }
        }

        row.push(item[nome]);
      }

      worksheets[0].addRow(row);
    }

    // Ajuste de tamanho das colunas
    worksheets[0].columns.forEach((column) => {
      const lengths = column.values.map((v) => v.toString().length);
      const maxLength = Math.max(
        ...lengths.filter((v) => typeof v === "number")
      );
      column.width = maxLength + 2;
    });

    // Escreve arquivo final
    await workbook.xlsx
      .writeFile(arquivo + ".xlsx")
      .then(() => console.log("Arquivo excel exportado com sucesso"))
      .catch((error) =>
        console.log("Erro ao exportar arquivo excel: ", error.message)
      );
  },
};
