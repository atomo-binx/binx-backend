const { ok } = require("../modules/http");

const Bling = require("../bling/bling");

const { models } = require("../modules/sequelize");
const { sequelize } = require("../modules/sequelize");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async sincronizarContatos(dataAlteracao, dataInclusao, tipoPessoa) {
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

    filtros = filtros.length > 1 ? filtros.join(";") : filtros[0];

    // Filtros montados, iniciar sincronização
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

  async contatoTransaction(contato) {
    return sequelize.transaction(async (t) => {
      await models.tbcontato.upsert(contato, { transaction: t });
    });
  },
};
