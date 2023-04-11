const ComprasBusiness = require("../business/compras.business");
const DashboardComprasBusiness = require("../business/dashboardcompras.business");
const { OkStatus } = require("../modules/codes");

module.exports = {
  // Dashboard geral de compras
  async dashboard(req, res, next) {
    try {
      const resposta = await DashboardComprasBusiness.dashboard();
      res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  // Dashboard específico do gráfico de disponibilidade
  async dashboardDisponibilidade(req, res, next) {
    try {
      const { dataInicio, dataFinal } = req.query;

      const resposta = await DashboardComprasBusiness.dashboardDisponibilidade(dataInicio, dataFinal);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  // Dashboard específico do gráfico de montantes
  async dashboardMontantes(req, res, next) {
    try {
      const { dataInicio, dataFinal } = req.query;

      const resposta = await DashboardComprasBusiness.dashboardMontantes(dataInicio, dataFinal);

      return res.status(resposta.statusCode).json(resposta.body);
    } catch (error) {
      next(error);
    }
  },

  async salvarDashboard(req, res) {
    const resposta = await DashboardComprasBusiness.salvarDashboard(req);

    res.status(resposta.statusCode).json(resposta.body);
  },

  async relatorioPrecificacao(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioPrecificacao();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async relatorioUltimoCusto(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioUltimoCusto();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async relatorioSituacaoEstoque(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioSituacaoEstoque();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async relatorioCompraProduto(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioCompraProduto();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async relatorioTransferencia(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioTransferencia();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },

  async relatorioMontagemKits(req, res, next) {
    try {
      const resposta = await ComprasBusiness.relatorioMontagemKits();

      if (resposta.body.status === OkStatus) {
        res.header("filename", resposta.body.response.filename);
        return res.download(resposta.body.response.filename);
      } else {
        return res.status(resposta.statusCode).json(resposta.body);
      }
    } catch (error) {
      next(error);
    }
  },
};
