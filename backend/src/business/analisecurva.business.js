const { models } = require("../modules/sequelize");
const { ok, failure } = require("../modules/http");
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

      // Adquirir a menor data de venda
      const menorData = datas.reduce(function (a, b) {
        return a < b ? a : b;
      });

      // Considerar como maior data de venda a data atual
      const maiorData = new Date().toLocaleDateString("en-US");

      // Calcular a diferença de meses entre a maior e menor data
      const mesesVendidos = monthDiff(new Date(menorData + "T00:00:00"), new Date(maiorData));

      // Calcular a média mês
      const media = Math.round(Number(somatoriaQuantidades / mesesVendidos).toFixed(2));

      // Debug
      // if (idsku == 7779) {
      //   console.log({ datas, quantidades, menorData, maiorData, mesesVendidos, media });
      // }

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

  gerarContadores(relacionamentosFiltrados) {
    // Adquirir os fatores de cálculo de curva para cada categoria

    // Core Config?
    const dicionarioFatores = {
      Acessórios: "quantidadeVendida",
      Componentes: "numeroPedidos",
      Ferramentas: "faturamento",
      Motores: "quantidadeVendida",
      Maker: "faturamento",
    };

    // Recebe como parâmetro os relacionamentos após execução do filtro de destoantes

    // Para cada registro de relacionamento, é adquirido o fator de cálculo de curva desse produto
    // O contador é calculado conforme o fator da categoria e inserido no dicionario

    // Retorna um dicionário contendo os contadores por SKU
    // {
    //   "1810": 100,
    //   "1811": 1564.96
    // }

    const contadores = {};

    relacionamentosFiltrados.forEach((rel) => {
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

  ordernarPorContador(categorias, contadores) {
    // Recebe como parâmetros uma lista de produtos separados por categorias

    // {
    //   "Motores": {
    //     "idsku": {
    //       ...
    //     },
    //     "idsku": {
    //       ...
    //     }
    //   },
    //   "Maker": {
    //    ...
    //   }
    // }

    // Recebe também um dicionário com os contadores calculados para cada SKU

    // {
    //   "idsku": 123,
    //   "idsku": 987
    // }

    // Retorna um dicionário de listas, ordenados e separados por categoria

    // {
    //   "Motores": [idsku, idsku, idsku, ...],
    //   "Maker": [idsku, idsku, idsku, ...]
    // }

    let chavesOrdenadas = {};

    for (const categoria in categorias) {
      const keys = Object.keys(categorias[categoria]);

      keys.sort((a, b) => contadores[b] - contadores[a]);

      chavesOrdenadas[categoria] = keys;
    }

    return chavesOrdenadas;
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
      "Curva B": 35,
      "Curva C": 45,
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

        let min, max;

        if (categoria === "Ferramentas") {
          min = Math.ceil(media / 4) || 1;

          const fatoresMax = {
            "Curva A": 1,
            "Curva B": 2,
            "Curva C": 3,
          };

          const fatorMax = fatoresMax[curva];

          if (fatorMax) {
            max = Math.round(media * fatorMax) || 1;
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
            max = Math.round(media * fatorMax) || 1;
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

  async produtosSemVenda(relacionamentos) {
    // Recebe a lista de relacionamentos (sem filtro de destoantes)
    // Cria um Set com a lista de SKU's que contenham registros

    // É realizada uma query no banco para adquirir todos os produtos que não estejam nessa lista
    // Filtrar produtos por SKU numérico que estejam ativos

    const produtosComVenda = new Set(relacionamentos.map((rel) => rel.idsku));

    const produtosSemVenda = await models.tbproduto.findAll({
      attributes: ["idsku", "nome"],
      include: {
        model: models.tbcategoria,
        required: true,
        attributes: ["nome"],
      },
      where: {
        situacao: 1,
        idsku: {
          [Op.regexp]: "^[0-9]+$",
          [Op.notIn]: Array.from(produtosComVenda),
        },
      },
      raw: true,
      nest: true,
    });

    // Retorna uma lista de objetos com as informações básicas dos produtos

    // [
    //   {
    //     idsku,
    //     nome,
    //     cagetoria
    //   },
    //   {
    //     idsku,
    //     nome,
    //     categoria
    //   }
    // ]

    const resultado = produtosSemVenda.map((produto) => {
      return {
        idsku: produto.idsku,
        nome: produto.nome,
        categoria: produto.tbcategorium.nome,
      };
    });

    return resultado;
  },

  async exportarBinx(resultadoFinal) {
    const idCurvas = {
      "Sem Curva": 1,
      "Curva A": 2,
      "Curva B": 3,
      "Curva C": 4,
    };

    const pacoteProduto = [];
    const pacoteProdutoEstoque = [];

    resultadoFinal.forEach((produto) => {
      pacoteProduto.push({
        idsku: produto.idsku,
        curva: produto.curva,
        idcurva: idCurvas[produto.curva],
      });

      pacoteProdutoEstoque.push({
        idestoque: 7141524213,
        idsku: produto.idsku,
        minimo: produto.min,
        maximo: produto.max,
        mediames: produto.mediaMes,
      });
    });

    // Realizar alterações no banco de dados
    try {
      await models.tbproduto.bulkCreate(pacoteProduto, {
        updateOnDuplicate: ["curva", "idcurva"],
      });

      await models.tbprodutoestoque.bulkCreate(pacoteProdutoEstoque, {
        updateOnDuplicate: ["maximo", "minimo", "mediames"],
      });
    } catch (error) {
      console.log(filename, "Erro ao exportar análise de curva:", error.message);
    }
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
    const categoriasOrdenadas = this.ordernarPorContador(categorias, contadores);

    // Calcular a curva de cada um dos prdutos, agora com a lista ordenada
    const curvas = this.calcularCurvas(categoriasOrdenadas);

    // Calcular os valores de mínimo e máximo para cada produto, com base mas curvas e na média/mês
    const valoresMinMax = this.calcularMinMax(categoriasOrdenadas, curvas, mediaMes);

    // Gerar um objeto com o resultado final
    let resultadoFinal = [];

    // Acrescentar dados calculados na lista de resultados
    for (const categoria in categoriasOrdenadas) {
      categoriasOrdenadas[categoria].forEach((sku) => {
        // A lista de produtos separados por categoria contém as informações básicas do produto
        // Incluem: nome, idsku e categoria, vamos complementar com as informações calculadas
        const registro = categorias[categoria][sku];

        let contador = 0;
        let media = 0;
        let destoantes = 0;
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
          destoantes = destoantesAcumulados[sku];
        }

        if (Object.prototype.hasOwnProperty.call(valoresMinMax, sku)) {
          min = valoresMinMax[sku].min;
          max = valoresMinMax[sku].max;
        }

        if (Object.prototype.hasOwnProperty.call(curvas, sku)) {
          curva = curvas[sku];
        }

        resultadoFinal.push({
          ...registro,
          contador,
          mediaMes: media,
          destoantes,
          min,
          max,
          curva,
        });
      });
    }

    // Após realizar todas as etapas de cálculo, acrescentar os itens sem venda
    const produtosSemVenda = await this.produtosSemVenda(relacionamentos);

    produtosSemVenda.forEach((produto) => {
      resultadoFinal.push({
        ...produto,
        contador: 0,
        mediaMes: 0,
        destoantes: 0,
        min: 0,
        max: 0,
        curva: "Sem Curva",
      });
    });

    console.log(filename, "Tempo gasto no processamento em memória:", elapsedTime(memoryStart));

    return ok({
      curvas: [...resultadoFinal],
    });
  },

  async exportarAnalise() {
    const resultadoAnalise = await this.analiseCurva();

    if (resultadoAnalise.statusCode === 200) {
      const resultadoFinal = resultadoAnalise.body.curvas;

      await this.exportarBinx(resultadoFinal);

      console.log(filename, "Exportação da análise de curva finalizada.");

      return ok({
        message: "Exportação da análise de curva finalizada.",
      });
    }

    return failure({
      message: "Não foi possível exportar a análise de curva, falha ao executar análise.",
    });
  },
};
