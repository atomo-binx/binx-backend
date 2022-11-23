const PedidoCompra = require("../../models/pedidoCompra.model");
const CompraProduto = require("../../models/compraProduto.model");
const Produto = require("../../models/produto.model");
const ProdutoDeposito = require("../../models/produtoDeposito.model");

const { models } = require("../../modules/sequelize");

const { Op, Sequelize } = require("sequelize");
const currency = require("currency.js");

const http = require("../../utils/http");
const { BRLString } = require("../../utils/money");

const filename = __filename.slice(__dirname.length + 1) + " -";

// Rotina para cálculo de custo médio de um produto específico
async function custoMedio(sku, quantidadeVendida) {
  console.log(filename, `Iniciando cálculo de custo médio para o produto: ${sku}`);

  // Primeiramente adquirir custo e quantidade atual do produto
  const produto = await adquireDadosProduto(sku);

  if (!produto) {
    console.log(filename, `O produto '${sku}' não foi encontrado na base dados.`);

    return http.ok({
      message: `O produto ${sku} não foi encontrado na base dados.`,
    });
  }

  // Variáveis para execução do calculo de custo
  let quantidadeEstoque = produto["quantidade"];
  let quantidadeAtender = quantidadeVendida + quantidadeEstoque;

  if (quantidadeEstoque > 0) {
    console.log(filename, "Quantidade Vendida:", quantidadeVendida);
    console.log(filename, "Quantidade em Estoque:", quantidadeEstoque);
    console.log(filename, "Quantidade a Atender:", quantidadeAtender);

    // Localiza quais pedidos será necessário considerar para atingir a quantidade a atender
    let pedidosConsiderados = await localizarPedidosCompra(produto, quantidadeAtender);

    // Identificação dos pedidos de compra completo, iniciar cálculo de custo
    console.log(filename, "Pedidos de compra considerados:", pedidosConsiderados);

    // Agora que temos os pedidos considerados, encontrar o custo para a quantidade vendida

    // Primeiro passo, inverter a array de pedidos considerados
    let ocorrenciasCompra = pedidosConsiderados.reverse();

    ocorrenciasCompra = selecionarOcorrenciasCompra(ocorrenciasCompra, quantidadeVendida);

    console.log(filename, "Quantidades selecionadas para custo:", ocorrenciasCompra);

    // Para 0 unidades vendidas, considerar como cálculo de custo médio do estoque inteiro
    if (quantidadeVendida == 0) quantidadeVendida = quantidadeEstoque;

    // Acumular os custos
    const custoAcumulado = acumularCustos(ocorrenciasCompra);

    // Calcular o custo médio
    const custoMedio = custoAcumulado.divide(quantidadeVendida);

    console.log(filename, "Custo Acumulado:", BRLString(custoAcumulado, "R$ "));
    console.log(filename, "Custo Médio:", BRLString(custoMedio, "R$ "));
  } else {
    console.log(filename, `O produto ${sku} possui estoque negativo, não é possível calcular custo médio`);

    return http.ok({
      message: "...",
    });
  }

  return http.ok({
    message: "Processado",
  });
}

// Adquire dados de produto
async function adquireDadosProduto(sku) {
  const produto = await models.tbproduto.findByPk(sku, {
    attributes: ["idsku", "custo", [Sequelize.col("tbprodutoestoques.quantidade"), "quantidade"]],
    include: [
      {
        model: models.tbprodutoestoque,
        required: true,
        attributes: ["quantidade"],
        where: {
          idestoque: {
            [Op.eq]: 7141524213,
          },
        },
      },
    ],
    raw: true,
  });

  console.log(produto);

  return produto;
}

// Localiza os pedidos de compras necessários para atender uma determinada quantidade
async function localizarPedidosCompra(produto, quantidadeAtender) {
  // Ocorrências de compra desse SKU acumuladas para realizar o cálculo de custo médio
  let ocorrenciasCompra = [];

  // Variável para controlar quantos ciclos de extração de pedidos de compra foram executados
  let ciclo = 0;

  // Adquire os pedidos de compra que contenham este item
  do {
    // Percorrer os pedidos apenas se a quantidade acumulada não foi atingida
    let quantidadeAcumulada = acumularQuantidades(ocorrenciasCompra, "considerado");

    if (quantidadeAcumulada < quantidadeAtender) {
      // Configurar offset e limit para a query de pedidos de compra
      let offset = ciclo++ * 5;
      let limit = 5;

      // Buscar pedidos de venda que contenham esse SKU
      const resultados = await listaPedidosCompra(produto["idsku"], limit, offset);

      if (resultados.length > 0) {
        // Existem pedidos de compra para trabalhar, percorrer cada um deles

        for (const pedido of resultados) {
          // Adquirir quantidade acumulada até agora
          let quantidadeAcumulada = acumularQuantidades(ocorrenciasCompra, ["considerado"]);

          // Verifica se atingimos a quantidade necessária acumulada
          if (quantidadeAcumulada < quantidadeAtender) {
            // Acumular a quantidade deste pedido com o seu devido custo
            ocorrenciasCompra.push({
              idpedidocompra: pedido["idpedidocompra"],
              idsku: produto["idsku"],
              custo: pedido["valor"],
              quantidade: pedido["quantidade"],
              considerado:
                pedido["quantidade"] < quantidadeAtender - quantidadeAcumulada
                  ? pedido["quantidade"]
                  : quantidadeAtender - quantidadeAcumulada,
            });
          } else {
            // Atingimos a quantidade necessária, quebrar o laço for que percorre os pedidos
            break;
          }
        }
      } else {
        // Nenhum pedido de compra retornado nessa leva de consulta
        // Veficicar se foi acumulado algum valor anterior
        if (ocorrenciasCompra.length > 0) {
          // Foram retornados itens em levas anteriores, prosseguir com o cálculo
          // Nesse caso, a quantidade desse item em pedidos anteriores não antende
          // Temos uma tratativa para esse caso? Completar com o custo do bling?
        } else {
          // Não há nenhum valor de compra acumulado para este item
          // Então de fato nenhum pedido de compra foi retornado para este produto
          // Considerar custo salvo no Binx para este produto

          if (produto["custo"]) {
            // Acrescenta o registro na objeto de ocorrências de compras para o cálculo
            ocorrenciasCompra.push({
              idpedidocompra: null,
              idsku: produto["idsku"],
              custo: produto["custo"],
              quantidade: quantidadeAtender,
              considerado: quantidadeAtender,
            });

            break;
          } else {
            // Nenhum pedido de compra retornado, ou nenhum custo no Bling
            console.log(filename, `Panic - O produto ${sku} não possui nenhum custo associado.`);

            break;
          }
        }
      }
    } else {
      // Quantidade necessária atingida, quebrar o laço externo do for
      break;
    }
  } while (true);

  return ocorrenciasCompra;
}

// Lista pedidos de compra com SKU
async function listaPedidosCompra(sku, limit, offset) {
  // Relacionamentos entre Pedido de Compra e Compra Produto
  PedidoCompra.hasMany(CompraProduto, {
    foreignKey: "idpedidocompra",
  });
  CompraProduto.belongsTo(PedidoCompra, {
    foreignKey: "idpedidocompra",
  });

  // Realiza query de busca dos pedidos de compra
  const resultado = await CompraProduto.findAll({
    attributes: [
      [Sequelize.col("PedidoCompra.idpedidocompra"), "idpedidocompra"],
      "idsku",
      "quantidade",
      "valor",
      [Sequelize.col("PedidoCompra.dataconclusao"), "dataconclusao"],
    ],
    where: {
      idsku: sku,
    },
    include: [
      {
        model: PedidoCompra,
        required: true,
        attributes: [],
        where: {
          // Pedidos de compra atendidos
          idstatus: {
            [Op.eq]: 1,
          },
          // Pedidos que não sejam de transferência interna
          idfornecedor: {
            [Op.notIn]: ["7401278638", "9172761844"],
          },
        },
      },
    ],
    order: [[PedidoCompra, "dataconclusao", "desc"]],
    limit: limit,
    offset: offset,
    raw: true,
  });

  return resultado;
}

// Acumula valores de custos de uma lista de pedidos
function acumularCustos(pedidos) {
  const reducer = (acumulado, elemento) => {
    const custo = currency(elemento["custo"], { precision: 6 });
    const quantidade = parseInt(elemento["quantidade"]);

    // ACC += (Custo * Quantidade)
    return currency(acumulado, { precision: 6 }).add(custo.multiply(quantidade, { precision: 6 }), {
      precision: 6,
    });
  };

  return pedidos.reduce(reducer, 0);
}

// Acumula quantidades de uma lista de pedidos
function acumularQuantidades(pedidos, chave) {
  const reducer = (acumulado, elemento) => {
    return acumulado + parseInt(elemento[chave]);
  };

  return pedidos.reduce(reducer, 0);
}

// Seleciona a quantidade de cada pedido de compra que será considerada para atender a venda
function selecionarOcorrenciasCompra(ocorrencias, quantidadeVendida) {
  let ocorrenciasCompra = [];

  for (const pedido of ocorrencias) {
    // Adquirir quantidade acumulada até agora
    let quantidadeAcumulada = acumularQuantidades(ocorrenciasCompra, "quantidade");

    // Verifica se atingimos a quantidade necessária acumulada
    if (quantidadeAcumulada < quantidadeVendida) {
      // Acumular a quantidade deste pedido com o seu devido custo
      ocorrenciasCompra.push({
        idpedidocompra: pedido["idpedidocompra"],
        idsku: pedido["idsku"],
        custo: pedido["custo"],
        quantidade:
          pedido["considerado"] < quantidadeVendida - quantidadeAcumulada
            ? pedido["considerado"]
            : quantidadeVendida - quantidadeAcumulada,
      });
    } else {
      // Atingimos a quantidade necessária, quebrar o laço for que percorre os pedidos
      break;
    }
  }

  return ocorrenciasCompra;
}

module.exports = { custoMedio };
