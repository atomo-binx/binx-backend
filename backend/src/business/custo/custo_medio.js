const { models } = require("../../modules/sequelize");
const { Op, Sequelize } = require("sequelize");
const currency = require("currency.js");
const filename = __filename.slice(__dirname.length + 1) + " -";

async function custoMedio(sku, quantidadeVendida) {
  console.log(filename, `Iniciando cálculo de custo médio para o SKU: ${sku}`);

  // Adquirir dados do produto: idsku, custo, quantidade
  const produto = await adquireDadosProduto(sku);

  if (!produto) {
    return {
      message: "O produto informado não foi encontrado.",
    };
  }

  // Desestruturar a quantidade atual em estoque e a quantidade a atender
  let quantidadeEstoque = produto.quantidade;
  let quantidadeAtender = quantidadeVendida + quantidadeEstoque;

  // Para 0 unidades vendidas, considerar como cálculo de custo médio do estoque inteiro
  if (quantidadeVendida == 0) quantidadeVendida = quantidadeEstoque;

  console.log(filename, "Quantidade Vendida:", quantidadeVendida);
  console.log(filename, "Quantidade Em Estoque:", quantidadeEstoque);
  console.log(filename, "Quantidade a Atender:", quantidadeAtender);

  if (quantidadeEstoque >= 0) {
    // Localiza quais pedidos devem ser considerados para atingir a quantidade a atender
    let pedidosCompra = await pedidosCompraConsiderados(produto, quantidadeAtender);

    console.log(filename, "Pedidos de compra considerados:", pedidosCompra);

    // Inverter a array de pedidos considerados para aplicar regrar FIFO
    pedidosCompra = pedidosCompra.reverse();

    // A busca por pedidos de compra retorna todas as ocorrências para suprir a demanda
    // Ou seja, a "quantidade em estoque" + "quantidade vendida"
    // Porém, queremos o custo apenas para a quantidade vendida
    // É necessário aplicar regrar de FIFO, para pegar as ocorrências mais "antigas" de estoque
    // Portanto, nem todas as ocorrências de compra serão utilizadas
    // Serão consideradas as ocorrências partindo da mais "antiga", até atender a "quantidade vendida"

    // Selecionar quais ocorrências que terão quantidades consideradas para o cálculo
    const ocorrenciasCompra = selecionarOcorrenciasCompra(pedidosCompra, quantidadeVendida);

    console.log(filename, "Quantidades selecionadas para custo:", ocorrenciasCompra);

    // Acumular os custos
    const custoAcumulado = acumularCustos(ocorrenciasCompra);

    // Calcular o custo médio
    const custoMedio = custoAcumulado.divide(quantidadeVendida);

    console.log(filename, "Custo Acumulado:", custoAcumulado.value);
    console.log(filename, "Custo Médio:", custoMedio.value);

    return {
      custoMedio,
      custoAcumulado,
      pedidosCompra,
      ocorrenciasCompra,
    };
  } else {
    console.log(filename, `O produto ${sku} possui estoque negativo, não é possível calcular custo médio`);

    throw Error(`O produto ${sku} possui estoque negativo, não é possível calcular custo médio`);
  }
}

async function adquireDadosProduto(sku) {
  // Retorna as seguintes informações sobre um SKU

  // {
  //   idsku,
  //   custo,
  //   quantidade
  // }

  // O campo de "custo" é o custo presente no Bling
  // Será utilizado em situações que não existem um último custo registrado

  const produto = await models.tbproduto.findByPk(sku, {
    attributes: ["idsku", "custo", [Sequelize.col("tbprodutoestoques.quantidade"), "quantidade"]],
    include: [
      {
        model: models.tbprodutoestoque,
        required: true,
        attributes: [],
        where: {
          idestoque: {
            [Op.eq]: 7141524213,
          },
        },
      },
    ],
    raw: true,
  });

  return produto;
}

async function listaPedidosCompra(sku, limit, offset) {
  // Retorna uma lista com pedidos de compra que contenham o SKU em questão

  // Os pedidos são atendidos e ordenados do mais novo para o mais antigo

  // [
  //   {
  //     idpedidocompra, idsku, quantidade, valor, dataconclusao
  //   },
  //   {
  //     ...
  //   },
  // ]

  const resultado = await models.tbcompraproduto.findAll({
    attributes: [
      [Sequelize.col("tbpedidocompra.idpedidocompra"), "idpedidocompra"],
      "idsku",
      "quantidade",
      "valor",
      [Sequelize.col("tbpedidocompra.dataconclusao"), "dataconclusao"],
    ],
    where: {
      idsku: sku,
    },
    include: [
      {
        model: models.tbpedidocompra,
        required: true,
        attributes: [],
        where: {
          idstatus: 1,
          idfornecedor: {
            [Op.notIn]: [
              "7401278638", // Baú da Eletrônica Componentes Eletronicos Ltda -
              "9172761844", // Loja Física
              "10733118103", // TRANSFERENCIA
              "12331146486", // estoque virtual
              "15723207321", // ESTOQUE VIRTUAL
              "15727421793", // LANÇAMENTO DE ESTOQUE DE PEDIDO
            ],
          },
        },
      },
    ],
    order: [[models.tbpedidocompra, "dataconclusao", "desc"]],
    limit: limit,
    offset: offset,
    raw: true,
  });

  return resultado;
}

async function pedidosCompraConsiderados(produto, quantidadeAtender) {
  // Formato do objeto de ocorrências de compra que será retornado:

  // {
  //   idpedidocompra,
  //   idsku,
  //   custo,
  //   quantidade,
  //   considerado
  // }

  let ocorrenciasCompra = [];
  let ciclo = 0;
  let procurando = true;

  do {
    let limit = 5;
    let offset = ciclo++ * limit;

    // Buscar um ciclo de pedidos de compra que contenham esse SKU
    const resultados = await listaPedidosCompra(produto.idsku, limit, offset);

    if (resultados.length > 0) {
      for (const pedido of resultados) {
        // Atualizar a quantidade acumulada até agora
        let quantidadeAcumulada = acumularQuantidades(ocorrenciasCompra, "considerado");

        if (quantidadeAcumulada < quantidadeAtender) {
          // Calcular se para este pedido será considerado a quantidade completa ou parcial
          const considerar =
            pedido.quantidade < quantidadeAtender - quantidadeAcumulada
              ? pedido.quantidade
              : quantidadeAtender - quantidadeAcumulada;

          // Registrar esse pedido de compra como uma ocorrência a ser considerada
          ocorrenciasCompra.push({
            idpedidocompra: pedido.idpedidocompra,
            dataconclusao: pedido.dataconclusao,
            idsku: produto.idsku,
            custo: pedido.valor,
            quantidade: pedido.quantidade,
            considerado: considerar,
          });
        } else {
          // Atingimos a quantidade necessária, parar o ciclo de busca
          procurando = false;
          break;
        }
      }
    } else {
      // Nenhum pedido de compra retornado nessa leva de consulta

      // Veficicar se foi acumulado algum valor anterior
      if (ocorrenciasCompra.length > 0) {
        // Foram retornados itens em levas anteriores, porém, não atende a quantidade necessária
        // Temos uma tratativa para esse caso? Completar com o custo do bling?
      } else {
        // Nenhum pedido de compra foi retornado para este produto
        // Considerar custo salvo no Binx (originado no Bling) para este produto

        if (produto.custo) {
          ocorrenciasCompra.push({
            idpedidocompra: null,
            dataconclusao: null,
            idsku: produto.idsku,
            custo: produto.custo,
            quantidade: quantidadeAtender,
            considerado: quantidadeAtender,
          });
        } else {
          // Nenhum pedido de compra retornado, ou nenhum custo no Bling
          // Temos uma tratativa para esse caso?
        }

        procurando = false;
        break;
      }
    }
  } while (procurando);

  return ocorrenciasCompra;
}

function acumularQuantidades(pedidos, chave) {
  const reducer = (acumulado, elemento) => {
    return acumulado + parseInt(elemento[chave]);
  };

  return pedidos.reduce(reducer, 0);
}

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

function selecionarOcorrenciasCompra(ocorrencias, quantidadeVendida) {
  let ocorrenciasCompra = [];

  for (const pedido of ocorrencias) {
    // Atualizar quantidade acumulada até agora
    let quantidadeAcumulada = acumularQuantidades(ocorrenciasCompra, "quantidade");

    if (quantidadeAcumulada < quantidadeVendida) {
      ocorrenciasCompra.push({
        idpedidocompra: pedido.idpedidocompra,
        dataconclusao: pedido.dataconclusao,
        idsku: pedido.idsku,
        custo: pedido.custo,
        quantidade:
          pedido.considerado < quantidadeVendida - quantidadeAcumulada
            ? pedido.considerado
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
