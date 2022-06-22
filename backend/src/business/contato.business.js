const { ok } = require("../modules/http");

const Bling = require("../bling/bling");

const { models } = require("../modules/sequelize");
const { sequelize } = require("../modules/sequelize");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async sincronizaContatos() {
    const filtros = "tipoPessoa[J]";

    let start = new Date();

    // Procedimento de Busca
    let procurando = true;
    let pagina = 1;

    // Contadores
    let inseridos = 0;
    let rejeitados = 0;
    let contatosReijeitados = [];

    // Procedimento iterativo de busca
    while (procurando) {
      console.log(filename, "Iniciando busca na página:", pagina);

      const contatos = await Bling.listaPaginaContatos(filtros, pagina++);

      if (contatos.length > 0) {
        for (const contato of contatos) {
          const status = await this.contatoTransaction(contato);

          if (status) {
            inseridos++;
          } else {
            rejeitados++;
            contatosReijeitados.push(contato.idpedidovenda);
          }
        }

        // Adiantar a verificação de corte do próximo ciclo
        if (contatos.length < 100) {
          procurando = false;
        }
      } else {
        // Chegamos ao fim das páginas de pedidos de vendas
        procurando = false;
      }
    }

    console.log(
      filename,
      "Finalizando procedimento de sincronização de contatos."
    );

    let end = new Date();
    let elapsedTime = new Date(end - start).toISOString().slice(11, -1);

    console.log(filename, "Tempo gasto no procedimento: ", elapsedTime);
    console.log(filename, "Total de contatos inseridos: ", inseridos);
    console.log(filename, "Total de contatos recusados: ", rejeitados);

    return ok({
      message: "OI",
    });
  },

  async contatoTransaction(contato) {
    // console.log(filename, `Contato: ${contato.nome} -`, `Iniciando transação.`);

    try {
      await sequelize.transaction(async (t) => {
        await models.tbcontato.upsert(contato, { transaction: t });
      });

      return true;
    } catch (error) {
      console.log(
        filename,
        `Contato: ${contato.nome} - (ID ${contato.idcontato}) -`,
        `Erro durante a transação contato:`,
        error.message
      );

      return false;
    }
  },
};
