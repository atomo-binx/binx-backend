const Produto = require("../models/produto.model");
const Bling = require("../bling/bling");
const axios = require("axios");

const filename = __filename.slice(__dirname.length + 1) + " -";
const { Op } = require("sequelize");

const frenetApi = axios.create({
  baseURL: "http://api.frenet.com.br",
  headers: { token: process.env.FRENET_TOKEN },
});

module.exports = {
  // Rotina de emergência, atualizar com cuidado
  // Foi criada para unificar o cálculo de frete para os metodos do FreteBot e do cálculo corporativo
  async calcularFrete(req) {
    try {
      console.log(
        filename,
        "Iniciando cálculo de frete para proposta comercial"
      );

      if (req.params.proposta) {
        const proposta = await Bling.propostaComercial(req.params.proposta);

        // console.log(filename, "Resultado da aquisição de proposta:", proposta);

        const resultado = await this.calcularFreteVenda(proposta);
        console.log(filename, "Resultado final:", resultado);

        return resultado;
      }
    } catch (error) {
      console.log(filename, "Erro ao calcular frete: ", error.message);
    }
  },

  // Funcionar primeiro, otimizar depois
  // Só funciona por enquanto para calculo de frete para a função de Callback de vendas
  // Foi escolhido forçadamente o "original" price e delivery time
  async calcularFreteVenda(venda) {
    // Modelo de função genérica, considerar que os dados foram desestruturados previamente
    try {
      const listaSkus = venda.itens.map((item) => item.idsku);

      let pesos = await Produto.findAll({
        attributes: ["idsku", "peso"],
        where: {
          idsku: {
            [Op.in]: listaSkus,
          },
        },
        raw: true,
      });

      // Verifica se algum peso foi retornado, não podemos prosseguir sem nenhum peso
      if (pesos.length === 0) {
        console.log(filename, "Nenhum peso encontrado no banco de dados.");
      }

      // A somatória dos pesos retornados não podem ser 0.0000 ou nulos
      let somatoriaPesos = 0;

      for (const item of pesos) {
        if (item.peso) {
          somatoriaPesos += parseFloat(item.peso);
        }
      }

      if (somatoriaPesos == 0) {
        console.log(filename, "A soma total dos pesos obtidos é igual a zero.");
      }

      // Os pesos obtidos do banco de dados não respeitam a mesma ordem da lista de SKUs
      // É necessário construir um "dicionario" em que a chave é o SKU, e o valor é o peso
      const dicionarioPesos = {};

      for (const peso of pesos) {
        dicionarioPesos[peso.idsku] = peso.peso;
      }

      // Verificar por pesos com valor zerado
      let possuiPesoZero = false;

      for (const peso of pesos) {
        if (peso.peso == 0) possuiPesoZero = true;
      }

      // Verifica se possui itens que não possuem SKU
      // Itens adicionados apenas para a proposta com SKU "NA" ou sem SKU não retornarão pesos
      for (const item of venda.itens) {
        if (
          !item["idsku"] ||
          item["idsku"] == "na" ||
          item["idsku"] == "NA" ||
          item["idsku"] == "N/A"
        ) {
          possuiPesoZero = true;
        }
      }

      // Adicionar dado de peso zero a resposta
      venda["possuiPesoZero"] = possuiPesoZero;

      // Agora que temos os pesos dos produtos, complementar a resposta da proposta desestruturada

      // Percorre a lista de itens na proposta desestrutura através de um índice
      for (const i in venda.itens) {
        // Adquire o SKU e a quantidade do item correspondente ao indice atual
        const skuAtual = venda.itens[i]["idsku"];
        const quantidade = venda.itens[i]["quantidade"];
        const pesoTotalItem = parseFloat(
          parseFloat(dicionarioPesos[skuAtual] * quantidade).toFixed(4)
        );

        // Configura na proposta desestrutura o peso unitário e o peso total
        venda.itens[i]["peso"] = dicionarioPesos[skuAtual] || 0;
        venda.itens[i]["pesoTotal"] = pesoTotalItem || 0;
      }

      // Após calcular o peso de cada produto, podemos calcular o peso total da proposta
      let pesoTotalProposta = 0;

      for (const item of venda.itens) {
        pesoTotalProposta += item["pesoTotal"];
      }

      pesoTotalProposta = parseFloat(pesoTotalProposta.toFixed(4));

      // Inserir o peso total na resposta
      venda["pesoTotalProposta"] = pesoTotalProposta;

      // Define um peso mínimo por item caso o peso total da proposta seja inferior a 300g
      if (parseFloat(pesoTotalProposta) < 0.3) {
        let quantidadeDeItens = venda.itens.reduce(
          (quantidadeDeItens, item) =>
            parseInt(quantidadeDeItens) + parseInt(item.quantidade),
          0
        );

        let pesoMinimoPorItem = 0.3 / quantidadeDeItens;

        pesoMinimoPorItem = parseFloat(pesoMinimoPorItem.toFixed(4));

        console.log({ quantidadeDeItens, pesoMinimoPorItem });

        // Agora com o peso mínimo, vamos redistribuir o peso de 300g entre os itens
        venda.itens.forEach((item) => {
          let hold = item;
          hold.peso = pesoMinimoPorItem;
          hold.pesoTotal = parseFloat(
            parseFloat(item.quantidade * pesoMinimoPorItem).toFixed(4)
          );
          item = hold;
        });

        console.log(venda.itens);

        // Recalcular também o peso total da proposta
        pesoTotalProposta = 0;

        for (const item of venda.itens) {
          pesoTotalProposta += item["pesoTotal"];
        }

        pesoTotalProposta = parseFloat(pesoTotalProposta.toFixed(4));

        venda["pesoTotalProposta"] = pesoTotalProposta;
      }

      // Próxima etapa, calcular o frete na API da Frenet

      // Construir Array de Itens e Pesos
      const ShippingItemArray = venda.itens
        .filter((item) => {
          return item.peso > 0;
        })
        .map((item) => {
          return {
            Quantity: item.quantidade,
            Weight: item.peso,
          };
        });

      console.log({ ShippingItemArray });

      // Filtrar dígitos do cep para deixar apenas números
      let cepLimpo = venda.cep.replace(/[^0-9]/g, "");
      // console.log(filename, "Cep alvo:", cepLimpo);
      venda.cep = cepLimpo;

      // Construir Body da requisição:
      const body = {
        SellerCEP: "07094000",
        RecipientCEP: cepLimpo,
        ShipmentInvoiceValue: venda.totalprodutos,
        ShippingItemArray: ShippingItemArray,
      };

      // Realiza chamada contra a API da Frenet
      const respostaFrenet = await frenetApi.post("/shipping/quote", body);

      // A API da Frenet não possui código de erro, apenas um campo chamado "message"
      // Verificar pelo campo de "message" para consultar erro na execução
      // if (respostaFrenet.data["Message"]) return;

      // Realizar desestruturação da resposta da API da Frenet
      // OBS: na API da Frenet está escrito errado mesmo "Sevices" ao inves de "Services"
      if (!respostaFrenet.data["Message"]) {
        const resultadosFrenet = respostaFrenet.data["ShippingSevicesArray"];

        const metodosFrete = [];

        for (const resultado of resultadosFrenet) {
          // A Frenet irá retornar dois valores de frete: original e sugerido
          // Para fretes em situação normal, o valor sugerido sera sempre maior que o original
          // Para fretes em situação de frete grátis, será o contrário
          // Nas vendas corporativas nunca será emitido frete grátis
          // Portanto, considerar sempre o maior valor retornado

          // Métodos que não retornaram erro
          if (!resultado["Error"]) {
            // Adquirir o maior valor de frete
            const OriginalShippingPrice = parseFloat(
              resultado["OriginalShippingPrice"]
            ).toFixed(2);

            const ShippingPrice = parseFloat(
              resultado["ShippingPrice"]
            ).toFixed(2);

            metodosFrete.push({
              transportadora: resultado["Carrier"],
              servico: resultado["ServiceDescription"],
              preco: Math.max(OriginalShippingPrice, ShippingPrice),
              prazo: parseInt(resultado["OriginalDeliveryTime"]),
            });
          } else {
            // Métodos que retornaram com erro

            // Realizar uma breve tratativa de erro para simplficar as menssagens
            let respostaErro = resultado["Msg"];

            // Remove pontos da resposta de erro
            respostaErro = respostaErro.replace(".", "");

            // Verifica resposta de erro para simplificação - PAC
            if (respostaErro.includes("ERP-007")) {
              respostaErro =
                "CEP de origem não pode postar para o CEP de destino";
            }

            metodosFrete.push({
              transportadora: resultado["Carrier"],
              servico: resultado["ServiceDescription"],
              erro: resultado["Error"],
              resposta: respostaErro,
            });
          }
        }

        //Debug
        // console.log(filename, "Objeto recebido para cálculo de frete:", venda);
        // console.log(filename, "Lista de SKUS:", listaSkus);
        // console.log(filename, "Proposta desestruturada:", propostaDesestruturada);
        // console.log(filename, "Dicionario de pesos:", dicionarioPesos);
        // console.log(filename, "Peso total da proposta:", pesoTotalProposta);
        // console.log(filename, "Requisição enviada a Frenet:", body);
        // console.log(filename, "Resposta Frenet:\n", respostaFrenet.data);
        // console.log(filename, "Métodos de frete:", metodosFrete);

        // Inserir a resposta da Frenet na resposta final
        venda["frete"] = metodosFrete;

        return {
          status: true,
          resposta: venda,
        };
      } else {
        venda["frete"] = [];

        return {
          status: true,
          resposta: venda,
        };
      }
    } catch (error) {
      console.log(
        filename,
        "Erro ao processar pedido de cálculo de frete:",
        error.message
      );
    }
  },
};
