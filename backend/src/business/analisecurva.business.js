const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const { Op } = require("sequelize");
const { elapsedTime, monthDiff } = require("../utils/time");
const dayjs = require("dayjs");
const ss = require("simple-statistics");
const minMax = require("dayjs/plugin/minMax");
const currency = require("currency.js");
const filename = __filename.slice(__dirname.length + 1) + " -";

dayjs.extend(minMax);

module.exports = {
  async query() {
    console.log(filename, "Iniciando query para análise de curva");

    let queryStart = new Date();

    const resultadosQuery = await models.tbpedidovenda.findAll({
      attributes: ["idpedidovenda", "idstatusvenda", "datavenda", "idloja"],
      include: [
        {
          model: models.tbvendaproduto,
          required: true,
          attributes: ["quantidade", "valorunidade"],
          include: [
            {
              model: models.tbproduto,
              attributes: ["idsku", "idcategoria", "nome"],
              required: true,
              where: {
                situacao: 1,
                idsku: {
                  [Op.regexp]: "^[0-9]+$",
                },
              },
              include: [
                {
                  model: models.tbcategoria,
                  required: true,
                  attributes: ["nome"],
                },
              ],
            },
          ],
        },
      ],
      where: {
        // Ignorar pedidos cancelados
        idstatusvenda: {
          [Op.not]: "12",
        },
        // Considerar período de vendas de 1 ano
        datavenda: {
          [Op.gt]: dayjs().subtract(1, "year").format(),
        },
        // Ignorar Lojas - Transferência e SAC
        idloja: {
          [Op.notIn]: ["203564921", "203674710"],
        },
      },
      raw: true,
      nest: true,
    });

    const relacionamentos = resultadosQuery.map((res) => {
      return {
        idpedidovenda: res.idpedidovenda,
        idstatusvenda: res.idstatusvenda,
        datavenda: res.datavenda,
        idloja: res.idloja,
        idsku: res.tbvendaprodutos.tbproduto.idsku,
        nome: res.tbvendaprodutos.tbproduto.nome,
        quantidade: res.tbvendaprodutos.quantidade,
        idcategoria: res.tbvendaprodutos.tbproduto.idcategoria,
        categoria: res.tbvendaprodutos.tbproduto.tbcategorium.nome,
        valorunidade: parseFloat(res.tbvendaprodutos.valorunidade),
      };
    });

    console.log(filename, "Tempo gasto na query:", elapsedTime(queryStart));

    return relacionamentos;
  },

  calcularCorteDestoante(relacionamentos) {
    // O parâmetro para cálculo do desvio padrão deve ser uma array com as quantidades vendidas

    // Gerar um dicionário que contenha uma lista com as quantidades vendidas de cada item
    // {
    //   "1810": [10, 20, 30, ...],
    //   "1811": [40, 50, 60, ...]
    // }

    let quantidadesVendidas = {};

    relacionamentos.forEach((rel) => {
      let quantidades = quantidadesVendidas[rel.idsku] || [];
      quantidades.push(rel.quantidade);
      quantidadesVendidas[rel.idsku] = quantidades;
    });

    // O valor destoante será igual ao valor de media + desvio padrão das quantidades vendidas

    // O resultado é um dicionário com o valor destoante para cada SKU
    // {
    //   "1810": 10,
    //   "1811": 20,
    // }

    let destoantes = {};

    for (const idsku in quantidadesVendidas) {
      const quantidades = quantidadesVendidas[idsku];
      const media = Number(ss.mean(quantidades).toFixed(2));
      const desvio = Number(ss.standardDeviation(quantidades).toFixed(2));
      const destoante = Number(parseFloat(media + desvio).toFixed(2));

      destoantes[idsku] = destoante;
    }

    return destoantes;
  },

  filtrarDestoantes(relacionamentos, cortesDestoantes) {
    // Remove da lista de relacionamentos todos os registros com quantidades de venda destoantes
    // É recebido uma lista de relacionamentos e um dicionário com os valores de corte

    const filtrados = relacionamentos.filter((registro) => {
      const valorCorte = cortesDestoantes[registro.idsku];

      if (registro.quantidade >= valorCorte && registro.idloja == "203398134") return false;

      return true;
    });

    // O resultado é uma lista de relacionamentos com os registros destoantes removidos

    return filtrados;
  },

  calcularDestoantesAcumulados(relacionamentos, cortesDestoantes) {
    // Calcula o valor acumulado total destoante conforme cada uma das categorias

    // Fatores de cálculo para cada uma das categorias - Core Config?
    const dicionarioFatores = {
      Acessórios: "quantidadeVendida",
      Componentes: "numeroPedidos",
      Ferramentas: "faturamento",
      Motores: "quantidadeVendida",
      Maker: "faturamento",
    };

    // Gerar uma lista com o valor acumulado considerado como destoante
    // O valor acumulado muda conforme o fator de cálculo de cada categoria

    // {
    //   "1810": 100,
    //   "1811": 1569.99
    // }

    const destoantesAcumulados = {};

    relacionamentos.forEach((rel) => {
      const valorCorte = cortesDestoantes[rel.idsku];

      const consideradoDestoante = rel.quantidade >= valorCorte && rel.idloja == "203398134";

      if (consideradoDestoante) {
        const fator = dicionarioFatores[rel.categoria] || null;

        let acumulado = destoantesAcumulados[rel.idsku] || 0;

        switch (fator) {
          case "quantidadeVendida":
            acumulado += rel.quantidade;
            break;
          case "numeroPedidos":
            acumulado++;
            break;
          case "faturamento":
            acumulado = currency(acumulado).add(currency(rel.valorunidade).multiply(rel.quantidade)).value;
            break;
          default:
            break;
        }

        destoantesAcumulados[rel.idsku] = acumulado;
      }
    });

    return destoantesAcumulados;
  },

  calcularMediaMes(relacionamentos) {
    // Criar um dicionário contendo as quantidades vendidas e as datas de venda
    // {
    //   "1810": {
    //     datas: ["2022-01-01", "2022-01-02", "..."],
    //     quantidades: [10, 20, ...]
    //   }
    // }

    let datasQuantidades = {};

    relacionamentos.forEach((rel) => {
      const registro = datasQuantidades[rel.idsku] || {};

      const quantidades = registro.quantidades || [];
      const datas = registro.datas || [];

      quantidades.push(rel.quantidade);
      datas.push(rel.datavenda);

      registro.idsku = rel.idsku;
      registro.datas = datas;
      registro.quantidades = quantidades;

      datasQuantidades[rel.idsku] = registro;
    });

    // Possuindo as datas, realizar o cálculo de média mês
    let mediaMes = {};

    for (let idsku in datasQuantidades) {
      const registro = datasQuantidades[idsku];

      // Realizar somatória das quantidades vendidas
      const somatoriaQuantidades = ss.sum(registro.quantidades);

      // Adquirir a menor e maior data de venda
      const menorData = registro.datas.reduce(function (a, b) {
        return a < b ? a : b;
      });
      const maiorData = registro.datas.reduce(function (a, b) {
        return a > b ? a : b;
      });

      // Calcular a diferença de meses entre a maior e menor data
      const mesesVendidos = monthDiff(new Date(menorData), new Date(maiorData));

      // Calcular a média mês
      const media = Number(Number(somatoriaQuantidades / mesesVendidos).toFixed(2));

      mediaMes[registro.idsku] = {
        somatoriaQuantidades,
        menorData,
        maiorData,
        mesesVendidos,
        media,
      };
    }

    // O resultado é um dicionário em que a chave é o SKU do produto

    // {
    //   '1810': {
    //     somatoriaQuantidades: 120,
    //     menorData: '2020-10-01',
    //     maiorData: '2021-10-01',
    //     mesesVendidos: 12,
    //     mediaMes: 10
    //   }
    // }

    return mediaMes;
  },

  separarPorCategoria(relacionamentos) {
    // const skuSet = new Set();

    // relacionamentos.forEach((rel) => {
    //   skuSet.add(rel.idsku);
    // });

    const produtosPorCategoria = {};

    relacionamentos.forEach((rel) => {
      const categoria = rel.categoria ? rel.categoria : "Sem Categoria";

      const produtos = produtosPorCategoria[categoria] || {};

      produtos[rel.idsku] = {
        idsku: rel.idsku,
        idcategoria: rel.idcategoria,
        categoria: rel.categoria,
        nome: rel.nome,
      };

      produtosPorCategoria[categoria] = produtos;
    });

    return produtosPorCategoria;

    // {
    //   "Motores": {
    //     "SKU": {
    //       "contador": "",
    //       "media": "",
    //       "...": "..."
    //     }
    //   },
    //   "Maker": {
    //     "SKU": {
    //       "contador": "",
    //       "media": "",
    //       "...": "..."
    //     }
    //   }
    // }
  },

  gerarContadores(relacionamentos) {
    // Core Config?
    const dicionarioFatores = {
      Acessórios: "quantidadeVendida",
      Componentes: "numeroPedidos",
      Ferramentas: "faturamento",
      Motores: "quantidadeVendida",
      Maker: "faturamento",
    };

    const contadores = {};

    relacionamentos.forEach((rel) => {
      const fator = dicionarioFatores[rel.categoria] || null;

      if (fator) {
        let contador = contadores[rel.idsku] || 0;

        switch (fator) {
          case "quantidadeVendida":
            contador += rel.quantidade;
            break;
          case "numeroPedidos":
            contador++;
            break;
          case "faturamento":
            contador = currency(contador).add(currency(rel.valorunidade).multiply(rel.quantidade)).value;
            break;
        }

        contadores[rel.idsku] = contador;
      }
    });

    return contadores;
  },

  async analiseCurva() {
    // Adquirir todos os relacionamentos de venda-produto
    const relacionamentos = await this.query();

    console.log(filename, "Quantidade de registros processados:", relacionamentos.length);

    // Início do tratamento em memória
    let memoryStart = new Date();

    // Calcular valores de corte destoante para cada produto
    const cortesDestoantes = this.calcularCorteDestoante(relacionamentos);

    // Remover registros com quantidades destoantes da lista
    const destoantesFiltrados = this.filtrarDestoantes(relacionamentos, cortesDestoantes);

    console.log(filename, "Quantidade de registros após filtro destoante:", destoantesFiltrados.length);

    // Gerar Contadores
    const contadores = this.gerarContadores(destoantesFiltrados);

    // Gerar a Média Mês
    const mediaMes = this.calcularMediaMes(destoantesFiltrados);

    // Calcular o valor acumulado considerado como destoantes
    const destoantesAcumulados = this.calcularDestoantesAcumulados(relacionamentos, cortesDestoantes);

    // Criar listas separadas por categoria
    const categorias = this.separarPorCategoria(relacionamentos);

    // Acrescentar dados calculados na lista de categorias
    for (const categoria in categorias) {
      for (const sku in categorias[categoria]) {
        const registro = categorias[categoria][sku];

        let contador = 0;
        let media = 0;
        let destoante = 0;

        if (Object.prototype.hasOwnProperty.call(contadores, sku)) {
          contador = contadores[sku];
        }

        if (Object.prototype.hasOwnProperty.call(mediaMes, sku)) {
          media = mediaMes[sku].media;
        }

        if (Object.prototype.hasOwnProperty.call(destoantesAcumulados, sku)) {
          destoante = destoantesAcumulados[sku];
        }

        categorias[categoria][sku] = {
          ...registro,
          contador,
          mediaMes: media,
          destoante,
        };
      }
    }

    // Ordernar lista de categorias pelo contador
    let chavesOrdenadas = {};

    for (const categoria in categorias) {
      const keys = Object.keys(categorias[categoria]);

      chavesOrdenadas[categoria] = keys.sort((a, b) => {
        return categorias[categoria][a].contador - categorias[categoria][b].contador;
      });
    }

    for (const categoria in categorias) {
      for (const sku in categorias[categoria]) {
        console.log(categoria, sku);
      }
    }

    // let categoriasOrdenadas = {};

    // for (const categoria in chavesOrdenadas) {
    //   chavesOrdenadas[categoria].forEach(item => {

    //   })
    // }

    // console.log(categoriasOrdenadas["Motores"]);

    console.log(filename, "Tempo gasto no processamento em memória:", elapsedTime(memoryStart));

    // console.log(Object.keys(chavesOrdenadas).length);

    // console.log(chavesOrdenadas);

    // console.log(categorias["Motores"]);

    return ok({
      message: "Alive",
    });
  },
};
