const Bling = require("../bling/bling");
const moment = require("moment");
const { models } = require("../modules/sequelize");
const { sequelize } = require("../modules/sequelize");
const { manterApenasNumeros } = require("../utils/replace");
const { ok } = require("../modules/http");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async sincronizarContatos(
    dataAlteracao,
    dataInclusao,
    tipoPessoa,
    unidadeTempo,
    quantidadeTempo,
    tipoSincronizacao,
    sincronizarTudo,
    contatos
  ) {
    let filtros = [];

    if (dataAlteracao && !dataInclusao) {
      filtros.push(`dataAlteracao[${dataAlteracao}]`);
    }

    if (dataInclusao && !dataAlteracao) {
      filtros.push(`dataInclusao[${dataInclusao}]`);
    }

    if (tipoPessoa) {
      filtros.push(`tipoPessoa[${tipoPessoa}]`);
    }

    if ((unidadeTempo && quantidadeTempo && !dataAlteracao) || !dataInclusao) {
      let dataHoje = moment().format("DD/MM/YYYY");
      let dataAnterior = moment().subtract(quantidadeTempo, unidadeTempo).format("DD/MM/YYYY");

      if (tipoSincronizacao === "I") {
        filtros.push(`dataInclusao[${dataAnterior} TO ${dataHoje}]`);
      } else {
        filtros.push(`dataAlteracao[${dataAnterior} TO ${dataHoje}]`);
      }
    }

    if (sincronizarTudo === "true") {
      filtros = [];
    }

    filtros = filtros.length > 1 ? filtros.join(";") : filtros[0];

    if (contatos) {
      console.log(filename, "Sincronizando contatos através de lista de contatos.");
      await this.sincronizaListaContatos(contatos);
    } else {
      console.log(filename, "Sincronizando contatos a partir de filtros:", filtros);
      await this.sincronizaPaginaContatos(filtros);
    }
  },

  async sincronizaPaginaContatos(filtros) {
    let start = new Date();

    let procurando = true;
    let pagina = 1;

    let inseridos = 0;
    let rejeitados = 0;

    while (procurando) {
      console.log(filename, "Iniciando busca na página:", pagina);

      const contatos = await Bling.listaPaginaContatos(filtros, pagina++);

      if (contatos.length > 0) {
        for (const contato of contatos) {
          try {
            await this.contatoTransaction(contato);
            inseridos++;
          } catch (error) {
            rejeitados++;
          }
        }

        // Adiantar a verificação de corte do próximo ciclo
        if (contatos.length < 100) {
          procurando = false;
        }
      } else {
        procurando = false;
      }
    }

    console.log(filename, "Finalizando procedimento de sincronização de contatos.");

    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
    console.log(filename, "Total de contatos inseridos: ", inseridos);
    console.log(filename, "Total de contatos recusados: ", rejeitados);
  },

  async sincronizaListaContatos(contatos) {
    let inseridos = 0;

    let start = new Date();

    for (const cpfcnpj of contatos) {
      try {
        const contato = await Bling.contato(manterApenasNumeros(cpfcnpj));

        await this.contatoTransaction(contato);

        inseridos++;
      } catch (error) {
        console.log(filename, `Contato: ${manterApenasNumeros(cpfcnpj)} -`, error.message);
      }
    }

    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento:", elapsedTime);
    console.log(filename, "Total de contatos sincronizados:", inseridos);
  },

  async contatoTransaction(contato) {
    return sequelize.transaction(async (t) => {
      await models.tbcontato.upsert(contato, { transaction: t });
    });
  },

  async incluir(contato) {
    contato.cep = manterApenasNumeros(contato.cep);
    contato.fone = manterApenasNumeros(contato.fone);
    contato.celular = manterApenasNumeros(contato.celular);

    const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <contato>
      <nome>${contato.nome}</nome>
      <tipoPessoa>${contato.tipoPessoa}</tipoPessoa>
      <contribuinte>${contato.contribuinte}</contribuinte>
      <cpf_cnpj>${contato.cpfCnpj}</cpf_cnpj>
      <ie_rg>${contato.irRg || ""}</ie_rg>
      <endereco>${contato.endereco || ""}</endereco>
      <numero>${contato.numero || ""}</numero>
      <complemento>${contato.complemento || ""}</complemento>
      <bairro>${contato.bairro || ""}</bairro>
      <cep>${contato.cep || ""}</cep>
      <cidade>${contato.cidade || ""}</cidade>
      <uf>${contato.uf || ""}</uf>
      <fone>${contato.fone || ""}</fone>
      <celular>${contato.celular || ""}</celular>
      <email>${contato.email || ""}</email>
      <emailNfe>${contato.emailNfe || ""}</emailNfe>
      <tipos_contato>
        <tipo_contato>
          <descricao>${contato.tipoContato}</descricao>
        <tipo_contato>
      </tipos_contato>
    </contato>
    `;

    // Incluir o contato no Bling conforme o XML criado
    // await Bling.incluirContato(xml);

    // Adquirir os dados do contato recém incluído no Bling
    const contatoIncluido = await Bling.contato(contato.cpfCnpj);

    // Para contatos do tipo "Fornecedor", vamos inclui-lo também no Binx
    if (contato.tipoContato === "Fornecedor") {
      await models.tbfornecedor.create({
        idfornecedor: contatoIncluido.idcontato,
        nomefornecedor: contatoIncluido.nome,
      });
    }

    return ok();
  },
};
