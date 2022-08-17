const moment = require("moment");
const ExcelJS = require("exceljs");
const fs = require("fs");

const Produto = require("../models/produto.model");
const ProdutoDeposito = require("../models/produtoDeposito.model");

const { Op } = require("sequelize");
const ss = require("simple-statistics");

const { models } = require("../modules/sequelize");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  // Monta dicionários que serão úteis para o decorrer da rotina
  async dicionarios() {
    let categorias = await models.tbcategoria.findAll();

    // Cria dicionário de idcategoria - tipo de curva
    let tipoCurvaCategoria = {};
    for (const categoria of categorias) {
      tipoCurvaCategoria[categoria.idcategoria] = categoria.tipocurva;
    }

    // Cria dicionário de idcategoria - nome da categoria
    let nomeCategoria = {};
    for (const categoria of categorias) {
      nomeCategoria[categoria.idcategoria] = categoria.nome;
    }

    return { tipoCurvaCategoria, nomeCategoria };
  },

  // Query que busca massa de dados de pedidos de vendas
  async queryVendas() {
    console.log(filename, "Iniciando query de pedidos de venda");
    let queryStart = new Date();

    const resposta = await models.tbpedidovenda.findAll({
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
            },
          ],
        },
      ],
      where: {
        idstatusvenda: {
          [Op.not]: "12",
        },
        datavenda: {
          [Op.gt]: moment().subtract(1, "year"),
        },
      },
      raw: true,
      nest: true,
    });

    let queryEnd = new Date();
    let queryElapsed = new Date(queryEnd - queryStart).toISOString().slice(11, -1);
    console.log(filename, "Tempo gasto na query: ", queryElapsed);

    console.log(filename, "Quantidade de pedidos contabilizados:", resposta.length);

    return resposta;
  },

  // Recebe uma massa de dados bruta e monta linhas de venda para serem tratadas
  async montaVendaProduto(vendas) {
    let itens = vendas.map((venda) => {
      return {
        idpedidovenda: venda.idpedidovenda,
        idstatusvenda: venda.idstatusvenda,
        datavenda: venda.datavenda,
        idloja: venda.idloja,
        idsku: venda.tbvendaprodutos.tbproduto.idsku,
        nome: venda.tbvendaprodutos.tbproduto.nome,
        quantidade: venda.tbvendaprodutos.quantidade,
        idcategoria: venda.tbvendaprodutos.tbproduto.idcategoria,
        valorunidade: venda.tbvendaprodutos.valorunidade,
      };
    });

    console.log(filename, "Relacionamentos Venda-Produto processados: ", itens.length);

    return itens;
  },

  // Recebe a lista  itens, calcula seus contadores e define curvas
  async calculaCurvas(itens) {
    // Para realizar o cálculo de curva precisamos dos dados das categorias existentes
    // Puxamos esses dados do banco para facilitar a adaptação para possíveis nova categorias
    let { tipoCurvaCategoria, nomeCategoria } = await this.dicionarios();

    let curvas = [{}, {}, {}, {}, {}, {}];

    for (const item of itens) {
      // Verifica se o item ainda não foi contabilizado na sua devida categoria
      // Caso não tenha, vamos inseri-lo e iniciar com alguns dados padrões
      // Podemos inserir os dados básicos que são comuns para todos os produtos
      if (!curvas[item.idcategoria][item.idsku]) {
        curvas[item.idcategoria][item.idsku] = {
          idsku: item.idsku,
          nome: item.nome,
          idcategoria: item.idcategoria,
          // categoria: nomeCategoria[item.idcategoria],
          contador: 0,
        };
      }

      // Agora alteramos apenas o campo que vai mudar de acordo com as categorias
      switch (tipoCurvaCategoria[item.idcategoria]) {
        // Cálculo por Quantidade Total Vendida
        case "Q":
          curvas[item.idcategoria][item.idsku].contador += item.quantidade;
          break;

        // Cálculo por Vezes que apareceu em pedidos
        case "V":
          curvas[item.idcategoria][item.idsku].contador++;
          break;

        // Cálculo por valor de Faturamento
        case "F":
          curvas[item.idcategoria][item.idsku].contador += item.quantidade * item.valorunidade;

          break;
      }
    }

    // Realiza ajuste no valor de faturamento para 2 casas decimais
    // Percore apenas os itens da categoria de ferramentas (índice 3) e maker (índice )
    for (const sku in curvas[3]) {
      curvas[3][sku]["contador"] = parseFloat(parseFloat(curvas[3][sku]["contador"]).toFixed(2));
    }
    for (const sku in curvas[5]) {
      curvas[5][sku]["contador"] = parseFloat(parseFloat(curvas[5][sku]["contador"]).toFixed(2));
    }

    console.log(filename, "Filtro por categoria finalizado");

    console.log(filename, "Registros por Categoria:");
    for (let i = 0; i < curvas.length; i++) {
      console.log(filename, nomeCategoria[i], "-", Object.keys(curvas[i]).length);
    }

    // Desestrutura itens de dentro da array de resultados para permitir a ordenação

    let curvasOrdenadas = [[], [], [], [], [], []];

    for (let i = 0; i < curvas.length; i++) {
      for (let sku in curvas[i]) {
        curvasOrdenadas[i].push(curvas[i][sku]);
      }
    }

    // Ordena os resultados
    for (let i = 0; i < curvas.length; i++) {
      curvasOrdenadas[i] = curvasOrdenadas[i].sort((a, b) => {
        if (a.contador > b.contador) return -1;
        if (a.contador < b.contador) return 1;
        return 0;
      });
    }

    // Define curvas
    for (let i = 0; i < curvasOrdenadas.length; i++) {
      let total = curvasOrdenadas[i].length;
      let tgt20 = Math.round((20 * total) / 100);
      let tgt35 = Math.round((35 * total) / 100);

      // De índice 0      até tgt20     -> Curva A
      // De índice tgt20  até tgt35     -> Curva B
      // De índice tgt35  até final     -> Curva C

      for (let tgt = 0; tgt < tgt20; tgt++) {
        curvasOrdenadas[i][tgt]["curva"] = "Curva A";
      }
      for (let tgt = tgt20; tgt < tgt35 + tgt20; tgt++) {
        curvasOrdenadas[i][tgt]["curva"] = "Curva B";
      }
      for (let tgt = tgt20 + tgt35; tgt < total; tgt++) {
        curvasOrdenadas[i][tgt]["curva"] = "Curva C";
      }
    }

    return curvasOrdenadas;
  },

  monthDiff(dateFrom, dateTo) {
    return dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear());
  },

  // Cálcula valores médios de venda por mês
  async mediaMes(curvas, itens) {
    let qntdItem = [{}, {}, {}, {}, {}, {}]; // Quantidades x Item + id da loja
    let qntdItemSemLoja = [{}, {}, {}, {}, {}, {}]; // Quantidades x Item sem id da loja
    let datasDeVenda = [{}, {}, {}, {}, {}, {}];

    // Monta array com quantidades vedidas e array com datas de vendas
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];

      // Verifica se o item foi contabilizado na sua devida categoria
      // Caso não tenha, vamos inseri-lo e iniciar com um valor padrão
      // A lista vazia é padrão para todos os tipos de produtos
      if (!qntdItem[item.idcategoria][item.idsku]) {
        qntdItem[item.idcategoria][item.idsku] = [];
        qntdItemSemLoja[item.idcategoria][item.idsku] = [];
      }

      // Push na lista que contém o id da loja
      qntdItem[item.idcategoria][item.idsku].push([item.quantidade, item.idloja]);

      // Push na lista que contém apenas a quantidade vendida
      qntdItemSemLoja[item.idcategoria][item.idsku].push(item.quantidade);

      // Realizamos também nesse loop a criação da array de datas de vendas

      if (!datasDeVenda[item.idcategoria][item.idsku]) {
        datasDeVenda[item.idcategoria][item.idsku] = [];
      }

      // Se o produto já tiver um registro contabilizado na sua devida categoria,
      // Vamos adicionar a quantidade vendida desse item na array de quantidades
      let parsedDate = new Date(item.datavenda);

      datasDeVenda[item.idcategoria][item.idsku].push(parsedDate);
    }

    // Calcula Min Max para cada um dos produtos
    for (let idxCategoria = 0; idxCategoria < curvas.length; idxCategoria++) {
      for (let idxItem = 0; idxItem < curvas[idxCategoria].length; idxItem++) {
        let item = curvas[idxCategoria][idxItem];

        // Monta arrays com as vendas do item especificado
        let dados = qntdItem[idxCategoria][item.idsku];
        let dadosSemLoja = qntdItemSemLoja[idxCategoria][item.idsku];

        let totalVendido = ss.sum(dadosSemLoja);
        let moda = ss.mode(dadosSemLoja);
        let desvioPadrao = ss.standardDeviation(dadosSemLoja).toFixed(2);

        // Vendas destoantes - Geral
        let destoantes = dados.filter((venda) => venda[0] >= desvioPadrao && venda[1] != 203398134);
        let destoantesSemLoja = [];
        for (let i = 0; i < destoantes.length; i++) {
          destoantesSemLoja.push(destoantes[i][0]);
        }
        // Vendas destoantes - Corporativo
        let destoantesCorporativos = dados.filter(
          (venda) => venda[0] >= desvioPadrao && venda[1] == 203398134
        );
        let destoantesCorporativosSemLoja = [];
        for (let i = 0; i < destoantesCorporativos.length; i++) {
          destoantesCorporativosSemLoja.push(destoantesCorporativos[i][0]);
        }
        // Soma do total de destoantes a serem considerados (apenas corporativos)
        let totalDestoantes = ss.sum(destoantesCorporativosSemLoja);

        // Filtro final para remover vendas destoantes das vendas a considerar
        dados = dados.filter((venda) => !(venda[0] >= desvioPadrao && venda[1] == 203398134));

        // Monta array de dados a serem considerados após realizado o filtro
        dadosSemLoja = [];
        for (let i = 0; i < dados.length; i++) {
          dadosSemLoja.push(dados[i][0]);
        }

        // Soma final de quantidades vendidas após filtro
        let totalFiltrada = ss.sum(dadosSemLoja);

        // Verficação da primeira data de venda
        let datas = datasDeVenda[idxCategoria][item.idsku];

        var primeiraData = new Date(Math.min.apply(null, datas));

        let mesesVendidos = this.monthDiff(primeiraData, new Date());
        mesesVendidos = mesesVendidos == 0 ? 1 : mesesVendidos;

        let mediaMes = Math.round(totalFiltrada / mesesVendidos);
        mediaMes = mediaMes == 0 ? 1 : mediaMes;

        let minimo = 0;
        let maximo = 0;

        // Debug
        if (false) {
          console.log("Total vendido no período:", totalVendido);
          console.log("Moda: ", moda);
          console.log("Desvio padrão: ", desvioPadrao);
          console.log("Quantidades destoantes: - Geral\n", destoantesSemLoja);
          console.log("Quantidades destoantes - Corporativo:\n", destoantesCorporativosSemLoja);
          console.log("Soma do total de quantidades descartadas: ", totalDestoantes);
          console.log("Soma do total de quantidades filtradas: ", totalFiltrada);
          console.log("Primeira data de venda (YYYY-MM-DD): ", primeiraData.toISOString().split("T")[0]);
          console.log("Quantidade de meses vendidos: ", mesesVendidos);
          console.log("Média de venda/mês: ", mediaMes);
          console.log("Mínimo: ", minimo);
          console.log("Máximos: ", maximo);
        }

        curvas[idxCategoria][idxItem]["total"] = totalVendido;
        curvas[idxCategoria][idxItem]["destoantes"] = totalDestoantes;
        curvas[idxCategoria][idxItem]["considerar"] = totalFiltrada;
        curvas[idxCategoria][idxItem]["meses"] = mesesVendidos;
        curvas[idxCategoria][idxItem]["mediames"] = mediaMes;
        curvas[idxCategoria][idxItem]["minimo"] = minimo;
        curvas[idxCategoria][idxItem]["maximo"] = maximo;
      }
    }

    return curvas;
  },

  // Calcula informação de máximo e mínimo a partir do último dado de média/mês acrescentado
  async minMax(mediaMes) {
    for (let idxCategoria = 0; idxCategoria < mediaMes.length; idxCategoria++) {
      for (let idxItem = 0; idxItem < mediaMes[idxCategoria].length; idxItem++) {
        let item = mediaMes[idxCategoria][idxItem];

        // Calcular valor máximo de acordo com as regras estabelecidas
        if (idxCategoria != 0 && idxCategoria != 3) {
          // Para todos os itens vamos considerar o valor mínimo como de 1 mês
          item["minimo"] = item["mediames"];

          // Casos Gerais, todas as categorias menos Ferramentas
          switch (item["curva"]) {
            case "Curva A":
              item["maximo"] = item["mediames"] * 3;
              break;
            case "Curva B":
              item["maximo"] = item["mediames"] * 5;
              break;
            case "Curva C":
              item["maximo"] = item["mediames"] * 6;
              break;
            default:
              break;
          }
        } else {
          // Casos para categoria de Ferramentas

          // Para ferramentas consideramos o valor mínimo e máximo em semanas
          // Considerando o valor mínimo como de uma semana apenas
          item["minimo"] = Math.ceil(item["mediames"] / 4);

          // Calcular valores máximos em meses, porém com regras diferentes
          switch (item["curva"]) {
            case "Curva A":
              item["maximo"] = item["mediames"] * 1;
              break;
            case "Curva B":
              item["maximo"] = item["mediames"] * 2;
              break;
            case "Curva C":
              item["maximo"] = item["mediames"] * 3;
              break;
            default:
              break;
          }
        }
      }
    }

    return mediaMes;
  },

  // Converte o objeto com a resposta final para um formato adequado para leitura no Frontend
  async gerarRespostaAPI(exportar) {
    // Montar um arquivo mais simples de ser lido pelo frontend
    // Pela praticidade da análise, as categorias estão em uma array
    // Cada índice é uma categoria, vamos separa-los em objetos nomeáveis
    const resposta = {
      semCategoria: exportar[0],
      acessorios: exportar[1],
      componentes: exportar[2],
      ferramentas: exportar[3],
      motores: exportar[4],
      maker: exportar[5],
      semVenda: exportar[6],
    };

    return resposta;
  },

  // Salva as curvas calculadas no banco de dados
  async salvarCurvas(exportar) {
    let produtos = [];
    let produtosDepositos = [];

    const idCurvas = {
      "Sem Curva": 1,
      "Curva A": 2,
      "Curva B": 3,
      "Curva C": 4,
    };

    // Percorre cada um dos itens a serem exportados
    for (let idxCategoria = 0; idxCategoria < exportar.length; idxCategoria++) {
      for (let idxItem = 0; idxItem < exportar[idxCategoria].length; idxItem++) {
        let item = exportar[idxCategoria][idxItem];

        // Monta pacote com a curva do Produto
        let produto = {
          idsku: item.idsku,
          curva: item.curva,
          idcurva: idCurvas[item.curva],
        };

        // Monta pacote com os valores de máximo e mínimo do produto
        let produtoDeposito = {
          idestoque: 7141524213,
          idsku: item.idsku,
          minimo: item.minimo,
          maximo: item.maximo,
          mediames: item.mediames,
        };

        // Insere pacotes montados nas listas de exportação
        produtos.push(produto);
        produtosDepositos.push(produtoDeposito);
      }
    }

    // Salva valores de Curvas no banco de dados
    try {
      await Produto.bulkCreate(produtos, {
        updateOnDuplicate: ["curva", "idcurva"],
      });
      console.log(filename, "Curvas dos produtos atualizadas no banco de dados");
    } catch (error) {
      console.log(filename, "Não foi possível atualizar as curvas no banco de dados:", error.message);
    }

    // Salva valores de Máximo e Mínimo no banco de dados
    try {
      await ProdutoDeposito.bulkCreate(produtosDepositos, {
        updateOnDuplicate: ["maximo", "minimo", "mediames"],
      });
      console.log(filename, "Valores de Máximo e Mínimo atualizados no banco de dados");
    } catch (error) {
      console.log(
        filename,
        "Não foi possível atualizar os valores de máximo e mínimo no banco de dados:",
        error.message
      );
    }
  },

  // Identifica quais foram os produtos que não tiveram venda registrada no período
  async semVenda(itens) {
    // Monta um novo Set com todos os SKUS que tiveram venda registrada no período analisado
    const skusComVenda = itens.map((item) => item.idsku);

    const setSkusComVenda = new Set(skusComVenda);

    // Realiza uma query no banco para obter todos os produtos ativos
    let querySkusAtivos = await Produto.findAll({
      attributes: ["idsku", "nome"],
      where: {
        situacao: 1,
        idsku: {
          [Op.regexp]: "^[0-9]+$",
        },
      },
      raw: true,
    });

    // Monta uma array separada apenas com os SKUS, separar os nomes nessa etapa
    // Os nomes registrados nas vendas podem ter nomes diferentes dos registrados nos produtos
    // Assim, os Sets estariam sempre diferente, causando divergências, vamos uni-los novamente depois

    const skusAtivos = querySkusAtivos.map((item) => item.idsku);

    // Transforma o resultado dos SKUS ativos em um Set
    const setSkusAtivos = new Set(skusAtivos);

    // Realiza operação de diferença entre os dois Sets - Consultar documentação:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

    const difference = (setA, setB) => {
      let _difference = new Set(setA);
      for (let elem of setB) {
        _difference.delete(elem);
      }
      return _difference;
    };

    const skusSemVenda = difference(setSkusAtivos, setSkusComVenda);

    // @Debug
    // console.log([...skusSemVenda]);
    // console.log(skusSemVenda.size);

    // Agora que temos os SKU's que não possuem venda, podemos uni-los novamente com seu nome de produto

    // Gerar um dicionário relacionando SKU e seu respectivo Nome
    const nomes = {};
    for (const item of querySkusAtivos) {
      nomes[item.idsku] = item.nome;
    }

    // Cruzar os SKUS sem venda com os seus devidos nomes
    // O Spreading é utilizado para transformar um Set em Array
    const resultado = [...skusSemVenda].map((sku) => ({
      idsku: sku,
      nome: nomes[sku],
      curva: "Sem Curva",
    }));

    return resultado;
  },

  // Define valores de estatisticas que serão enviados ao Frontend
  async estatisticas(vendas, curvas) {
    // Consutrção de alguns dados estatisticos sobre a análise para retornar ao frontend

    // Registro da quantidade de pedidos utilizados na análise
    const pedidos = vendas.map((venda) => venda.idpedidovenda);
    const qntdVendas = new Set(pedidos).size;

    // Quantidade de relacionamentos venda-produto analisados
    const qntdRelVendaProduto = vendas.length;

    // Contabiliza a quantidade de produtos analisados por curva
    const qntdSemCategoria = curvas[0].length;
    const qntdAcessorios = curvas[1].length;
    const qntdComponentes = curvas[2].length;
    const qntdFerramentas = curvas[3].length;
    const qntdMotores = curvas[4].length;
    const qntdMaker = curvas[5].length;

    const estatistica = {
      qntdPedidosAnalisados: qntdVendas,
      qntdRelVendaProduto: qntdRelVendaProduto,
      qntdSemCategoria,
      qntdAcessorios,
      qntdComponentes,
      qntdFerramentas,
      qntdMotores,
      qntdMaker,
    };

    // console.log(filename, "Análise estatistica:", estatistica);

    return estatistica;
  },

  // Exporta os valores de máximo e mínimo dos produtos para o Bling
  async exportarBling() {
    console.log(filename, "Iniciando exportação de Min/Max para o Bling");
  },

  // API - Realiza análise de Estoque Máximo e Mínimo
  async minmax() {
    // Adquire massa de dados bruta na query de pedidos de vendas
    let vendas = await this.queryVendas();

    console.log(filename, "Iniciando tratamento em memória");
    let memoryStart = new Date();

    // Transforma o resultado da query de venda em uma lista de relacionamentos venda-produto
    let itens = await this.montaVendaProduto(vendas);

    // Cálculo de Curvas
    let curvas = await this.calculaCurvas(itens);

    // Acrescenta informação de média/mês
    let mediaMes = await this.mediaMes(curvas, itens);

    // Acrescenta informação de mínimo e máximo
    let exportar = await this.minMax(mediaMes);

    // Acrescenta os itens que não tiveram venda registrada no período
    let itensSemVenda = await this.semVenda(itens);

    // console.log(exportar);
    exportar.push(itensSemVenda);

    // Exporta resultados para o excel
    this.exportToExcel(exportar);

    // Debug de tempo gasto na execução do procedimento
    let memoryEnd = new Date();
    let memoryElapsed = new Date(memoryEnd - memoryStart).toISOString().slice(11, -1);
    console.log(filename, "Tempo gasto no tratamento em memória: ", memoryElapsed);

    // Exporta as curvas para o banco de dados
    // Agora esse procedimento é realizado separadamente sob demanda
    // Consultar a função especificada, em breve estre trecho será removido
    // await this.salvarCurvas(exportar);

    //@DEBUG
    // Teste com Hashsum do arquivo
    // debug.clearFile("exports/minmax.json");
    // debug.writeFile("exports/minmax.json", JSON.stringify(exportar));
    // const fileBuffer = fs.readFileSync("exports/minmax.json");
    // const hashSum = crypto.createHash("md5");
    // hashSum.update(fileBuffer);
    // const finalHash = hashSum.digest("base64");
    // console.log(filename, "Hashsum do arquivo gerado:", finalHash);

    // Gera o objeto de resposta que será enviado como resposta para a chamada da API
    // Arquivo que será utilizado para montar o frontend
    const respostaApi = await this.gerarRespostaAPI(exportar);

    respostaApi["estatistica"] = await this.estatisticas(vendas, curvas);

    return {
      status: true,
      response: respostaApi,
    };
  },

  // API - Envia arquivo Excel gerado para o frontend
  async exportarMinMax() {
    let status = false;
    let response = "";

    try {
      if (fs.existsSync("exports/minmax.xlsx")) {
        status = true;
        response = "exports/minmax.xlsx";
      }
    } catch (err) {
      console.error(filename, "Erro ao tentar acessar o arquivo de minmax em excel:", err);
    }

    return { status: status, response: response };
  },

  // API - Exportar dados para o Binx e Bling
  async exportarBinxBling(req) {
    let status = false;

    if (req.body.exportar) {
      const exportar = req.body.exportar;

      // Exporta as curvas para o banco de dados - Síncrono
      await this.salvarCurvas(exportar);

      // O procedimento de exportação para o Bling é assíncrono
      // Devemos respeitar a taxa de chamadas do Bling
      // Portanto essa etapa será executada em background
      //  this.exportarBling();

      status = true;
    }

    console.log(filename, "Procedimento finalizado");

    return {
      status: status,
      response: "Procedimento finalizado",
    };
  },

  // Exporta resultado da análise para um arquivo de formato Excel
  async exportToExcel(data) {
    // Objeto Excel para ser trabalhado
    const workbook = new ExcelJS.Workbook();

    // Nome das planilhas de cada categoria existente no parâmetro "data"
    let nomes = [
      "Sem Categoria",
      "Acessórios",
      "Componentes",
      "Ferramentas",
      "Motores",
      "Maker",
      "Sem Venda",
    ];

    // Array de planilhas que serão criadas
    let worksheets = [];

    // Cria programaticamente cada uma das planilhas
    for (let nome in nomes) {
      const sheet = workbook.addWorksheet(nomes[nome]);
      sheet.columns = [
        { header: "SKU", key: "idsku", width: 6 },
        { header: "Nome", key: "name", width: 32 },
        { header: "Contador", key: "contador" },
        { header: "Curva", key: "curva" },
        { header: "Total Vendido", key: "totalvendido" },
        { header: "Destoantes", key: "destoantes" },
        { header: "Considerar", key: "considerar" },
        { header: "Meses", key: "meses" },
        { header: "Media/Mês", key: "mediames" },
        { header: "Mínimo", key: "minimo" },
        { header: "Máximo", key: "maximo" },
      ];

      worksheets.push(sheet);
    }

    // Percorre cada categoria de dados ordenados preenchendo sua determinada planilha
    for (let i = 0; i < worksheets.length; i++) {
      for (let itemIdx = 0; itemIdx < data[i].length; itemIdx++) {
        let item = data[i][itemIdx];

        worksheets[i].addRow([
          item.idsku,
          item.nome,
          item.contador,
          item.curva,
          item.total,
          item.destoantes,
          item.considerar,
          item.meses,
          item.mediames,
          item.minimo,
          item.maximo,
        ]);
      }
    }

    // Escreve arquivo final
    await workbook.xlsx
      .writeFile("./exports/minmax.xlsx")
      .then(() => console.log("Arquivo excel exportado com sucesso"))
      .catch((error) => console.log("Erro ao exportar arquivo excel: ", error.message));
  },
};
