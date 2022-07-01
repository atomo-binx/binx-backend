const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: "../../.env" });

const filename = __filename.slice(__dirname.length + 1) + " -";
const delay = require("../utils/delay").delay;

const url = "https://bling.com.br/Api/v2";
const api = axios.create({ baseURL: url });
const { replaceAll, manterApenasNumeros } = require("../utils/replace");

const crypto = require("crypto");

const situacoes = {
  "Em aberto": 6,
  Atendido: 9,
  Cancelado: 12,
  "Em andamento": 15,
  "Venda Agenciada": 18,
  "Em digitação": 21,
  Verificado: 24,
  "Aguardando PLP": 14613,
  "Em separação": 14659,
  "Só B.Ó": 14697,
  "Corporativo com Pendência": 14716,
  "Aguardando impressão": 15005,
  "Pedido Retornado": 18542,
  "Balcão/Televendas Impressão": 20386,
  "Aguardando Retirada": 22679,
  "Aguardando vendedor": 58173,
  "Aguardando Produto": 58246,
  "Aguardando importação": 58901,
  "Situação Não Encontrada": 99999,
};

const categorias = {
  "Sem Categoria": 0,
  Acessórios: 1,
  Componentes: 2,
  Ferramentas: 3,
  Motores: 4,
  Maker: 5,
};

module.exports = {
  // Desestrutura os dados importantes de um pedido de venda
  desestruturaPedidoVenda(venda) {
    try {
      // Variáveis que dependem de lógica e regras para serem desestruturadas
      let idformapagamento = null;
      let formapagamento = "";
      let objFormaPagamento = null;
      let transportadora = "";
      let rastreio = "";
      let servico = "";
      let idpedidoloja = "";
      let vendedor = "";
      let numeronota = "";
      let serienota = "";
      let datanota = null;
      let fretecliente = null;
      let numeroproposta = "";
      let endereco = "";
      let cep = "";
      let rua = "";
      let numero = "";
      let bairro = "";
      let cidade = "";
      let uf = "";
      let itens = [];

      // Verifica se o pedido possui um vendedor
      if (Object.prototype.hasOwnProperty.call(venda, "vendedor")) {
        vendedor = venda["vendedor"];
      }

      // Verifica se o pedido possui uma nota fiscal
      if (Object.prototype.hasOwnProperty.call(venda, "nota")) {
        numeronota = venda["nota"]["numero"];
        serienota = venda["nota"]["serie"];
        datanota = venda["nota"]["dataEmissao"];
      }

      // Verifica se o pedido possui um número de ligação com alguma loja
      if (Object.prototype.hasOwnProperty.call(venda, "numeroPedidoLoja")) {
        idpedidoloja = venda["numeroPedidoLoja"];
      }

      // Verifica se o pedido possui uma forma de pagamento associada
      if (Object.prototype.hasOwnProperty.call(venda, "parcelas")) {
        let pagamento = venda["parcelas"][0]["parcela"]["forma_pagamento"];

        idformapagamento = pagamento["id"];
        formapagamento = pagamento["descricao"];

        objFormaPagamento = {
          idformapagamento: pagamento["id"],
          descricao: pagamento["descricao"],
        };
      }

      // Verifica se o pedido possui um método de transporte associado
      // O campo de transporte é fixo, e sempre irá existir independente da loja do pedido
      if (Object.prototype.hasOwnProperty.call(venda, "transporte")) {
        // Verifica se o pedido possui uma transportadora associada
        transportadora = venda["transporte"]["transportadora"];

        // Caso exista um volume, existe um código de rastreio e um serviço de entrega
        if (Object.prototype.hasOwnProperty.call(venda.transporte, "volumes")) {
          rastreio =
            venda["transporte"]["volumes"][0]["volume"]["codigoRastreamento"];

          servico = venda["transporte"]["volumes"][0]["volume"]["servico"];
        }

        // Caso exista um endereço de entrega, podemos acessa-lo
        if (
          Object.prototype.hasOwnProperty.call(
            venda.transporte,
            "enderecoEntrega"
          )
        ) {
          // Salva o Endereço de Entrega
          rua = venda["transporte"]["enderecoEntrega"]["endereco"];
          numero = venda["transporte"]["enderecoEntrega"]["numero"];
          bairro = venda["transporte"]["enderecoEntrega"]["bairro"];
          cidade = venda["transporte"]["enderecoEntrega"]["cidade"];
          uf = venda["transporte"]["enderecoEntrega"]["uf"];

          // Monta endereço
          endereco = `${rua} - ${numero} - ${bairro} - ${cidade} - ${uf}`;

          // Salva o CEP de Entrega
          cep = venda["transporte"]["enderecoEntrega"]["cep"];
        } else {
          // Já o campo de endereço de entrega não irá existir em todos os pedidos
          // Detectado essa situação com pedidos corporativo e televendas
          // Caso o pedido não tenha os dados de entrega, pegar dos dados do campo do cliente
          rua = venda["cliente"]["endereco"];
          numero = venda["cliente"]["numero"];
          bairro = venda["cliente"]["bairro"];
          cidade = venda["cliente"]["cidade"];
          uf = venda["cliente"]["uf"];

          // Monta endereço
          endereco = `${rua} - ${numero} - ${bairro} - ${cidade} - ${uf}`;

          // Salva o CEP de Entrega
          cep = venda["cliente"]["cep"];
        }
      }

      // Verifica se o pedido possui um valor de frete associado
      if (Object.prototype.hasOwnProperty.call(venda, "valorfrete")) {
        fretecliente = venda["valorfrete"];
      }

      // Realiza desestruturação dos itens presentes no pedido de venda
      if (venda["itens"]) {
        for (const item of venda["itens"]) {
          // Verificar se o item está retornando do Bling com SKU válido
          // Caso o item retorne com SKU "null" por algum motivo do Bling, ignorar
          if (
            item["item"]["codigo"] !== "null" &&
            item["item"]["codigo"] != null
          ) {
            itens.push({
              idsku: item["item"]["codigo"],
              idpedidovenda: venda["numero"],
              quantidade: parseInt(item["item"]["quantidade"]),
              nome: item["item"]["descricao"],
              valorunidade: item["item"]["valorunidade"],
            });
          }
        }
      }

      // Verifica se o pedido possui um número de proposta comercial associado
      if (Object.prototype.hasOwnProperty.call(venda, "origem")) {
        if (
          Object.prototype.hasOwnProperty.call(
            venda.origem,
            "propostaComercial"
          )
        ) {
          numeroproposta =
            venda["origem"]["propostaComercial"]["numeroProposta"];
        }
      }

      // Realiza desestruturação das ocorrências no pedido de venda
      let ocorrencias = [];

      if (Object.prototype.hasOwnProperty.call(venda, "ocorrencias")) {
        for (const ocorrencia of venda["ocorrencias"]) {
          ocorrencias.push({
            idpedidovenda: venda["numero"],
            datapedido: ocorrencia["ocorrencia"]["dataCriacaoPedido"],
            dataocorrencia: ocorrencia["ocorrencia"]["data"],
            ocorrencia: ocorrencia["ocorrencia"]["ocorrencia"],
            situacao: ocorrencia["ocorrencia"]["situacao"],
          });
        }
      }

      // Monta um objeto que representa o pedido de venda
      const dadosVenda = {
        idpedidovenda: venda["numero"],
        datavenda: venda["data"],
        idloja: venda["loja"],
        idstatusvenda:
          situacoes[venda["situacao"]] || situacoes["Situação Não Encontrada"],
        cliente: venda["cliente"]["nome"],
        totalprodutos: venda["totalprodutos"],
        totalvenda: venda["totalvenda"],
        desconto: venda["desconto"],
        fretecliente,
        itens,
        email: venda["cliente"]["email"],
        cpfcnpj: venda["cliente"]["cnpj"],
        idpedidoloja,
        idformapagamento,
        formapagamento,
        transportadora,
        rastreio,
        servico,
        endereco,
        cep,
        vendedor,
        numeronota,
        serienota,
        datanota,
        rua,
        numero,
        bairro,
        cidade,
        uf,
        numeroproposta,
        ocorrencias,
        objFormaPagamento,
      };

      // Retorna o objeto final que representa o pedido de venda
      return dadosVenda;
    } catch (error) {
      console.log(
        filename,
        `Erro ao desestruturar o pedido: ${venda["numero"]}`
      );

      if (error.message) {
        console.log(filename, "Mensagem de erro:", error.message);
      }

      return null;
    }
  },

  // Desestrutura os dados importantes de um pedido de compra
  desestruturaPedidoCompra(compra) {
    try {
      // Realiza desestruturação dos itens presentes no pedido de compra
      let itens = [];

      for (const item of compra["itens"]) {
        // Verificar se o item está retornando do Bling com SKU válido
        // Caso o item retorne com SKU "null" por algum motivo do Bling, ignorar
        if (
          item["item"]["codigo"] !== "null" &&
          item["item"]["codigo"] != null
        ) {
          itens.push({
            idpedidocompra: compra["numeropedido"],
            idsku: item["item"]["codigo"],
            produto: item["item"]["descricao"],
            quantidade: item["item"]["qtde"],
            valor: item["item"]["valor"],
          });
        }
      }

      // TODO: verificar itens duplicados na estrutura de um pedido de compra

      // Desestrutura dados do fornecedor
      const idfornecedor = compra["fornecedor"]["id"];
      const nomefornecedor = compra["fornecedor"]["nome"];

      // Monta um objeto que representa o pedido de venda
      const dadosCompra = {
        idpedidocompra: compra["numeropedido"],
        idfornecedor: compra["fornecedor"]["id"],
        datacriacao: compra["datacompra"],

        dataprevista: compra["dataprevista"] || null,

        fornecedor: {
          idfornecedor,
          nomefornecedor,
        },

        itens,
      };

      // Retorna o objeto final que representa o pedido de venda
      return dadosCompra;
    } catch (error) {
      console.log(
        filename,
        `Erro ao desestruturar o pedido: ${compra["numeropedido"]}`
      );

      if (error.message) {
        console.log(filename, "Mensagem de erro:", error.message);
      }

      return null;
    }
  },

  // Desestrutura os dados importantes de uma proposta comercial
  desestruturaProposta(proposta) {
    try {
      // Desestrutura itens da proposta comercial
      let itens = [];

      if (proposta["itens"]) {
        for (const item of proposta.itens) {
          itens.push({
            idsku: item.item.codigo,
            nome: item.item.descricao,
            quantidade: parseInt(item.item.quantidade),
            valorUnidade: item.item.valorUnidade,
            precoLista: item.item.precoLista,
            descontoItem: item.item.descontoItem,
          });
        }
      }

      const propostaDesestruturada = {
        numeroProposta: proposta["numeroProposta"],
        situacao: proposta["situacao"],
        vendedor: proposta["vendedor"],
        totalprodutos: proposta["subtotal"],
        frete: proposta["fretecliente"],
        total: proposta["totalOrcamento"],
        cliente: proposta.cliente["nome"],
        endereco: proposta.cliente["endereco"],
        numero: proposta.cliente["numero"],
        complemento: proposta.cliente["complemento"],
        cidade: proposta.cliente["cidade"],
        bairro: proposta.cliente["bairro"],
        cep: proposta.cliente["cep"],
        uf: proposta.cliente["uf"],
        itens: itens,
      };

      return propostaDesestruturada;
    } catch (error) {
      console.log(
        filename,
        `Erro ao desestruturar proposta comercial ${proposta["numeroProposta"]}:`,
        error.message
      );

      return null;
    }
  },

  // Desestrutura dados importantes de um produto
  desestruturaProduto(produto) {
    try {
      let estrutura = [];
      let formato = "Simples";

      // Realiza desestruturação dos depósitos para o produto
      const depositos = this.desestruturaDepositos(produto);

      // Verifica desestruturação de itens com estrutura
      if (Object.prototype.hasOwnProperty.call(produto, "estrutura")) {
        formato = "Com Composição";

        for (const componente of produto["estrutura"]) {
          let filho = {
            skupai: produto["codigo"].toString(),
            skufilho: componente["componente"]["codigo"].toString(),
            quantidade: parseInt(componente["componente"]["quantidade"]),
          };

          estrutura.push(filho);
        }
      }

      // Monta produto desestruturado
      const produtoDesestruturado = {
        idsku: produto["codigo"] || "",
        nome: produto["descricao"] || "",
        precovenda: produto["preco"] || 0,
        situacao: produto["situacao"] == "Ativo" ? true : false,
        idcategoria:
          categorias[produto["observacoes"]] || categorias["Sem Categoria"],
        depositos: depositos,
        peso: produto["pesoBruto"] || 0,
        localizacao: produto["localizacao"] || "",
        custo: produto["precoCusto"],

        formato,
        estrutura,
      };

      // Retornar apenas produtos que não estejam com SKU vazios
      // O SKU será a chave primária do produto, deve ser único e não nulo
      if (produto.idsku != "") {
        return produtoDesestruturado;
      } else {
        return null;
      }
    } catch (error) {
      console.log(
        filename,
        `Erro ao desestruturar o produto ${produto["codigo"]}:`,
        error.message
      );

      return null;
    }
  },

  // Desestrutura os dados de depósito, montando o objeto de Produto-Depósito
  desestruturaDepositos(produto) {
    const objetoDepositos = [];

    // Verifica se o produto possui depósitos associados
    // O Bling sempre irá retornar uma propriedade chamada "depositos"
    // Quando o produto não possuir depósitos associados, ela será "null"
    if (produto["depositos"]) {
      const depositos = produto["depositos"];

      for (const deposito of depositos) {
        objetoDepositos.push({
          idestoque: deposito["deposito"]["id"],
          idsku: produto["codigo"],
          quantidade: deposito["deposito"]["saldoVirtual"],
        });
      }
    }

    return objetoDepositos;
  },

  desestruturaContato(contato) {
    // Dados que necessitam de lógica para extração
    let cpfcnpj = "";
    let ierg = "";
    let cep = "";
    let telefone = "";
    let celular = "";

    // Remover caracteres especiais do CPF/CNPJ
    if (contato.cnpj) {
      cpfcnpj = manterApenasNumeros(contato.cnpj);
    }

    // Remover caracteres especiais da Inscrição Estadual
    if (contato.ie_rg) {
      ierg = manterApenasNumeros(contato.ie_rg);
    }

    // Remover caracteres especiais do CEP
    if (contato.cep) {
      cep = manterApenasNumeros(contato.cep);
    }

    // Remover caracteres especiais do Telefone
    if (contato.fone) {
      telefone = manterApenasNumeros(contato.fone);
    }

    // Remover caracteres especiais do Celular
    if (contato.celular) {
      celular = manterApenasNumeros(contato.celular);
    }

    return {
      idcontato: contato.id,
      nome: contato.nome,
      fantasia: contato.fantasia,
      tipo: contato.tipo,
      cpfcnpj: cpfcnpj,
      ierg: ierg,
      endereco: contato.endereco,
      numero: contato.numero,
      bairro: contato.bairro,
      cep: cep,
      cidade: contato.cidade,
      complemento: contato.complemento,
      uf: contato.uf,
      telefone: telefone,
      celular: celular,
      email: contato.email,
      situacao: contato.situacao,
      contribuinte: contato.contribuinte,
      vendedor: contato.nomeVendedor,
      dataalteracao: contato.dataAlteracao,
      datainclusao: contato.dataInclusao,
      clientedesde: contato.clienteDesde,
      limitecredito: contato.limiteCredito,
    };
  },

  // Rotina para política de tentativa de chamada ao Bling
  async blingRequest(metodo, caminho, params) {
    return new Promise(async (resolve, reject) => {
      try {
        // Parâmetros para a política de try/catch
        let tentativa = 1;
        let maxTentativas = 10;
        let rodando = true;
        let tempo = 1000;

        // Gerar um hash aleatório para facilitar a identificação da rotina em debug
        let hash = crypto.randomBytes(3).toString("hex");
        console.log(
          filename,
          `Hash: ${hash} - ${metodo} - Caminho: ${caminho}`
        );

        // Função para a tratativa dos códigos de erro
        const statusCodeError = (codigo, hash, tentativa) => {
          // Too Many Requests
          if (codigo === 429) {
            console.log(
              filename,
              `Hash: ${hash} - Too Many Requests - Tentativa ${tentativa}`
            );
          }
        };

        do {
          // Número de tentativas dentro do permitido
          if (tentativa < maxTentativas && rodando) {
            switch (metodo) {
              case "GET":
                await api
                  .get(caminho, params)
                  .then((result) => {
                    resolve(result);
                    rodando = false;
                  })
                  .catch((error) => {
                    statusCodeError(error.response.status, hash, tentativa);
                  });
                break;
              case "POST":
                await api
                  .post(caminho, params)
                  .then((result) => {
                    resolve(result);
                    rodando = false;
                  })
                  .catch((error) => {
                    statusCodeError(error.response.status, hash, tentativa);
                  });
                break;
              case "PUT":
                await api
                  .put(caminho, params)
                  .then((result) => {
                    resolve(result);
                    rodando = false;
                  })
                  .catch((error) => {
                    statusCodeError(error.response.status, hash, tentativa);
                  });
                break;
              default:
                console.log(filename, "O método HTTP informado é inválido");
                rodando = false;
                reject();
                break;
            }
          }

          // Iniciar uma nova tentativa
          if (tentativa++ < maxTentativas) {
            await delay(tempo);
          }

          // Verificação por tentativas excedidas
          if (tentativa >= maxTentativas) {
            console.log(
              filename,
              `Panic - Hash: ${hash} - Número máximo de tentativas excedido`
            );
            rodando = false;
          }
          // Tentativas excedidas ou obteve sucesso na execução
        } while (rodando);
      } catch (error) {
        console.log(error.message);
        reject(error);
      }
    });
  },

  // Adquire dados de um produto da API do Bling
  async produto(sku) {
    return new Promise((resolve, reject) => {
      this.blingRequest("GET", `/produto/${sku}/json/`, {
        params: {
          apikey: process.env.BLING_API_KEY,
        },
      })
        .then((result) => {
          if (result["retorno"]["erros"]) {
            reject({
              message: "Produto não encontrado.",
            });
          } else {
            // Produto encontrado, desestruturar os dados
            let produto = this.desestruturaProduto(
              result["retorno"]["produtos"][0]["produto"]
            );

            // Retornar o produto desestruturado
            resolve(produto);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de produto na na API do Bling:",
            error.message
          );
          reject();
        });
    });
  },

  // Busca pedido de venda no Bling
  async pedidoVenda(pedido) {
    return new Promise((resolve, reject) => {
      this.blingRequest("GET", `/pedido/${pedido}/json/`, {
        params: {
          apikey: process.env.BLING_API_KEY,
          historico: "true",
        },
      })
        .then(async (res) => {
          try {
            // A API do Bling retornou um erro, o pedido especificado não foi encontrado
            const erroBling = res.data.retorno.erros[0].erro.cod;

            console.log(
              filename,
              "Erro do Bling encontrado durante a aquisição de pedido de venda:",
              erroBling
            );

            if (erroBling == 14) {
              console.log(
                filename,
                "Nenhum pedido encontrado para o número:",
                pedido
              );
            } else {
              console.log(
                filename,
                "Erro inesperado, para mais informações consultar a documentação da API do Bling."
              );
            }

            reject({
              message: "Falha na aquisição de pedido de venda na API do Bling",
            });
          } catch (error) {
            // A API do Bling retornou um pedido válido
            const dadosVenda = res.data.retorno.pedidos[0].pedido;

            // Desestrutura um pedido recebido do bling
            const venda = this.desestruturaPedidoVenda(dadosVenda);

            resolve(venda);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de pedido de venda na API do Bling"
          );
          console.log(filename, error.message);
          reject();
        });
    });
  },

  // Busca pedido de compra no Bling
  async pedidoCompra(pedido) {
    return new Promise((resolve, reject) => {
      this.blingRequest("GET", `/pedidocompra/${pedido}/json/`, {
        params: {
          apikey: process.env.BLING_API_KEY,
        },
      })
        .then(async (res) => {
          try {
            // A API do Bling retornou um erro, o pedido especificado não foi encontrado
            const erroBling = res.data.retorno.erros[0].erro.cod;

            console.log(
              filename,
              "Erro do Bling encontrado durante a aquisição de pedido de compra:",
              erroBling
            );

            if (erroBling == 14) {
              console.log(
                filename,
                "Nenhum pedido de compra encontrado para o número:",
                pedido
              );
            } else {
              console.log(
                filename,
                "Erro inesperado, para mais informações consultar a documentação da API do Bling."
              );
            }

            reject({
              message: "Falha na aquisição de pedido de compra na API do Bling",
            });
          } catch (error) {
            // A API do Bling retornou um pedido válido
            const dadosCompra = res.data.retorno.pedidoscompra[0].pedidocompra;

            // Desestrutura um pedido recebido do bling
            const compra = this.desestruturaPedidoCompra(dadosCompra);

            resolve(compra);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de pedido de compra na API do Bling:",
            error.message
          );
          reject();
        });
    });
  },

  // Busca uma única página de pedidos de venda do Bling
  async listaPaginaVendas(pagina, filtros) {
    return new Promise((resolve, reject) => {
      let vendas = [];

      this.blingRequest("GET", `/pedidos/page=${pagina}/json/`, {
        params: {
          filters: filtros,
          apikey: process.env.BLING_API_KEY,
          historico: "true",
        },
      })
        .then((res) => {
          try {
            // A API do Bling retornou um erro, ou chegamos no fim da página ou algo deu errado
            const erroBling = res.data.retorno.erros[0].erro.cod;

            console.log(filename, "Erro Bling Encontrado:", erroBling);

            if (erroBling == 14) {
              console.log(
                filename,
                "Última página de vendas encontrada:",
                pagina - 1
              );
            } else {
              console.log(
                filename,
                "Erro inesperado encontrado, verifique a documentação da API do Bling para mais detalhes."
              );
            }
          } catch (error) {
            // A API do Bling retornou uma página válida, continuar a busca
            console.log(
              filename,
              "Página de pedidos de venda encontrada:",
              pagina
            );

            // Desestrutura um pedido recebido do bling
            for (const pedido of res.data.retorno.pedidos) {
              const venda = this.desestruturaPedidoVenda(pedido["pedido"]);
              vendas.push(venda);
            }

            resolve(vendas);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de pedidos de venda na api do Bling"
          );
          console.log(filename, error.message);
          reject({
            message: error.message,
          });
        });
    });
  },

  // Busca uma única página de pedidos de venda do Bling
  async listaPaginaCompras(pagina, filtros) {
    return new Promise((resolve, reject) => {
      let compras = [];

      this.blingRequest("GET", `/pedidoscompra/page=${pagina}/json/`, {
        params: {
          filters: filtros,
          apikey: process.env.BLING_API_KEY,
        },
      })
        .then((res) => {
          try {
            // A API do Bling retornou um erro, ou chegamos no fim da página ou algo deu errado
            const erroBling = res.data.retorno.erros[0].erro.cod;

            console.log(filename, "Erro Bling Encontrado:", erroBling);

            if (erroBling == 14) {
              console.log(
                filename,
                "Última página de compras encontrada:",
                pagina - 1
              );
            } else {
              console.log(
                filename,
                "Erro inesperado encontrado, verifique a documentação da API do Bling para mais detalhes."
              );
            }
          } catch (error) {
            // A API do Bling retornou uma página válida, continuar a busca
            console.log(
              filename,
              "Página de pedidos de compra encontrada:",
              pagina
            );

            // Desestrutura um pedido recebido do bling
            // OBS: O retorno dos pedidos de compra é diferente da rotina para pedidos de venda
            // Na rota de pedidos de compra, é retornada uma Array a mais
            for (const pedido of res.data.retorno.pedidoscompra[0]) {
              const compra = this.desestruturaPedidoCompra(
                pedido["pedidocompra"]
              );
              compras.push(compra);
            }

            resolve(compras);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de pedidos de compra na api do Bling"
          );
          console.log(filename, error.message);
          reject({
            message: error.message,
          });
        });
    });
  },

  // Lista uma única página de produtos do Bling
  async listaPaginaProdutos(pagina, filtros) {
    return new Promise((resolve, reject) => {
      let produtos = [];

      let params = {
        apikey: process.env.BLING_API_KEY,
        estoque: "S",
        filters: filtros,
      };

      this.blingRequest("GET", `/produtos/page=${pagina}/json`, {
        params: params,
      })
        .then((res) => {
          try {
            // A API do Bling retornou um erro, ou chegamos no fim da página ou algo deu errado
            const erroBling = res.data.retorno.erros[0].erro.cod;
            console.log(filename, "Erro Bling Encontrado:", erroBling);

            if (erroBling == 14) {
              console.log(
                filename,
                "Última página de produtos encontrada:",
                pagina - 1
              );

              resolve(produtos);
            } else {
              console.log(filename, "Erro inesperado retornado do Bling");
              reject();
            }
          } catch (error) {
            // A API do Bling retornou uma página válida, continuar a busca
            console.log(filename, `Página de produtos encontrada:`, pagina);

            const paginaProdutos = res.data.retorno.produtos;

            // Desestrutura cada um dos produtos retornados da página e insere na lista de produtos
            for (const produto of paginaProdutos) {
              const produtoDesestruturado = this.desestruturaProduto(
                produto["produto"]
              );

              if (produto) {
                produtos.push(produtoDesestruturado);
              }
            }

            console.log(
              filename,
              "Total de produtos encontrados:",
              produtos.length
            );

            resolve(produtos);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de produtos na api do Bling:",
            error.message
          );
          reject(error);
        });
    });
  },

  // Atualiza o status de um pedido no Bling
  async atualizaStatusPedido(pedido, status) {
    return new Promise((resolve, reject) => {
      let xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <pedido>
      <idSituacao>${status}</idSituacao>
      </pedido>
      `;

      let params = {
        apikey: process.env.BLING_API_KEY,
        xml: xml,
      };

      this.blingRequest("PUT", `/pedido/${pedido}`, new URLSearchParams(params))
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // Busca dados de uma proposta comercial
  async propostaComercial(proposta) {
    return new Promise((resolve, reject) => {
      this.blingRequest("GET", `/propostacomercial/${proposta}/json/`, {
        params: {
          apikey: process.env.BLING_API_KEY,
        },
      })
        .then((res) => {
          try {
            // A API do Bling retornou um erro, a proposta comercial especificada não foi encontrada
            const erroBling = res.data.retorno.erros[0].erro.cod;
            console.log(filename, "Erro Bling Encontrado:", erroBling);

            if (erroBling == 14) {
              console.log(
                filename,
                "Nenhuma proposta comercial encontrada para o número:",
                proposta
              );
              reject(res.data.retorno.erros[0].erro.msg);
            } else {
              console.log(filename, "Erro inesperado encontrado ...");
              reject(res.data.retorno.erros[0].erro.msg);
            }
          } catch (error) {
            // A API do Bling retornou uma proposta válida
            const propostaAtual =
              res.data.retorno.propostascomerciais[0].propostacomercial;

            // Desestrutura uma proposta comercial do bling
            const propostaDesestruturada =
              this.desestruturaProposta(propostaAtual);

            resolve(propostaDesestruturada);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de proposta comercial na api do Bling"
          );
          console.log(filename, error.message);
          reject(error.message);
        });
    });
  },

  async listaPaginaContatos(filtros, pagina = 1) {
    return new Promise((resolve, reject) => {
      this.blingRequest("GET", `/contatos/page=${pagina}/json/`, {
        params: {
          apikey: process.env.BLING_API_KEY,
        },
        filters: filtros,
      })
        .then((res) => {
          try {
            const erroBling = res.data.retorno.erros[0].erro.cod;
            console.log(filename, "Erro Bling Encontrado:", erroBling);

            if (erroBling == 14) {
              console.log(filename, "Falha na listagem de contatos");
              reject(res.data.retorno.erros[0].erro.msg);
            } else {
              console.log(filename, "Erro inesperado encontrado ...");
              reject(res.data.retorno.erros[0].erro.msg);
            }
          } catch (error) {
            let resultados = [];

            const contatos = res.data.retorno.contatos;

            for (const contato of contatos) {
              resultados.push(this.desestruturaContato(contato.contato));
            }

            console.log(
              filename,
              "Total de contatos encontrados:",
              resultados.length
            );

            resolve(resultados);
          }
        })
        .catch((error) => {
          console.log(
            filename,
            "Erro na requisição de proposta comercial na api do Bling"
          );
          console.log(filename, error.message);
          reject(error.message);
        });
    });
  },
};
