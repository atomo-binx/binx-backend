const PrecificacaoBusiness = require("../business/precificacao.business");

const http = require("../modules/http");

const MotivoValidator = require("../validators/motivo.validator");
const PaginaValidator = require("../validators/pagina.validator");

module.exports = {
  async itensParaPrecificar(req, res, next) {
    try {
      // Aquisição dos parâmetros
      const { motivo, pagina } = req.query;

      // Validação dos parâmetros
      const validarMotivo = MotivoValidator.validar(motivo);
      const validarPagina = PaginaValidator.validar(pagina);

      if (validarMotivo.error) {
        return http.badRequest(res, validarMotivo);
      }

      if (pagina) {
        if (validarPagina.error) {
          return http.badRequest(res, validarPagina);
        }
      }

      // Execução da requisição
      const resposta = await PrecificacaoBusiness.itensParaPrecificar();

      // Retorno do resultado
      if (resposta.error) {
        return http.failure(res, resposta);
      } else {
        return http.ok(res, resposta);
      }
    } catch (error) {
      next(error);
    }
  },
};
