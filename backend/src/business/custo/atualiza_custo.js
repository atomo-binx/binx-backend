const Produto = require("../../models/produto.model");
const Estrutura = require("../../models/estrutura.model");

const { Op, Sequelize } = require("sequelize");

const currency = require("currency.js");

const filename = __filename.slice(__dirname.length + 1) + " -";

async function atualizaCusto(pedido) {
  // Associações
  Produto.hasMany(Estrutura, {
    foreignKey: "skupai",
  });

  Produto.hasMany(Estrutura, {
    foreignKey: "skufilho",
  });

  // Atualizar valores de último custo dos produtos neste pedido
  for (const produto of pedido["itens"]) {
    try {
      await Produto.upsert({
        idsku: produto["idsku"],
        ultimocusto: produto["valor"],
      });
    } catch (error) {
      console.log(
        filename,
        `Pedido de Compra ${pedido["idpedidocompra"]}:`,
        `Não foi possível atualizar o custo do SKU: ${produto["idsku"]}`
      );
    }
  }

  console.log(
    filename,
    `Pedido de Compra ${pedido["idpedidocompra"]}:`,
    "Custos dos produtos atualizados com sucesso"
  );

  // Calcular e atualizar valores de custos para produtos com estrutura
  for (const produto of pedido["itens"]) {
    // Identifica possíveis estruturas que contenham este item
    const estruturas = await Estrutura.findAll({
      attributes: ["skupai", "skufilho", "quantidade"],
      where: {
        skufilho: produto["idsku"],
      },
      raw: true,
    });

    for (const skuPai of estruturas) {
      const filhos = await Produto.findAll({
        attributes: [
          [Sequelize.col("Estruturas.skupai"), "skupai"],
          [Sequelize.col("Estruturas.skufilho"), "skufilho"],
          [Sequelize.col("Estruturas.quantidade"), "quantidade"],
          "ultimocusto",
        ],
        include: [
          {
            model: Estrutura,
            required: true,
            attributes: [],
            where: {
              skupai: skuPai["skupai"],
            },
          },
        ],
        raw: true,
      });

      // Acumular os custos dos filhos
      const totalAcumulado = acumularCustos(filhos).value;

      // filhos["total"] = totalAcumulado.value;
      // console.log(filhos);

      // Atualizar o custo acumulado do SKU pai
      try {
        await Produto.update(
          {
            ultimocusto: totalAcumulado,
          },
          {
            where: {
              idsku: skuPai["skupai"],
            },
          }
        );

        console.log(
          filename,
          `Pedido de Compra ${pedido["idpedidocompra"]}:`,
          "Custo de estrutura atualizado com sucesso"
        );
      } catch (error) {
        console.log(
          filename,
          `Pedido de Compra ${pedido["idpedidocompra"]}:`,
          "Falha durante atualização do custo de estrutura"
        );
      }
    }
  }

  return true;
}

function acumularCustos(pedidos) {
  const reducer = (acumulado, elemento) => {
    const custo = currency(elemento["ultimocusto"], { precision: 6 });
    const quantidade = parseInt(elemento["quantidade"]);

    // ACC += (Custo * Quantidade)
    return currency(acumulado, { precision: 6 }).add(
      custo.multiply(quantidade, { precision: 6 }),
      {
        precision: 6,
      }
    );
  };

  return pedidos.reduce(reducer, 0);
}

module.exports = { atualizaCusto };
