const axios = require("axios");

const api = axios.create({
  baseURL: "https://api.awsli.com.br/v1",
  headers: {
    Authorization: `chave_api ${process.env.LOJA_INTEGRADA_API} aplicacao ${process.env.LOJA_INTEGRADA_CHAVE}`,
  },
});

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async detalhesProduto(idProdutoLoja) {
    return new Promise((resolve, reject) => {
      api
        .get(`/produto/${idProdutoLoja}/`)
        .then((res) => {
          resolve(res.data);
        })
        .catch((error) => {
          console.log(filename, `${error.message}:`, error.response.data);
          reject(error);
        });
    });
  },

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
          resolve(res.data);
        })
        .catch((error) => {
          console.log(filename, `${error.message}:`, error.response.data);
          reject(error);
        });
    });
  },

  async alterarProduto(vinculo, dados) {
    return new Promise((resolve, reject) => {
      api
        .put(`/produto/${vinculo}`, dados)
        .then((res) => {
          resolve(res.data);
        })
        .catch((error) => {
          console.log(filename, `${error.message}:`, error.response.data);
          reject(error);
        });
    });
  },

  async alterarSEO(vinculo, dados) {
    return new Promise((resolve, reject) => {
      api
        .put(`/seo/${vinculo}`, dados)
        .then((data) => {
          resolve(data.res);
        })
        .catch((error) => {
          console.log(filename, `${error.message}:`, error.response.data);
          reject(error);
        });
    });
  },
};
