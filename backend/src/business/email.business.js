const Email = require("../models/email.model");
const EmailEnviado = require("../models/emailEnviado.model");
const SES = require("../aws/ses");
const Bling = require("../bling/bling");
const Produto = require("../models/produto.model");
const Venda = require("../models/venda.model");
const currency = require("currency.js");

const fs = require("fs").promises;
const filename = __filename.slice(__dirname.length + 1) + " -";
const http = require("../utils/http");

// Funções auxiliares para manuseio de valores monetários
const BRL = (value, precision) => currency(value, { precision });
const formatBRL = (currency) =>
  currency.format({ symbol: "" }).replace(",", "+").replace(".", ",").replace("+", ".");

module.exports = {
  // Rotina para envio de email em ambiente de Debug (informando o destinarário)
  async emailDebug(req) {
    try {
      // Desestrutura dados passados
      const { pedido, idEmail, destinatario } = req.body;

      if (!pedido || !idEmail || !destinatario) {
        return http.badRequest({
          message:
            "É necessário informar os valores de número de pedido, id do email e destinatário.",
        });
      }

      // Adquire a venda do Bling
      let venda = await Bling.pedidoVenda(pedido);

      if (venda) {
        // Estamos operando em debug, substituir os dados do pedido de venda
        venda["email"] = destinatario;

        // Continuar a rotina de envio de email
        await this.enviarEmail(idEmail, venda);
      } else {
        return http.failure({
          message: "Falha no procedimento de rotina de email",
        });
      }

      return http.ok({
        message: "Rotina de email de debug executada",
      });
    } catch (error) {
      console.log(filename, "Falha na execução de rotina de email de Debug:", error.message);

      return http.failure({
        message: "Falha no procedimento de rotina de email",
      });
    }
  },

  // Rotina para envio de email através do SES
  async enviarEmail(idEmail, venda) {
    try {
      // Definição do remetente, será um padrão para todos os emails
      const remetente = "contato@baudaeletronica.com.br";

      // Realiza montagem do email
      const email = await this.montaEmail(idEmail, venda);

      if (email) {
        console.log(
          filename,
          `Pedido de Venda: ${venda.idpedidovenda} -`,
          `Disparando email ${idEmail} para o endereço:`,
          email["destinatario"]
        );

        await SES.enviar(remetente, [email["destinatario"]], email["assunto"], email["html"]);

        return true;
      }
    } catch (error) {
      console.log(
        filename,
        `Pedido de Venda: ${venda.idpedidovenda} -`,
        "Erro durante a execução de rotina de envio de email:",
        error.message
      );

      return false;
    }
  },

  // Rotina para Montagem do corpo do Email
  async montaEmail(idEmail, venda) {
    try {
      let assunto = "";
      let html = "";

      switch (idEmail) {
        // Pedido Recebido
        case 1:
          {
            assunto = `Recebemos o seu pedido ${venda["idpedidoloja"]}!`;

            // Carrega arquivo base
            html = (await fs.readFile("src/emails/html/1_pedido_criado.html")).toString();

            // Realiza substituições
            html = await this.replaceCliente(html, venda);
            html = await this.replacePedido(html, venda);
            html = await this.replaceValores(html, venda);
            html = await this.replaceProdutos(html, venda);
            html = await this.replacePagamento(html, venda);
            html = await this.replacePrazo(html, venda);
            html = await this.replaceEndereco(html, venda);
          }
          break;
        // Pagamento Aprovado
        case 2:
          {
            assunto = `O pagamento para o pedido ${venda["idpedidoloja"]} foi aprovado!`;

            html = (await fs.readFile("src/emails/html/2_pedido_aprovado.html")).toString();

            // Substituções
            html = await this.replacePedido(html, venda);
            html = await this.replacePagamento(html, venda);
            html = await this.replacePrazo(html, venda);
            html = await this.replaceValores(html, venda);

            // Substitui linha de informação adicional
            html = await this.replacePagamentoAprovado(html, venda);
          }
          break;
        // Pedido Cancelado
        case 3:
          {
            assunto = `Seu pedido ${venda["idpedidoloja"]} foi cancelado`;

            html = (await fs.readFile("src/emails/html/3_pedido_cancelado.html")).toString();

            html = await this.replaceCliente(html, venda);
            html = await this.replacePedido(html, venda);
            html = await this.replaceValores(html, venda);
            html = await this.replaceProdutos(html, venda);
            html = await this.replacePagamento(html, venda);
            html = await this.replacePrazo(html, venda);
            html = await this.replaceEndereco(html, venda);
          }
          break;
        // Em Separação
        case 4:
          {
            assunto = `Pedido ${venda["idpedidoloja"]} em separação!`;

            html = (await fs.readFile("src/emails/html/4_pedido_em_separacao.html")).toString();

            html = await this.replacePedido(html, venda);
            html = await this.replaceSeparacao(html, venda);
          }
          break;

        // Pedido Enviado
        case 5:
          {
            assunto = `O seu pedido ${venda["idpedidoloja"]} foi enviado!`;

            html = (await fs.readFile("src/emails/html/5_pedido_enviado.html")).toString();

            html = await this.replacePedido(html, venda);
            html = await this.replacePrazo(html, venda);
            html = await this.replaceEndereco(html, venda);

            html = await this.replaceRastreio(html, venda);
          }
          break;
        // Aguardando Retirada
        case 6:
          {
            assunto = `O seu pedido ${venda["idpedidoloja"]} está aguardando a retirada!`;

            html = (await fs.readFile("src/emails/html/6_aguardando_retirada.html")).toString();

            html = await this.replaceCliente(html, venda);
            html = await this.replacePedido(html, venda);
          }
          break;
      }

      return {
        destinatario: venda["email"],
        assunto: assunto,
        html: html,
      };
    } catch (error) {
      console.log(
        filename,
        `Pedido de Venda: ${venda.idpedidovenda} -`,
        "Erro durante o procedimento de montagem de email:",
        error.message
      );

      return false;
    }
  },

  // Funções de Substituição
  async replaceCliente(html, venda) {
    return html.replace("#CLIENTE", venda["cliente"]);
  },

  async replacePedido(html, venda) {
    return html.replace("#PEDIDO", venda["idpedidoloja"]);
  },

  async replaceValores(html, venda) {
    html = html.replace("#VALOR_PRODUTOS", formatBRL(BRL(venda["totalprodutos"], 2)));
    html = html.replace("#VALOR_FRETE", formatBRL(BRL(venda["fretecliente"], 2)));
    html = html.replace("#VALOR_TOTAL", formatBRL(BRL(venda["totalvenda"], 2)));

    // Verifica se existe desconto neste pedido
    if (venda["desconto"] !== "0,00") {
      let linhaDesconto = (await fs.readFile("src/emails/html/row_desconto.html")).toString();

      // Diferente dos demais campos, o valor de desconto vem com "," na casa decimal
      // Substituir antes a "," por "." para realizar a formatação em moeda
      linhaDesconto = linhaDesconto.replace(
        "#VALOR_DESCONTO",
        formatBRL(BRL(venda["desconto"].replace(",", "."), 2))
      );

      html = html.replace("#DESCONTO", linhaDesconto);
    } else {
      // Nenhum desconto registrado para este email
      html = html.replace("#DESCONTO", "");
    }

    return html;
  },

  async replacePagamento(html, venda) {
    let metodoPagamento = venda["formapagamento"];

    if (venda["formapagamento"].includes("Boleto")) {
      metodoPagamento = "Boleto Bancário";
    }
    if (venda["formapagamento"].includes("Cartão")) {
      metodoPagamento = "Cartão de Crédito";
    }
    if (venda["formapagamento"].includes("Pix")) {
      metodoPagamento = "Pagamento Instantâneo (PIX)";
    }

    return html.replace("#METODO_PAGAMENTO", metodoPagamento);
  },

  async replacePrazo(html, venda) {
    let prazoQuery = await Venda.findOne({
      where: {
        idpedidovenda: venda["idpedidovenda"],
      },
      attributes: ["servico", "alias"],
      raw: true,
    });

    let prazo = "";

    // Definir qual prazo deve ser utilizado
    // Definir desta maneira o prazo que será enviado pois os valores não são traduzidos
    // Sedex, PAC, DLog etc, nos alias constam como "Economico", "Normal", etc
    if (prazoQuery["servico"] === "Motoboy" || prazoQuery["servico"] === "Retirada na Loja") {
      // Utilizar como prazo o valor armazenado em serviço
      prazo = prazoQuery["servico"];
    } else {
      // Utilizar como prazo o valor armazenado no alias
      prazo = prazoQuery["alias"].replace("Serviços de Entrega - ", "");
    }

    return html.replace("#PRAZO", prazo);
  },

  async replaceEndereco(html, venda) {
    const cep = venda["cep"].replace(".", "");
    const endereco = `${venda["rua"]} - ${venda["numero"]} - ${venda["bairro"]}`;
    const cidadeUf = `${venda["cidade"]} - ${venda["uf"]}`;

    html = html.replace("#ENDERECO", endereco);
    html = html.replace("#ENDERECO_CIDADE_UF", cidadeUf);
    html = html.replace("#CEP", cep);

    return html;
  },

  async replaceProdutos(html, venda) {
    let tabelaProdutos = "";
    let qntItens = venda["itens"].length;

    // Cria até três linhas de produtos para inserir na tabela
    for (const idx of [0, 1, 2]) {
      if (venda["itens"][idx]) {
        const item = venda["itens"][idx];

        // Adquire a URL para a imagem do produto
        const urls = await Produto.findOne({
          where: {
            idsku: item["idsku"],
          },
          attributes: ["urlimagem", "urlproduto"],
          raw: true,
        });

        // URL da imagem do produto não econtrada, aplicar URL do logo do site
        if (!urls["urlimagem"])
          urls["urlimagem"] =
            "https://storage.googleapis.com/baudaeletronicadatasheet/email_logo_bau.png";

        // URL do produto não encontrada, aplicar URL da homepage do site
        if (!urls["urlproduto"]) urls["urlproduto"] = "https://www.baudaeletronica.com.br/";

        // Valor do item atual para inserir na tabela
        let valorItem = BRL(item["valorunidade"], 2).multiply(parseInt(item["quantidade"]));

        // Carrega o arquivo de linha de tabela de produtos
        let linha = (await fs.readFile("src/emails/html/row_tabela_produtos.html")).toString();

        // Realiza substituições nesta linha da tabela
        linha = linha.replace("#PRODUTO_NOME", item["nome"]);
        linha = linha.replace("#PRODUTO_QUANTIDADE", item["quantidade"]);
        linha = linha.replace("#PRODUTO_VALOR", formatBRL(valorItem));
        linha = linha.replace("#PRODUTO_FOTO", urls["urlimagem"]);
        linha = linha.replace("#PRODUTO_LINK", urls["urlproduto"]);

        // Adiciona a linha atual na tabela de produtos
        tabelaProdutos += linha;
      }
    }

    // Calcula valor para a linha de itens restantes
    if (qntItens > 3) {
      // Calcular quantidade restante
      let resto = qntItens - 3;

      // Carregar linha da quantidade de itens restantes
      let linhaResto = (await fs.readFile("src/emails/html/row_outros_itens.html")).toString();

      // Troca o dado dentro da linha de resto
      linhaResto = linhaResto.replace("#ITENS_RESTO", resto);

      // Acrescenta a linha de resto ao corpo do email
      html = html.replace("#OUTROS_ITENS", linhaResto);
    } else {
      // Não é necessário incluir a linha de itens restantes
      html = html.replace("#OUTROS_ITENS", "");
    }

    // Insere a tabela de produtos no html
    return html.replace("#PRODUTOS", tabelaProdutos);
  },

  async replacePagamentoAprovado(html, venda) {
    // Monta linha de informações
    let infoRow = "";

    // Realiza leitura do alias de serviço de entrega do banco de dados
    let prazoQuery = await Venda.findOne({
      where: {
        idpedidovenda: venda["idpedidovenda"],
      },
      attributes: ["servico", "alias"],
      raw: true,
    });

    switch (prazoQuery["servico"]) {
      case "Retirada na Loja":
        infoRow = (
          await fs.readFile("src/emails/html/row_pagamento_aprovado_retira.html")
        ).toString();
        break;
      case "Motoboy":
        infoRow = (
          await fs.readFile("src/emails/html/row_pagamento_aprovado_motoboy.html")
        ).toString();
        break;
      default:
        infoRow = (
          await fs.readFile("src/emails/html/row_pagamento_aprovado_transportadora.html")
        ).toString();
        break;
    }

    // Substitui informações de retirada
    return html.replace("#INFORMACAO", infoRow);
  },

  async replaceSeparacao(html, venda) {
    let infoRow = (await fs.readFile("src/emails/html/row_pedido_em_separacao.html")).toString();

    return html.replace("#INFORMACAO", infoRow);
  },

  async replaceRastreio(html, venda) {
    let query = await Venda.findOne({
      where: {
        idpedidovenda: venda["idpedidovenda"],
      },
      attributes: ["transportadora", "servico", "rastreio", "cpfcnpj", "numeronota"],
      raw: true,
    });

    let infoRow = "";

    let botaoRastreio = (await fs.readFile("src/emails/html/row_botao_rastreio.html")).toString();

    // Entrega via Correios
    if (query["transportadora"].includes("Correios")) {
      // Entrega correios possui botão de rastreio
      html = html.replace("#BOTAO_RASTREIO", botaoRastreio);

      infoRow = (await fs.readFile("src/emails/html/row_pedido_enviado_correios.html")).toString();

      if (query["servico"].includes("SEDEX")) {
        infoRow = infoRow.replace("#SERVIÇO", "Sedex");
      }

      if (query["servico"].includes("PAC")) {
        infoRow = infoRow.replace("#SERVIÇO", "PAC");
      }

      if (query["rastreio"]) {
        infoRow = infoRow.replace("#CODIGO", query["rastreio"]);
      }

      html = html.replace("#LINK_RASTREIO", "https://rastreamento.correios.com.br/app/index.php");
    }

    // Entrega via DLog
    if (query["transportadora"].includes("DLOG")) {
      // Entrega DLog possui botão de rastreio
      html = html.replace("#BOTAO_RASTREIO", botaoRastreio);

      infoRow = (await fs.readFile("src/emails/html/row_pedido_enviado_dlog.html")).toString();

      let linkRastreio = "";

      if (query["numeronota"]) {
        linkRastreio = `https://www.dlog.com.br/rastreamento/rastreio.php?cpfcnpj=${query["cpfcnpj"]}&nf=${query["numeronota"]}`;
      } else {
        linkRastreio = `https://www.dlog.com.br/rastreamento/rastreio.php?cpfcnpj=${query["cpfcnpj"]}`;
      }

      html = html.replace("#LINK_RASTREIO", linkRastreio);
    }

    // Entrega via Motoboy
    if (query["transportadora"].includes("Motoboy")) {
      // Entrega Motoboy não possui botão de rastreio
      html = html.replace("#BOTAO_RASTREIO", "");

      infoRow = (await fs.readFile("src/emails/html/row_pedido_enviado_motoboy.html")).toString();
    }

    html = html.replace("#RASTREIO", infoRow);

    return html;
  },

  // Rotina de Email
  async rotinaEmail(venda) {
    try {
      console.log(filename, `Pedido de Venda: ${venda.idpedidovenda} - Iniciando rotina de email`);

      // Verifica necessidade de envio de email
      let lojaEnviarEmail = ["203382852"]; //Bisbis

      // Verificação de data inicial
      // A sintaxe para a biblioteca Date é (AAAA, MM, DD)
      // A sintaxa de data do banco de dados é AAAA-MM-DD

      // Dia de início de envio dos emails
      const dataInicial = new Date(2021, 12, 29);

      // Separa a data de venda do banco de dados
      let dataVenda = venda["datavenda"].split("-");

      // Monta a data no formato Date()
      const dataPedido = new Date(dataVenda[0], dataVenda[1], dataVenda[2]);

      // Pedidos anteriores a data de início do envio de emails não devem receber emails
      if (dataPedido < dataInicial) {
        console.log(
          filename,
          `Pedido de Venda: ${venda.idpedidovenda} -`,
          "Não é necessário enviar email para este pedido: Data anterior a inicial."
        );
        return;
      }

      if (!lojaEnviarEmail.includes(venda.idloja)) {
        console.log(
          filename,
          `Pedido de Venda: ${venda.idpedidovenda} -`,
          `Não é necessário enviar email para este pedido: Loja não necessita de email`
        );
        return;
      }

      // Busca emails enviados relacionados ao pedido de venda recebido
      let emailsEnviados = await EmailEnviado.findAll({
        where: {
          idpedidovenda: venda.idpedidovenda,
        },
        include: [
          {
            model: Email,
            attributes: ["email"],
            required: true,
          },
        ],
        order: [
          ["idpedidovenda", "DESC"],
          ["idemail", "ASC"],
        ],
        raw: true,
      });

      // Desestrutura dados da query de emails enviados
      emailsEnviados = emailsEnviados.map((email) => email["idemail"]);

      // Relação de dependência entre emails
      // De acordo com o código do bling, diz quais emails precisam ter sido enviados

      // Lista para conter a relação de emails a serem disparados
      let dispararEmails = [];

      // Percorre cada uma das vendas verificando as dependencias
      let tabelaDependencia = {
        // Em Aberto
        6: [1],
        // Cancelado
        12: [1, 3],
        // Aguardando Impressão
        15005: [1, 2],
        //Em Separação
        14659: [1, 2, 4],
        // Aguardando Retirada
        22679: [1, 2, 4, 6],
        // Atendido - Verificação de método de entrega necessária
        9: venda.transportadora == "Retirada na Loja" ? [1, 2, 4, 6] : [1, 2, 4, 5],
      };

      // Recuperar lista de emails necessários a partir do status
      let emailsNecessarios = tabelaDependencia[venda.idstatusvenda];

      // Motivo dessa verificação:
      // Checar se o id do status do pedido de venda representa um registro na tabela de dependencia
      // Status não previstos entrarão no else, como "Só B.O", "Corporativo c/ pendência", etc.

      // Conseguimos recuperar emails necessários de serem enviados para este pedido de venda
      if (emailsNecessarios) {
        // Verifica se o email necessário nessa trilha já foi enviado
        for (const necessario of emailsNecessarios) {
          // Caso o email necessário não tenha sido enviado, acrescentar a lista de emails a serem enviados
          if (!emailsEnviados.includes(necessario)) {
            dispararEmails.push(necessario);
          }
        }
      } else {
        // Encontramos um id de status não previsto na tabela de dependencia
        console.log(
          `Pedido de Venda: ${venda.idpedidovenda} -`,
          `Status do pedido de de venda (ID Status: ${venda.idstatusvenda}) não previsto na tabela de dependência de emails`
        );
      }

      if (dispararEmails.length === 0) {
        console.log(
          filename,
          `Pedido de Venda: ${venda.idpedidovenda} -`,
          `Não é necessário enviar email para este pedido: Nenhum email necessário.`
        );
      }

      // Disparar Emails necessários
      let emailsEnviadosSucesso = [];

      // Passa por cada um dos emails que precisam ser enviados
      for (const idEmail of dispararEmails) {
        console.log(
          filename,
          `Pedido de Venda: ${venda.idpedidovenda} - Disparando email`,
          idEmail,
          "para o pedido",
          venda.idpedidovenda
        );

        // Realiza envio do email
        const emailEnviado = await this.enviarEmail(idEmail, venda);

        // Verificar se o email foi enviado com sucesso e guardar no banco
        if (emailEnviado) {
          emailsEnviadosSucesso.push({
            idpedidovenda: venda.idpedidovenda,
            idemail: idEmail,
          });
        }
      }

      // Após o envio dos emails, salvar no banco os emails que foram enviados com sucesso

      if (emailsEnviadosSucesso) {
        await EmailEnviado.bulkCreate(emailsEnviadosSucesso).catch((error) => {
          console.log(
            filename,
            `Pedido de Venda: ${venda.idpedidovenda}`,
            "Erro ao salvar registros de emails enviados no banco de dados:",
            error.message
          );
        });
      }
    } catch (error) {
      console.log(
        filename,
        `Pedido de Venda: ${venda.idpedidovenda}`,
        "Erro ao executar rotina de email:",
        error.message
      );
    }

    return true;
  },
};
