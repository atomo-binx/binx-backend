const { models } = require("../modules/sequelize");
const { Op } = require("sequelize");
const currency = require("currency.js");
const { ok } = require("../utils/http");
const filename = __filename.slice(__dirname.length + 1) + " -";
const { sequelize } = require("../modules/sequelize");
const dayjs = require("dayjs");
const { ordenaPorChave } = require("../utils/sort");

module.exports = {
  async query() {
    const results = await models.tbproduto.findAll({
      attributes: ["idsku", "nome", "curva", "ultimocusto", "formato"],
      where: {
        situacao: true,
        idsku: {
          [Op.regexp]: "^[0-9]+$",
        },
      },
      include: [
        {
          model: models.tbprodutoestoque,
          required: true,
          attributes: ["quantidade", "maximo", "minimo"],
          where: {
            idestoque: "7141524213",
          },
        },
      ],
      raw: true,
      nest: true,
    });

    return results.map((produto) => ({
      idsku: produto.idsku,
      nome: produto.nome,
      curva: produto.curva,
      ultimocusto: produto.ultimocusto,
      formato: produto.formato,
      quantidade: produto.tbprodutoestoques.quantidade,
      minimo: produto.tbprodutoestoques.minimo,
      maximo: produto.tbprodutoestoques.maximo,
    }));
  },

  async dashboard() {
    const produtos = await this.query();

    console.log(filename, "Quantidade de produtos:", produtos.length);

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

    let montantesPorCurva = [0, 0, 0, 0];

    let dicionarioCurvas = {
      "Curva A": 0,
      "Curva B": 1,
      "Curva C": 2,
    };

    // Arrays para realizar a exportação dos itens considerados para o dash
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

      idxCurva = idxCurva === undefined || idxCurva === null ? 3 : idxCurva;

      contProdutosPorCurva[idxCurva]++;

      // Realiza acumulação do valor de montante para o produto
      if (
        produto.ultimocusto !== null &&
        produto.ultimocusto !== undefined &&
        produto.quantidade > 0 &&
        produto.formato === "Simples"
      ) {
        const atual = currency(montantesPorCurva[idxCurva], { precision: 6 });

        const adicionar = currency(produto.ultimocusto, { precision: 6 }).multiply(produto.quantidade, {
          precision: 6,
        });

        const acumulado = atual.add(adicionar).value;

        montantesPorCurva[idxCurva] = acumulado;
      }
    }

    // Calcula o montante geral
    const montanteGeral = currency(montantesPorCurva[0])
      .add(montantesPorCurva[1])
      .add(montantesPorCurva[2])
      .add(montantesPorCurva[3]).value;

    // Converter os montantes por curva para 2 casas decimais
    // Realizar as multiplicações com 6 casas decimais, e a exibição final com 2 casas decimais
    montantesPorCurva = montantesPorCurva.map((montante) => currency(montante).value);

    // Calcula porcentagens relativas dos montantes acumulados
    let pMontantesPorCurva = montantesPorCurva.map((montante) => {
      return parseFloat(((100 * montante) / montanteGeral).toFixed(1));
    });

    // Calcula disponibilidade de produtos por curva
    for (let i = 0; i < 4; i++) {
      disponibilidadePorCurva[i] = contProdutosPorCurva[i] - contIndisponiveisPorCurva[i];
    }

    // Calcula a porcentagem de disponibilidade de produtos por curva
    for (let i = 0; i < 4; i++) {
      pDisponibilidadePorCurva[i] = parseFloat(
        ((100 * disponibilidadePorCurva[i]) / contProdutosPorCurva[i]).toFixed(1)
      );
    }

    // Calcula Porcentagem de produtos disponíveis:
    let porcentagemDisponiveis = parseFloat(
      ((100 * contProdutosDisponiveis) / contProdutosAtivos).toFixed(1)
    );

    // Calcula Porcentagem de produtos indisponíveis
    let porcentagemIndisponiveis = parseFloat(
      ((100 * contProdutosIndisponiveis) / contProdutosAtivos).toFixed(1)
    );

    // Calcula Porcentagem de produtos abaixo do estoque minimo
    let porcentagemAbaixoMin = parseFloat(((100 * contAbaixoMin) / contProdutosAtivos).toFixed(1));

    // Calcula Porcentagem de produtos indisponiveis por curva
    let porcentagemIndisponiveisCurva = [0, 0, 0, 0];

    // Calcula porcentagem de Indisponibilidade por Curva em relação aos items indisponiveis
    for (let i = 0; i < 4; i++) {
      porcentagemIndisponiveisCurva[i] = parseFloat(
        ((100 * contIndisponiveisPorCurva[i]) / contProdutosIndisponiveis).toFixed(1)
      );
    }

    console.log(filename, "Produtos ativos:", contProdutosAtivos);
    console.log(filename, "Produtos disponíveis:", contProdutosDisponiveis);
    console.log(filename, "Produtos indisponíveis:", contProdutosIndisponiveis);
    console.log(filename, "Produtos abaixo do mínimo:", contAbaixoMin);
    console.log(filename, "Porcentagem de produtos disponíveis:", porcentagemDisponiveis, "%");
    console.log(filename, "Porcentagem de produtos indisponíveis:", porcentagemIndisponiveis, "%");
    console.log(filename, "Porcentagem de produtos abaixo do minimo:", porcentagemAbaixoMin, "%");
    console.log(filename, "Indisponibilidade por curva:", contIndisponiveisPorCurva);
    console.log(filename, "Porcentagem de indisponibilidade por curva:", porcentagemIndisponiveisCurva);
    console.log(filename, "Contagem de produtos por curva:", contProdutosPorCurva);
    console.log(filename, "Disponibilidade por Curva:", disponibilidadePorCurva);
    console.log(filename, "Porcentagem de Disponibilidade por Curva:", pDisponibilidadePorCurva);
    console.log(filename, "Quantidade de itens abaixo do mínimo por curva:", contAbaixoMinPorCurva);
    console.log(filename, "Montantes por Curva:", montantesPorCurva);
    console.log(filename, "Montante Geral:", montanteGeral);
    console.log(filename, "Porcentagem relativa dos montantes por curva:", pMontantesPorCurva);

    // Adquire os últimos valores de disponibilidade de produtos para montar o gráfico de histórico
    let ultimasDisponibilidades = await models.tbdisponibilidade.findAll({
      attributes: ["data", "valor"],
      limit: 14,
      order: [["data", "desc"]],
      raw: true,
    });

    // Adquire os últimos valores de disponibilidades por curva, para o gráfico de histórico
    let ultimasDisponibilidadesCurva = await models.tbdisponibilidadecurva.findAll({
      attributes: ["data", "curva_1", "curva_2", "curva_3", "curva_4"],
      limit: 10,
      order: [["data", "desc"]],
      raw: true,
    });

    // Adquire os últimos valores de montantes
    const historicoMontantes = await models.tbhistoricomontante.findAll({
      attributes: [
        "data",
        "montante_geral",
        "montante_curva_a",
        "montante_curva_b",
        "montante_curva_c",
        "montante_sem_curva",
        "montante_relativo_curva_a",
        "montante_relativo_curva_b",
        "montante_relativo_curva_c",
        "montante_relativo_sem_curva",
      ],
      raw: true,
      limit: 49,
      order: [["data", "desc"]],
    });

    const historicoMontantesFiltrados = historicoMontantes.filter((registro, idx) => {
      return !(idx % 7);
    });

    console.log(historicoMontantesFiltrados);

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
      produtosPorCurva: contProdutosPorCurva,
      montantesPorCurva,
      montanteGeral,
      pMontantesPorCurva,
      historicoMontantes: historicoMontantesFiltrados,
    };

    // Retorna resposta para chamada da API
    return ok({
      ...resposta,
    });
  },

  async dashboardDisponibilidade(dataInicio, dataFinal) {
    dataInicio = dayjs(dataInicio, "DD/MM/YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
    dataFinal = dayjs(dataFinal, "DD/MM/YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

    const disponibilidadeGeral = await models.tbdisponibilidade.findAll({
      attributes: ["data", "valor"],
      where: {
        data: {
          [Op.between]: [dataInicio, dataFinal],
        },
      },
    });

    const disponibilidadeCurvas = await models.tbdisponibilidadecurva.findAll({
      attributes: ["data", "curva_1", "curva_2", "curva_3", "curva_4"],
      where: {
        data: {
          [Op.between]: [dataInicio, dataFinal],
        },
      },
    });

    // Dicionário de registros completo para unificar os resultados por curva e gerais
    const disponibilidades = {};

    // Insere a disponibilidade geral no dicionário completo, a chave é a data do registro
    disponibilidadeGeral.forEach((registro) => {
      const dataFormatada = dayjs(registro.data).format("DD/MM/YYYY");
      const registros = disponibilidades[dataFormatada] || {};
      registros["geral"] = registro.valor;
      disponibilidades[dataFormatada] = registros;
    });

    // Insere as disponibilidades por curva no dicionário completo, a chave é a data do registro
    disponibilidadeCurvas.forEach((registro) => {
      const dataFormatada = dayjs(registro.data).format("DD/MM/YYYY");
      const registros = disponibilidades[dataFormatada] || {};
      registros["curva_1"] = registro["curva_1"];
      registros["curva_2"] = registro["curva_2"];
      registros["curva_3"] = registro["curva_3"];
      registros["curva_4"] = registro["curva_4"];
      disponibilidades[dataFormatada] = registros;
    });

    // Transformar o dicionário completo em uma array
    const disponibilidadesDesordenadas = [];

    for (const data in disponibilidades) {
      disponibilidadesDesordenadas.push({
        data: data,
        ...disponibilidades[data],
      });
    }

    const disponibilidadesOrdenadas = ordenaPorChave(disponibilidadesDesordenadas, "curva");

    return ok({
      dataInicio,
      dataFinal,
      quantidadeRegistros: Object.keys(disponibilidades).length,
      disponibilidades: disponibilidadesOrdenadas,
    });
  },

  async salvarDashboard() {
    let resposta = await this.dashboard();

    await sequelize.transaction(async (t) => {
      // Desestruturar dados que serão salvos
      const { pdisponivel, pDisponivelPorCurva, montanteGeral, pMontantesPorCurva, montantesPorCurva } =
        resposta.body;

      // Salvar Histórico de Disponibilidade
      console.log(filename, "Salvar Dashboard - Disponibilidade:", pdisponivel);

      await models.tbdisponibilidade.create(
        {
          data: new Date(),
          valor: pdisponivel,
          transaction: t,
        },
        {
          transaction: t,
        }
      );

      // Salvar Histórico de Disponibilidade por Curvas
      console.log(filename, "Salvar Dashboard - Disponibilidade por Curvas:", pDisponivelPorCurva);

      await models.tbdisponibilidadecurva.create(
        {
          data: new Date(),
          curva_1: pDisponivelPorCurva[0],
          curva_2: pDisponivelPorCurva[1],
          curva_3: pDisponivelPorCurva[2],
          curva_4: pDisponivelPorCurva[3],
        },
        {
          transaction: t,
        }
      );

      // Salvar Histórico de Montantes
      console.log(filename, "Salvar Dashboard - Montante Geral:", montanteGeral);
      console.log(filename, "Salvar Dashboard - Montantes por Curva:", montantesPorCurva);
      console.log(filename, "Salvar Dashboard - Montantes Relativos:", pMontantesPorCurva);

      await models.tbhistoricomontante.create(
        {
          montante_geral: montanteGeral,
          montante_curva_a: montantesPorCurva[0],
          montante_curva_b: montantesPorCurva[1],
          montante_curva_c: montantesPorCurva[2],
          montante_sem_curva: montantesPorCurva[3],
          montante_relativo_curva_a: pMontantesPorCurva[0],
          montante_relativo_curva_b: pMontantesPorCurva[1],
          montante_relativo_curva_c: pMontantesPorCurva[2],
          montante_relativo_sem_curva: pMontantesPorCurva[3],
          data: new Date(),
        },
        {
          transaction: t,
        }
      );
    });

    return ok({
      message: "Dashboard de compras salvo com successo.",
    });
  },
};
