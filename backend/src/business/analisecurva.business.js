const { models } = require("../modules/sequelize");
const { ok } = require("../modules/http");
const { Op } = require("sequelize");
const { elapsedTime, monthDiff } = require("../utils/time");
const { inRange } = require("../utils/range");
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

    // O resultado da query é uma array contendo uma lista de relacionamentos
    // Cada registro na lista, é uma ocorrência de venda-produto
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

    // O valor de corte destoante será igual ao valor de media + desvio padrão das quantidades vendidas

    // O resultado é um dicionário com o valor de corte destoante para cada SKU
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
    //     idsku: 1810
    //     datas: ["2022-01-01", "2022-01-02", "..."],
    //     quantidades: [10, 20, ...]
    //   }
    //   "1811": {
    //     idsku: 1811,
    //     datas: ["2022-03-01", "2022-04-02", "..."],
    //     quantidades: [100, 200, ...]
    //   }
    // }

    let datasQuantidades = {};

    // Definir as listas de datas e quantidades para cada item presente nos relacionamentos
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

    // Com as listas de datas e quantidades, calcular o valor de média mês e meses vendidos
    let mediaMes = {};

    for (let idsku in datasQuantidades) {
      const datas = datasQuantidades[idsku].datas;
      const quantidades = datasQuantidades[idsku].quantidades;

      // Realizar somatória das quantidades vendidas
      const somatoriaQuantidades = ss.sum(quantidades);

      // Adquirir a menor e maior data de venda
      const menorData = datas.reduce(function (a, b) {
        return a < b ? a : b;
      });
      const maiorData = datas.reduce(function (a, b) {
        return a > b ? a : b;
      });

      // Calcular a diferença de meses entre a maior e menor data
      const mesesVendidos = monthDiff(new Date(menorData), new Date(maiorData));

      // Calcular a média mês
      const media = Number(Number(somatoriaQuantidades / mesesVendidos).toFixed(2));

      mediaMes[idsku] = {
        media,
        mesesVendidos,
        somatoriaQuantidades,
      };
    }

    // O resultado é um dicionário em que a chave é o SKU do produto

    // {
    //   '1810': {
    //     media: 10
    //     mesesVendidos: 12,
    //     somatoriaQuantidades
    //   }
    // }

    return mediaMes;
  },

  separarPorCategoria(relacionamentos) {
    const produtosPorCategoria = {};

    relacionamentos.forEach((rel) => {
      const categoria = rel.categoria ? rel.categoria : "Sem Categoria";

      const produtos = produtosPorCategoria[categoria] || {};

      produtos[rel.idsku] = {
        idsku: rel.idsku,
        categoria: rel.categoria,
        nome: rel.nome,
      };

      produtosPorCategoria[categoria] = produtos;
    });

    return produtosPorCategoria;

    // {
    //   "Motores": {
    //     "SKU": {
    //       "..."
    //     }
    //   },
    //   "Maker": {
    //     "SKU": {
    //       "..."
    //     }
    //   }
    //   ...
    // }
  },

  gerarContadores(relacionamentos) {
    // Adquirir os fatores de cálculo de curva para cada categoria

    // Core Config?
    const dicionarioFatores = {
      Acessórios: "quantidadeVendida",
      Componentes: "numeroPedidos",
      Ferramentas: "faturamento",
      Motores: "quantidadeVendida",
      Maker: "faturamento",
    };

    // Para cada registro de relacionamento, é adquirido o fator de cálculo de curva desse produto
    // O contador é calculado conforme o fator da categoria e inserido no dicionario

    // Retorna um dicionário contendo os contadores por SKU
    // {
    //   "1810": 100,
    //   "1811": 1564.96
    // }

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

  ordernarPorContador(categorias) {
    // Gerar lista de SKUS ordenados por cada categoria
    // O critério de ordenação é o valor do Contador
    // Primeiramente, teremos apenas a chaves ordenadas, ou seja, apenas os SKU's
    let chavesOrdenadas = {};

    // Na primeira etapa é gerado um dicionário com os SKU's ordenados por categoria

    // {
    //   "Motores": [sku, sku, sku, ...],
    //   "Maker": [sku, sku, sku, ...],
    // }

    for (const categoria in categorias) {
      const keys = Object.keys(categorias[categoria]);

      chavesOrdenadas[categoria] = keys.sort((a, b) => {
        return categorias[categoria][b].contador - categorias[categoria][a].contador;
      });
    }

    return chavesOrdenadas;

    // Após obter as chaves ordenadas, é necessário remontar o objeto de categorias
    // Criamos um novo objeto seguindo a ordem das chaves ordenadas
    let categoriasOrdenadas = {};

    // Para preservar a ordem de inserção, agora a lista foi transformada em uma array

    // {
    //   "Motores": [
    //     {
    //       idsku,
    //       ...
    //     },
    //     {
    //       {
    //         idsku,
    //         ...
    //       }
    //     }
    //   ],
    //   "Maker": [
    //     ...
    //   ]
    // }

    // Por enquanto vamos retornar o início da função, apenas com as chaves
    // Testando de maneira que se mantenha a mesma lógica geral, de usar ojetos separados
    // No final vamos tentar juntar tudo

    // for (const categoria in chavesOrdenadas) {
    //   chavesOrdenadas[categoria].forEach((idsku) => {
    //     const atuais = categoriasOrdenadas[categoria] || [];
    //     atuais.push(categorias[categoria][idsku]);
    //     categoriasOrdenadas[categoria] = atuais;
    //   });
    // }

    // return categoriasOrdenadas;
  },

  calcularCurvas(categoriasOrdenadas) {
    // É recebido um dicionário de chaves ordenadas por contador

    // {
    //   "Motores": [sku, sku, sku, ...],
    //   "Maker": [sku, sku, sku, ...]
    // }

    // Para cada uma das categorias, é calculado a quantidade de produtos em cada curva

    // O retorno é um dicionário que contem a curva de cada um dos produtos por sku

    // {
    //   "1810": "Curva A",
    //   "4010": "Curva B",
    //   "8321": "Curva C"
    // }

    // Core Config?
    const porcentagensCurvas = {
      "Curva A": 20,
      "Curva B": 30,
      "Curva C": 50,
    };

    let curvas = {};

    for (const categoria in categoriasOrdenadas) {
      const totalItensCategoria = categoriasOrdenadas[categoria].length;

      const qntdCurvaA = Math.round((totalItensCategoria * porcentagensCurvas["Curva A"]) / 100);
      const qntdCurvaB = Math.round((totalItensCategoria * porcentagensCurvas["Curva B"]) / 100);

      categoriasOrdenadas[categoria].forEach((idsku, idx) => {
        if (inRange(idx, 0, qntdCurvaA)) curvas[idsku] = "Curva A";
        if (inRange(idx, qntdCurvaA, qntdCurvaA + qntdCurvaB)) curvas[idsku] = "Curva B";
        if (inRange(idx, qntdCurvaA + qntdCurvaB, totalItensCategoria)) curvas[idsku] = "Curva C";
      });
    }

    return curvas;
  },

  calcularMinMax(categoriasOrdenadas, curvas, mediaMes) {
    // Recebe uma lista com o SKU's ordenados por categoria

    // {
    //   "Motores": [sku, sku, sku, ...],
    //   "Maker": [sku, sku, sku],
    // }

    // Recebe um dicionário de curvas por SKU

    // {
    //   "1810": "Curva A",
    //   "1811": "Curva B",
    //   "4010": "Curva C",
    // }

    // Recebe um dicionário com os valores calculados de media/mês

    // {
    //   "1810": 100
    //   "1811": 200
    //   "4010": 300
    // }

    // Retorna um dicionário contendo os valores de mínimo e máximo calculados por SKU

    // {
    //   "1810": {
    //     min: 100,
    //     max: 200
    //   },
    //   "4010": {
    //     min: 5,
    //     max: 50
    //   }
    // }

    let valoresMinMax = {};

    for (const categoria in categoriasOrdenadas) {
      categoriasOrdenadas[categoria].forEach((idsku) => {
        const curva = curvas[idsku];
        const media = mediaMes[idsku].media;

        let min = 0;
        let max = 0;

        if (categoria === "Ferramentas") {
          min = Math.ceil(media / 4);

          const fatoresMax = {
            "Curva A": 1,
            "Curva B": 2,
            "Curva C": 3,
          };

          const fatorMax = fatoresMax[curva];

          if (fatorMax) {
            max = Math.round(media * fatorMax);
          }
        } else {
          min = Math.round(media) || 1;

          const fatoresMax = {
            "Curva A": 3,
            "Curva B": 5,
            "Curva C": 6,
          };

          const fatorMax = fatoresMax[curva];

          if (fatorMax) {
            max = Math.round(media * fatorMax);
          }
        }

        valoresMinMax[idsku] = {
          min,
          max,
        };
      });
    }

    return valoresMinMax;
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
    const relacionamentosFiltrados = this.filtrarDestoantes(relacionamentos, cortesDestoantes);

    console.log(filename, "Quantidade de registros após filtro destoante:", relacionamentosFiltrados.length);

    // Gerar Contadores
    const contadores = this.gerarContadores(relacionamentosFiltrados);

    // Gerar a Média Mês
    const mediaMes = this.calcularMediaMes(relacionamentosFiltrados);

    // Calcular o valor acumulado considerado como destoantes
    // Para cálculo dos destoantes acumulados, utilizar os relacionamentos sem filtros de destoantes
    const destoantesAcumulados = this.calcularDestoantesAcumulados(relacionamentos, cortesDestoantes);

    // Criar listas separadas por categoria
    const categorias = this.separarPorCategoria(relacionamentosFiltrados);

    // Ordenar os resultados com base no contador
    const categoriasOrdenadas = this.ordernarPorContador(categorias);

    const curvas = this.calcularCurvas(categoriasOrdenadas);

    const valoresMinMax = this.calcularMinMax(categoriasOrdenadas, curvas, mediaMes);

    // Debug
    const tamanhoContadores = Object.keys(contadores).length;
    const tamanhoMediaMes = Object.keys(mediaMes).length;
    const tamanhoCurvas = Object.keys(curvas).length;
    const tamanhoMinMax = Object.keys(valoresMinMax).length;

    console.log({ tamanhoContadores, tamanhoMediaMes, tamanhoCurvas, tamanhoMinMax });

    let resultadoFinal = {};

    console.log("Ordenado");
    categoriasOrdenadas["Motores"].forEach((sku) => console.log(sku));

    console.log("Iniciando Loop");
    // Acrescentar dados calculados na lista de resultados
    for (const categoria in categoriasOrdenadas) {
      resultadoFinal[categoria] = [];

      const categoriaAtual = [];

      categoriasOrdenadas[categoria].forEach((sku) => {
        if (categoria === "Motores") {
          console.log(sku);
        }

        const registro = categorias[categoria][sku];

        let contador = 0;
        let media = 0;
        let destoante = 0;
        let min = 0;
        let max = 0;
        let curva = "Sem Curva";

        if (Object.prototype.hasOwnProperty.call(contadores, sku)) {
          contador = contadores[sku];
        }

        if (Object.prototype.hasOwnProperty.call(mediaMes, sku)) {
          media = mediaMes[sku].media;
        }

        if (Object.prototype.hasOwnProperty.call(destoantesAcumulados, sku)) {
          destoante = destoantesAcumulados[sku];
        }

        if (Object.prototype.hasOwnProperty.call(valoresMinMax, sku)) {
          min = valoresMinMax[sku].min;
          max = valoresMinMax[sku].max;
        }

        if (Object.prototype.hasOwnProperty.call(curvas, sku)) {
          curva = curvas[sku];
        }

        categoriaAtual.push({
          ...registro,
          contador,
          mediaMes: media,
          destoante,
          min,
          max,
          curva,
        });
      });

      resultadoFinal[categoria] = categoriaAtual;
    }

    console.log(resultadoFinal["Motores"]);

    console.log(filename, "Tempo gasto no processamento em memória:", elapsedTime(memoryStart));

    return ok({
      message: "Alive",
    });
  },
};
