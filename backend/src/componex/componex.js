const axios = require("axios");

const url = "https://api.awsli.com.br/v1";
const api = axios.create({ baseURL: url });

module.exports = {
  async cadastrarImagens(imagem_url, produto, principal, posicao, mime) {},
};
