const Produto = require("../models/produto.model");
const Estoque = require("../models/deposito.model");
const ProdutoEstoque = require("../models/produtoDeposito.model");
const Disponibilidade = require("../models/disponibilidade.model");
const DisponibilidadeCurva = require("../models/disponibilidadeCurva.model");
const Curva = require("../models/curva.model");
const PedidoCompra = require("../models/pedidoCompra.model");
const CompraProduto = require("../models/compraProduto.model");

const { models } = require("../modules/sequelize");

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
        worksheets[i].addRow([item.idsku, item.nome, item.quantidade, item.minimo, item.maximo]);
      }
    }

    // Escreve arquivo final
    await workbook.xlsx
      .writeFile("./exports/dashboard_compras.xlsx")
      .then(() => console.log(filename, "Arquivo excel exportado com sucesso"))
      .catch((error) => console.log(filename, "Erro ao exportar arquivo excel: ", error.message));
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

      let dataFinal = moment(moment().endOf("day")).format("YYYY-MM-DD HH:mm:ss");
      console.log(filename, "Data Final:", dataFinal);

      let dataInicio = moment(moment().subtract(30, "days").startOf("day")).format("YYYY-MM-DD HH:mm:ss");
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
    let queryElapsed = new Date(queryEnd - queryStart).toISOString().slice(11, -1);
    console.log(filename, "Tempo gasto nas querys: ", queryElapsed);

    return http.ok({
      message: "Ok",
      time: queryElapsed,
    });
  },

  async relatorioPrecificacao() {
    const query = (await fs.promises.readFile("src/queries/relatorio_precificacao.sql")).toString();

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
    const query = (await fs.promises.readFile("src/queries/ultimo_custo.sql")).toString();

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
    const query = (await fs.promises.readFile("src/queries/situacao_estoque.sql")).toString();

    const resultados = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const nomeArquivo = "exports/relatorio-situacao-estoque-" + dateToFilename();

    await this.exportToExcel(resultados, nomeArquivo);

    return ok({
      status: OkStatus,
      response: {
        filename: nomeArquivo + ".xlsx",
      },
    });
  },

  async relatorioCompraProduto() {
    const query = (await fs.promises.readFile("src/queries/compra_produto.sql")).toString();

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
    const query = (await fs.promises.readFile("src/queries/transferencia.sql")).toString();

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
    const query = (await fs.promises.readFile("src/queries/montagem_kits.sql")).toString();

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
      const maxLength = Math.max(...lengths.filter((v) => typeof v === "number"));
      column.width = maxLength + 2;
    });

    // Escreve arquivo final
    await workbook.xlsx
      .writeFile(arquivo + ".xlsx")
      .then(() => console.log("Arquivo excel exportado com sucesso"))
      .catch((error) => console.log("Erro ao exportar arquivo excel: ", error.message));
  },
};
