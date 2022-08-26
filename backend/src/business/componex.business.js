const { ok, failure } = require("../modules/http");
const bling = require("../bling/bling");
const componex = require("../componex/componex");
const magento = require("../magento/magento");
const filename = __filename.slice(__dirname.length + 1) + " -";
const { parse } = require("node-html-parser");

module.exports = {
  async sincronizaCadastro(sku, exportarDescricao, exportarImagens, exportarSEO, especificacoes) {
    try {
      console.log(filename, "Migrando produto para a Loja Integrada");

      // Adquirir os dados do produto no Bling (para obter o vínculo com a Loja Integrada)
      const produtoBling = await bling.produto(sku, "203426320");

      // Adquirir os dados do produto na Loja Integrada (para obter o vínculo de SEO)
      const produtoLojaIntegrada = await componex.detalhesProduto(produtoBling.idProdutoLoja);

      // Adquirir os dados do produto no Magento
      const { produtoMagento, imagensMagento } = await this.dadosMagento(sku);

      // Exportar as imagens
      if (exportarImagens) {
        await this.exportarImagens(imagensMagento, produtoBling);
      }

      // Exportar dados do produto
      if (exportarDescricao) {
        await this.exportarDadosProduto(produtoMagento, produtoBling, especificacoes);
      }

      // Atualizar informações de SEO
      if (exportarSEO) {
        await this.atualizarSEO(produtoMagento, produtoLojaIntegrada);
      }

      return ok({
        message: "Exportação finalizada",
      });
    } catch (error) {
      return failure({
        message: error.message,
      });
    }
  },

  async exportarImagens(imagensMagento, produtoBling) {
    console.log(filename, "Exportando imagens");

    let imagens = [];

    // A API do Magento retorna objetos diferentes dependendo da quantidade de imagens cadastras
    // Retorna uma Array caso tenha mais uma imagem cadastrada, caso contrário, um objeto
    // Identificar as duas situações e converter ambas para uma array
    if (Array.isArray(imagensMagento.result.item)) {
      imagens = imagensMagento.result.item.map((item) => item);
    } else {
      imagens = [imagensMagento.result.item];
    }

    for (const imagem of imagens) {
      if (imagem.exclude === "0") {
        const principal = imagem.position === "1" ? true : false;

        await componex.cadastrarImagens(
          imagem.url,
          produtoBling.idProdutoLoja,
          principal,
          parseInt(imagem.position)
        );
      }
    }
  },

  async dadosMagento(sku) {
    const client = await magento.createClient();
    const sessionId = await magento.login(client);

    const produtoMagento = await magento.catalogProductInfo(client, sessionId, sku);

    const imagensMagento = await magento.catalogProductAttributeMediaList(client, sessionId, sku);

    try {
      await magento.endSession(client, sessionId);
    } catch (error) {
      console.log(filename, "Não foi possível finalizar a sessão do Magento");
    }

    return { produtoMagento, imagensMagento };
  },

  async exportarDadosProduto(produtoMagento, produtoBling, especificacoes) {
    console.log(filename, "Exportando dados do produto");

    // Manter essas variáveis com os mesmos nomes de exportação para a Loja Integrada
    let nome = produtoMagento.info.name;
    let ativo = produtoMagento.info.status === "1" ? true : false;
    let descricao_completa = produtoMagento.info.description;

    // Acrescenta modificadores de tamanho e fonte a descrição
    // color: rgb(47, 47, 47);
    const head = `<span style="font-family:Arial,Helvetica,sans-serif; font-size: 14px; ">`;
    const tail = `</span>`;

    let tabelaEspecificacoes = "";

    // Verificação de tabela de especificações
    if (especificacoes) {
      const root = parse(especificacoes);

      console.log(root.firstChild.structure);

      const tds = root.getElementsByTagName("td");
      const textos = tds.map((span) => span.text);

      console.log("Quantidade de spans:", tds.length);
      console.log("Quantidade de textos:", textos.length);

      tabelaEspecificacoes = this.montarTabelaEspecificacoes(textos);
    }

    // Monta descrição
    // descricao_completa =
    descricao_completa = head + descricao_completa + tail;

    // DEBUG
    // descricao_completa = descricao_completa + tabelaEspecificacoes;

    // Montar o objeto de exportação para a Loja Integrada
    const dadosLojaIntegrada = {
      nome,
      ativo,
      descricao_completa,
      categorias: [],
    };

    await componex.alterarProduto(produtoBling.idProdutoLoja, dadosLojaIntegrada);
  },

  async atualizarSEO(produtoMagento, produtoLojaIntegrada) {
    console.log(filename, "Exportando dados de SEO");
    // Extrair o vínculo com SEO
    const re = /(?:\/([^/]+))?$/;
    const seo = re.exec(produtoLojaIntegrada.seo)[1];

    let description = produtoMagento.info.meta_description;
    let title = produtoMagento.info.meta_title;

    // Manipulação de Descrição
    description = description.substring(0, 250);

    // Manipulação de Título
    title = title.replace("Baú da Eletrônica", "Componex");

    const dadosLojaIntegrada = {
      description,
      title,
    };

    await componex.alterarSEO(seo, dadosLojaIntegrada);
  },

  montarTabelaEspecificacoes(textos) {
    const rowEven = `
      <tr class="even" style=" box-sizing: border-box; margin: 0px; padding: 0px; background-color: rgb(255, 255, 255);">
          <td style="box-sizing: border-box; margin: 0px; padding: 10px; border: none;">
            <span style="color: rgb(0, 0, 0); font-family: Muli, sans-serif;">
              #COLUNA_1
            </span>
          </td>
          <td class="last" style="box-sizing: border-box; margin: 0px; padding: 10px; border: none;">
            <span style="color: rgb(0, 0, 0); font-family: Muli, sans-serif;">
              #COLUNA_2
            </span>
          </td>
      </tr>
    `;

    const rowOdd = `
      <tr class="odd" style="box-sizing: border-box; margin: 0px; padding: 0px;">
        <td style="box-sizing: border-box; margin: 0px; padding: 10px; border: none;">
          <span style=" color: rgb(0, 0, 0); font-family: Muli, sans-serif; background-color: rgb(244, 244, 244);">
            #COLUNA_1
          </span>
        </td>
        <td class="last" style="box-sizing: border-box; margin: 0px; padding: 10px; border: none;">
          <span style=" color: rgb(0, 0, 0); font-family: Muli, sans-serif; background-color: rgb(244, 244, 244);">
            #COLUNA_2
          </span>
        </td>
      </tr>
    `;

    const baseHtml = `
      <div>
        <table border="0" style=" margin: 0px; padding: 0px; border: 0px; border-collapse: collapse; border-spacing: 0px; empty-cells: show; color: rgb(0, 0, 0); font-family: Muli, sans-serif; background-color: rgb(244, 244, 244);">
          <tbody style="box-sizing: border-box; margin: 0px; padding: 0px;">
            #ROWS
          </tbody>
        </table>
      </div>
    `;

    let rows = "";
    let tamanho = textos.length;

    let evenOddIterator = 0;

    for (let i = 0; i < tamanho; i += 2) {
      let row = "";

      if (evenOddIterator++ % 2 === 0) {
        // Par = Even
        console.log("Even");
        row = rowEven.replace("#COLUNA_1", textos[i]);
        row = row.replace("#COLUNA_2", textos[i + 1]);
      } else {
        // Impar = Odd
        console.log("Odd");
        row = rowOdd.replace("#COLUNA_1", textos[i]);
        row = row.replace("#COLUNA_2", textos[i + 1]);
      }

      rows += row;
    }

    return baseHtml.replace("#ROWS", rows);
  },
};
