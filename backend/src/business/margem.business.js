const Bling = require("../bling/bling");

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async margemProposta(req) {
    let status = false;
    let resposta = "";

    if (req.params.proposta) {
      await Bling.propostaComercial(req.params.proposta)
        .then(async (proposta) => {
          console.log(proposta);
          resposta = proposta;
          status = true;
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro ao adquirir dados da proposta comercial do Bling:",
            error.message
          );
        });
    } else {
      resposta = "Insira um número de proposta comercial";
    }

    return {
      status: status,
      resposta: resposta,
    };
  },

  async margemPedido() {
    let status = false;
    let resposta = "";

    return {
      status: status,
      resposta: resposta,
    };
  },

  async salvaMargemProposta() {
    let status = false;
    let resposta = "";

    return {
      status: status,
      resposta: resposta,
    };
  },

  async salvaMargemPedido() {
    let status = false;
    let resposta = "";

    return {
      status: status,
      resposta: resposta,
    };
  },
};
