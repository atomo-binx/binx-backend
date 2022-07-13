const axios = require("axios");

const api = axios.create({
  baseURL: "https://api.awsli.com.br/v1",
  headers: {
    Authorization: `chave_api ${process.env.LOJA_INTEGRADA_API} aplicacao ${process.env.LOJA_INTEGRADA_CHAVE}`,
  },
});

module.exports = {
  async cadastrarImagens(imagem_url, vinculo, principal, posicao) {
    return new Promise((resolve, reject) => {
      // Expressão regular para extrair a extensão do arquivo
      // Fonte: https://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript
      const re = /(?:\.([^.]+))?$/;
      const mime = "image/" + re.exec(imagem_url)[1];

      const data = {
        imagem_url,
        produto: `/api/v1/produto/${vinculo}`,
        principal,
        posicao,
        mime,
      };

      api
        .post("/produto_imagem", data)
        .then((res) => {
          console.log(res.data);
          resolve();
        })
        .catch((error) => {
          console.log(error.message);
          reject(error);
        });
    });
  },

  async alterarProduto(vinculo, dados) {
    return new Promise((resolve, reject) => {
      console.log({ dados });

      api
        .put(`/produto/${vinculo}`, dados)
        .then((res) => {
          console.log(res.data);
          resolve();
        })
        .catch((error) => {
          console.log(error);
          console.log(error.message);
          reject(error);
        });
    });
  },
};
