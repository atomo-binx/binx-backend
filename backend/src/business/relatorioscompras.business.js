const { ok } = require("../modules/http");
const { models, sequelize } = require("../modules/sequelize");
const { Op, Sequelize, QueryTypes } = require("sequelize");
const fs = require("fs");
const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async relatorioGeral() {
    let queryStart = new Date();

    const relatorioGeral = await this.querySituacaoEstoque();
    const pedidosCompra = await this.queryPedidosCompra();

    let queryElapsed = new Date(new Date() - queryStart).toISOString().slice(11, -1);
    console.log(filename, "Tempo gasto com queries no banco de dados:", queryElapsed);

    // Desestrutura o resultado de pedidos de compra no seguinte formato:
    // Dicionario em que a chave é o SKU, e o valor é uma lista contendo os pedidos já realizados

    // {
    //    [sku]: [{ ... }, { ... }, { ... }],
    //    [sku]: [{ ... }, { ... }],
    //    [sku]: [{ ... }],
    // }

    let memoryStart = new Date();

    let dicionarioPedidosCompra = {};

    pedidosCompra.forEach((pedido) => {
      const listaAtual = dicionarioPedidosCompra[pedido.idsku] || [];
      listaAtual.push(pedido);
      dicionarioPedidosCompra[pedido.idsku] = [...listaAtual];
    });

    relatorioGeral.forEach((entrada) => {
      // Enquanto percorremos o resultado do relatorio geral, aproveitar o loop para desestruturar
      entrada.minimo = entrada.tbprodutoestoques.minimo;
      entrada.maximo = entrada.tbprodutoestoques.maximo;
      entrada.quantidade = entrada.tbprodutoestoques.quantidade;
      entrada.situacaoEstoqueMin = entrada.tbprodutoestoques.situacaoEstoqueMin;
      entrada.cobertura = entrada.tbprodutoestoques.cobertura;
      delete entrada.tbprodutoestoques;

      // Aplicar lógica de seleção de último pedido de compra para um produto específico
      const pedidos = dicionarioPedidosCompra[entrada.idsku];

      let pedido;

      if (pedidos) {
        const abertoOuAndamento = pedidos.filter(
          (pedido) => pedido.status === "Em aberto" || pedido.status === "Em andamento"
        );

        pedido = abertoOuAndamento.length > 0 ? abertoOuAndamento[0] : pedidos[0];
      }

      entrada.nomefornecedor = pedido ? pedido.nomefornecedor : "-";
      entrada.status = pedido ? pedido.status : "-";
      entrada.codigofornecedor = pedido ? pedido.codigofornecedor : "-";

      if (entrada.formato === "Com Composição") {
        entrada.nomefornecedor = "Estrutura";
      }

      delete entrada.formato;
    });

    // console.log(relatorioGeral);

    let memoryElapsed = new Date(new Date() - memoryStart).toISOString().slice(11, -1);
    console.log(filename, "Tempo gasto com processamento em memória:", memoryElapsed);

    return ok({
      response: relatorioGeral,
    });
  },

  async querySituacaoEstoque() {
    const resultado = await models.tbproduto.findAll({
      attributes: ["idsku", "nome", "curva", "formato"],
      include: [
        {
          model: models.tbprodutoestoque,
          attributes: [
            "minimo",
            "maximo",
            "quantidade",
            [
              Sequelize.literal(
                `
                CASE 
                  WHEN quantidade > minimo then "Acima" 
                  WHEN quantidade < minimo THEN "Abaixo" 
                  WHEN quantidade = minimo THEN "Igual" 
                  else "-"
                END
                `
              ),
              "situacaoEstoqueMin",
            ],
            [Sequelize.literal(`replace(round(quantidade/minimo, 2), ".", ",")`), "cobertura"],
          ],
          where: {
            idestoque: "7141524213",
          },
        },
      ],
      where: {
        idsku: {
          [Op.regexp]: "^[0-9]+$",
        },
        situacao: 1,
      },
      nest: true,
      raw: true,
    });

    return resultado;
  },

  async queryPedidosCompra() {
    const query = (await fs.promises.readFile("src/queries/pedidos_compra.sql")).toString();

    const pedidos = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return pedidos;
  },
};
