const Bling = require("../bling/bling");
const moment = require("moment");
const { models } = require("../modules/sequelize");
const { sequelize } = require("../modules/sequelize");
const { manterApenasNumeros } = require("../utils/replace");

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
};
