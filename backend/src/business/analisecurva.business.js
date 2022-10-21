const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const filename = __filename.slice(__dirname.length + 1) + " -";
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { elapsedTime, monthDiff } = require("../utils/time");
const ss = require("simple-statistics");
const minMax = require("dayjs/plugin/minMax");
const currency = require("currency.js");

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

  calcularDestoantes(relacionamentos) {
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

  filtrarDestoantes(relacionamentos, destoantes) {
    const filtrados = relacionamentos.filter((registro) => {
      const valorCorte = destoantes[registro.idsku];

      if (valorCorte) {
        if (registro.quantidade >= valorCorte && registro.idloja == "203398134") return false;
      }

      return true;
    });

    // O resultado é uma lista de relacionamentos com os registros destoantes removidos

    return filtrados;
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
    const relacionamentosPorCategoria = {};

    relacionamentos.forEach((rel) => {
      const chave = rel.categoria ? rel.categoria : "Sem Categoria";

      const atuais = relacionamentosPorCategoria[chave] || [];

      atuais.push(rel);

      relacionamentosPorCategoria[chave] = atuais;
    });

    for (const key in relacionamentosPorCategoria) {
      console.log(key, relacionamentosPorCategoria[key].length);
    }

    console.log(relacionamentosPorCategoria["Sem Categoria"]);

    // [
    //   [
    //     {
    //       ...
    //     },
    //     {
    //       ...
    //     }
    //   ],
    //   [
    //     {
    //       ...
    //     },
    //     {
    //       ...
    //     }
    //   ]
    // ]

    // {
    //   "Motores": [
    //     {
    //       ...
    //     },
    //     {
    //       ...
    //     }
    //   ],
    //   "Maker": [
    //     ...
    //   ]
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

    let memoryStart = new Date();

    // Calcular valores destoantes para cada produto
    const destoantes = this.calcularDestoantes(relacionamentos);

    // Remover registros com quantidades destoantes da lista
    const destoantesFiltrados = this.filtrarDestoantes(relacionamentos, destoantes);

    console.log(filename, "Quantidade de registros filtrados:", destoantesFiltrados.length);

    // Gerar Contadores
    const contadores = this.gerarContadores(destoantesFiltrados);

    // Gerar a Média Mês
    const mediaMes = this.calcularMediaMes(destoantesFiltrados);

    console.log(filename, "Tempo gasto no processamento em memória:", elapsedTime(memoryStart));

    return ok({
      message: "Alive",
    });
  },
};
