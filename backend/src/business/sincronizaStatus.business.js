const neatCsv = require("neat-csv");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

const Bling = require("../bling/bling");
const filename = __filename.slice(__dirname.length + 1) + " -";

const { Op } = require("sequelize");

const Vendas = require("../models/venda.model");
const VendasBusiness = require("../business/venda.business");

const debug = require("../utils/debug");

const http = require("../utils/http");
const magento = require("../magento/magento");

module.exports = {
  // Realiza análise de pedidos para a integração de pedidos do Magento para o Bling
  async analisaPedidos() {
    let arquivoCsv = "";

    // Tenta realizar leitura do arquivo CSV
    try {
      arquivoCsv = fs.readFileSync("orders.csv", "utf8");
    } catch (err) {
      console.error(filename, "Erro na leitura do arquivo CSV:", err.message);
      return false;
    }

    // Realiza parse do arquivo CSV para ser tratado como objeto
    const parsedCsv = await neatCsv(arquivoCsv);

    // Desestrutura dados do CSV
    let pedidosMagento = {};

    // Desestruturar gerando um objeto em que a chave identificadora é o ID do pedido no Magento
    for (const pedido of parsedCsv) {
      pedidosMagento[pedido["Pedido #"]] = {
        idpedido: pedido["Pedido #"],
        data: pedido["Data"],
        status: pedido["Status"],
      };
    }

    // Realiza leitura dos pedidos do banco de dados do Binx
    const pedidosBancoBruto = await Vendas.findAll({
      attributes: ["idpedidovenda", "idstatusvenda", "idpedidoloja", "formapagamento"],
      where: {
        datavenda: {
          [Op.gt]: moment().subtract(15, "days"),
        },
        idloja: "203382852",
      },
      order: [["idpedidovenda", "DESC"]],
      raw: true,
    });

    // Desestruturar os pedidos puxados do nosso banco de acordo com a desestruturação do Magento
    // Gerar um objeto em que a chave identificadora é o ID do pedido do Magento
    let pedidosBling = {};

    for (const pedidoBruto of pedidosBancoBruto) {
      pedidosBling[pedidoBruto["idpedidoloja"]] = pedidoBruto;
    }

    // Cruzar as duas listas de pedidos geradas
    let pedidosCancelar = [];
    let pedidosAprovar = [];
    let cancelarPorData = [];

    let erros = [];

    // Percorre para o cruzamento a partir dos pedidos extraídos do banco (bling)
    // Pois pedidos podem existir no magento e ainda não terem sido exportados para o bling
    // Mas nunca irá ocorrer o contrário, um pedido no banco sempre irá existir no magento

    // Debug
    // let exportarDiasCorridos = [];
    // const pedidosFinaisCancelar = [];

    for (const idPedidoLoja in pedidosBling) {
      try {
        let statusMagento = pedidosMagento[idPedidoLoja]["status"];
        let statusBling = pedidosBling[idPedidoLoja]["idstatusvenda"];
        let idPedidoBling = pedidosBling[idPedidoLoja]["idpedidovenda"];
        let formaPagamento = pedidosBling[idPedidoLoja]["formapagamento"];

        let dataPedido = moment(
          pedidosMagento[idPedidoLoja]["data"],
          "DD/MM/YYYY"
        ).startOf("day");
        let dataHoje = moment().startOf("day");
        let diasCorridos = moment(dataHoje).diff(dataPedido, "days");

        // Debug
        if (false) {
          console.log("Pedido:", idPedidoBling, "/", idPedidoLoja);
          console.log("Data do pedido (Magento):", dataPedido.format("DD/MM/YYYY"));
          console.log("Dias Corridos", diasCorridos);

          console.log(`Pedido Magento: [${idPedidoLoja}]`);
          console.log(`Pedido Bling: [${idPedidoBling}]`);
          console.log(`Status Magento: [${statusMagento}]`);
          console.log(`Status Bling: [${statusBling}]`);
        }

        // Pedido sem pagamento há mais de 7 dias, cancelar
        if (
          diasCorridos >= 7 &&
          statusMagento == "Aguardando aprovação de pagamento" &&
          statusBling != 12
        ) {
          cancelarPorData.push({
            bling: idPedidoBling,
            magento: idPedidoLoja,
            data: dataPedido.format("DD/MM/YYYY"),
            diasCorridos: diasCorridos,
          });
        }

        // Cancelamento de pedidos Pix
        if (
          diasCorridos >= 3 &&
          formaPagamento === "Site Pix" &&
          statusMagento == "Aguardando aprovação de pagamento" &&
          statusBling == 6
        ) {
          cancelarPorData.push({
            bling: idPedidoBling,
            magento: idPedidoLoja,
            data: dataPedido.format("DD/MM/YYYY"),
            diasCorridos: diasCorridos,
          });
        }

        // Pedido foi cancelado no Magento, cancelar no Bling
        if (statusMagento == "Cancelado" && statusBling == 6) {
          pedidosCancelar.push({
            bling: pedidosBling[idPedidoLoja]["idpedidovenda"],
            magento: idPedidoLoja,
          });
        }

        // Pedido aprovado no Magento, aprovar no Bling
        if (statusMagento == "Pagamento Aprovado" && statusBling == 6) {
          pedidosAprovar.push({
            bling: pedidosBling[idPedidoLoja]["idpedidovenda"],
            magento: idPedidoLoja,
          });
        }
      } catch (error) {
        erros.push({
          bling: pedidosBling[idPedidoLoja]["idpedidovenda"],
          magento: idPedidoLoja,
        });
      }
    }

    // Debug
    // debug.clearFile("diascorridos.json");
    // debug.writeFile("diascorridos.json", JSON.stringify(exportarDiasCorridos));

    // console.log("Erros:\n", erros);
    // console.log("Cancelar: \n", pedidosCancelar);
    // console.log("Aprovar:\n", pedidosAprovar);
    // console.log("Cancelar por data:", cancelarPorData);

    console.log("Pedidos com 'Falha de Integração':", erros.length);
    console.log("Pedidos para cancelar:", pedidosCancelar.length);
    console.log("Pedidos para aprovar:", pedidosAprovar.length);
    console.log("Pedidos para cancelar por data:", cancelarPorData.length);

    // Debug
    // console.log(pedidosFinaisCancelar);

    return {
      aprovar: pedidosAprovar,
      cancelar: pedidosCancelar,
      erro: erros,
      cancelarPrazo: cancelarPorData,
    };
  },

  // Delay forçado de meio segundo para chamadas de alteração de status de pedido de venda
  async forcedDelay() {
    return new Promise(async (resolve, reject) => {
      setTimeout(resolve, 1000);
    });
  },

  // Altera status de um pedido ou uma lista de pedidos
  async alterarStatusPedido(req, res) {
    if (req.body.pedidos && req.body.status) {
      const pedidos = req.body.pedidos;
      const status = req.body.status;

      // Altera o status dos pedidos no Bling
      for (const pedido of pedidos) {
        console.log(
          filename,
          "Disparando chamada de alteração de status do pedido",
          pedido,
          "para",
          status
        );

        await Bling.atualizaStatusPedido(pedido, status)
          .then(() => {
            console.log(
              filename,
              "Chamada de atualização de status de pedido realizada com sucesso para o pedido",
              pedido
            );
          })
          .catch((error) => {
            console.log(
              filename,
              "Erro na atualização de status de pedido do Bling para o pedido",
              pedido,
              error.message
            );
          });
      }

      // Sincroniza apenas os pedidos alterados
      // Desativando essa rotina, atualização será por callback
      // try {
      //   console.log(filename, "Iniciando sincronização dos pedidos com status alterados");
      //   await VendasBusiness.sincronizaPedidos({ body: { pedidos } });
      //   console.log(filename, "Pedidos alterados sincronizados com sucesso");
      // } catch (error) {
      //   console.log(
      //     filename,
      //     "Erro ao sincronizar status dos pedidos alterados:",
      //     error.message
      //   );
      // }

      return true;
    } else {
      console.log(filename, "Formato recebido inesperado");
      return false;
    }
  },

  // Realiza integração de pedidos do Magento para o Bling
  async sync(req, res) {
    // Ao chegar até aqui, o arquivo ja foi criado
    // Com o middleware Multer no arquivo de Rotas, o arquivo é criado no momento da chamada da API
    // Ao responder ao post, o routes já criou o arquivo no diretório de destino
    // Não é a solução mais elegante, mas por hora funciona

    // Gera análise dos status de pedidos
    const analise = await this.analisaPedidos();

    // Por fim, remove o arquivo de pedidos enviado nesse ciclo
    try {
      const caminho = path.join(__dirname, "../..", "orders.csv");
      fs.unlinkSync(caminho);
      console.log(filename, "Arquivo final de pedidos de venda removido");
    } catch (error) {
      console.log(
        filename,
        "Não foi encontrado nenhum arquivo de pedido de venda para remoção"
      );
    }

    // Verifica resultado da análise e retorna a chamada original da API
    if (analise) {
      return {
        status: true,
        resultado: analise,
      };
    } else {
      return {
        status: false,
        analise: [],
      };
    }
  },

  // Rotinas da aprovação automática
  async listaPedidosBinx() {
    // Realiza leitura dos pedidos do banco de dados do Binx
    const pedidos = await Vendas.findAll({
      attributes: ["idpedidovenda", "idstatusvenda", "idpedidoloja", "formapagamento"],
      where: {
        datavenda: {
          // Obs: nesta função, chamar 15 dias, um dia a mais do que o do Magento
          [Op.gt]: moment().subtract(15, "days"),
        },
        idloja: "203382852",
      },
      order: [["idpedidovenda", "DESC"]],
      raw: true,
    });

    return pedidos;
  },

  montarDicionario(array, chave) {
    let dicionario = {};

    for (const item of array) {
      dicionario[item[chave]] = item;
    }

    return dicionario;
  },

  async alterarStatus(pedidos, status) {
    for (const pedido of pedidos) {
      console.log(filename, `Alterando pedido ${pedido} para ${status}`);

      await Bling.atualizaStatusPedido(pedido, status)
        .then(() => {
          console.log(filename, `Status do pedido ${pedido} alterado`);
        })
        .catch((error) => {
          console.log(
            filename,
            `Erro ao alterar status do pedido ${pedido}:`,
            error.message
          );
        });
    }
  },

  async cruzarPedidos(pedidosMagento, pedidosBinx) {
    let pedidosCancelar = [];
    let pedidosAprovar = [];

    let erros = [];

    for (const idPedidoLoja in pedidosBinx) {
      try {
        let statusMagento = pedidosMagento[idPedidoLoja]["status"];
        let statusBling = pedidosBinx[idPedidoLoja]["idstatusvenda"];
        let idPedidoBling = pedidosBinx[idPedidoLoja]["idpedidovenda"];
        let formaPagamento = pedidosBinx[idPedidoLoja]["formapagamento"];

        let dataPedido = moment(
          pedidosMagento[idPedidoLoja]["data"],
          "YYYY-MM-DD HH:mm:ss"
        ).startOf("day");
        let dataHoje = moment().startOf("day");
        let diasCorridos = moment(dataHoje).diff(dataPedido, "days");

        // Debug
        // console.log("------------------------------------------------------------");
        // console.log("Pedido:", idPedidoBling, "/", idPedidoLoja);
        // console.log("Data do pedido (Magento):", dataPedido.format("DD/MM/YYYY"));
        // console.log("Dias Corridos", diasCorridos);
        // console.log("Data de Hoje:", dataHoje.format("DD/MM/YYYY"));
        // console.log("Forma de pagamento:", formaPagamento);
        // console.log("Status Magento:", statusMagento);

        // Pedido aprovado no Magento, aprovar no Bling
        if (
          (statusMagento == "Pagamento Aprovado" || statusMagento == "processing") &&
          statusBling == 6
        ) {
          pedidosAprovar.push({
            bling: pedidosBinx[idPedidoLoja]["idpedidovenda"],
            magento: idPedidoLoja,
          });
        }

        // Pedido sem pagamento há mais de 7 dias, cancelar
        if (
          diasCorridos >= 7 &&
          statusBling == 6 &&
          (statusMagento == "Aguardando aprovação de pagamento" ||
            statusMagento == "pending")
        ) {
          pedidosCancelar.push({
            bling: idPedidoBling,
            magento: idPedidoLoja,
            data: dataPedido.format("DD/MM/YYYY"),
            diasCorridos: diasCorridos,
          });
        }

        // Cancelamento de pedidos Pix
        if (
          diasCorridos >= 2 &&
          formaPagamento === "Site Pix" &&
          (statusMagento == "Aguardando aprovação de pagamento" ||
            statusMagento == "pending") &&
          statusBling == 6
        ) {
          pedidosCancelar.push({
            bling: idPedidoBling,
            magento: idPedidoLoja,
            data: dataPedido.format("DD/MM/YYYY"),
            diasCorridos: diasCorridos,
          });
        }

        // Pedido foi cancelado no Magento, cancelar no Bling
        if (
          (statusMagento == "Cancelado" || statusMagento == "canceled") &&
          statusBling == 6
        ) {
          pedidosCancelar.push({
            bling: pedidosBinx[idPedidoLoja]["idpedidovenda"],
            magento: idPedidoLoja,
          });
        }
      } catch (error) {
        // O pedido existe no Magento, e não no Bling
        erros.push({
          bling: pedidosBinx[idPedidoLoja]["idpedidovenda"],
          magento: idPedidoLoja,
        });
      }
    }

    return { pedidosCancelar, pedidosAprovar, erros };
  },

  async rotinaAprovacaoAutomatica() {
    try {
      // Listar vendas do Magento
      console.log(filename, "Listando pedidos Magento");
      const pedidosMagento = await magento.pedidosVenda();

      // Listar vendas do Binx
      console.log(filename, "Listando pedidos Binx");
      const pedidosBinx = await this.listaPedidosBinx();

      // Monta dicionários
      const dicionarioMagento = this.montarDicionario(pedidosMagento, "idpedido");
      const dicionarioBinx = this.montarDicionario(pedidosBinx, "idpedidoloja");

      // Cruzar dados
      console.log(filename, "Iniciando cruzamento de dados");

      let { pedidosCancelar, pedidosAprovar, erros } = await this.cruzarPedidos(
        dicionarioMagento,
        dicionarioBinx
      );

      console.log(filename, "Qntd de pedidos para aprovar:", pedidosAprovar.length);
      console.log(filename, "Qntd de pedidos para cancelar:", pedidosCancelar.length);

      // Debug
      // console.log(filename, "Pedidos para Aprovar:", pedidosAprovar);
      // console.log(filename, "Pedidos para Cancelar:", pedidosCancelar);
      // console.log(filename, "Erros:", erros);

      // Sincronizar os Status

      // Desestrutura pedidos para montar os pacotes para a aprovação/cancelamento
      pedidosAprovar = pedidosAprovar.map((pedido) => pedido["bling"]);
      pedidosCancelar = pedidosCancelar.map((pedido) => pedido["bling"]);

      // Realiza alterações nos status
      await this.alterarStatus(pedidosAprovar, 15005);
      await this.alterarStatus(pedidosCancelar, 12);

      console.log(filename, "Rotina de aprovação automática finalizada");

      return http.ok({
        message: "Rotina de aprovação automática finalizada",
      });
    } catch (error) {
      console.log(
        filename,
        `Erro durante a aprovação automática: ,
        ${error.message}`
      );

      return http.failure({
        message: `Erro durante a aprovação automática: ,
        ${error.message}`,
      });
    }
  },

  async aprovacaoAutomatica() {
    try {
      let time = moment().format("DD/MM/YYYY HH:mm:ss");
      console.log(time, filename, "Iniciando aprovação automática");

      this.rotinaAprovacaoAutomatica();

      return http.ok({
        message: "Rotina de aprovação automática iniciada",
      });
    } catch (error) {
      console.log(
        filename,
        `Erro ao iniciar rotina de aprovação automática: ${error.message}`
      );

      return http.failure({
        message: `Erro ao iniciar rotina de aprovação automática: ${error.message}`,
      });
    }
  },
};
