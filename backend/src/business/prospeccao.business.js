const moment = require("moment");
const { Op } = require("sequelize");

const validarCnpj = require("../utils/cnpj");

// Models
const Prospeccao = require("../models/prospeccao.model");

// Helpers
const filename = __filename.slice(__dirname.length + 1) + " -";
const http = require("../utils/http");

module.exports = {
  // API - Criar um novo registro de prospecção
  async criarProspeccao(req) {
    try {
      if (req.body) {
        let {
          idusuario,
          empresa,
          contato,
          telefone,
          email,
          cnpj,
          vendedor,
          comentarios,
        } = req.body;

        // Limpar campos necessários contra caracteres inválidos
        if (cnpj) cnpj = cnpj.replace(/[^0-9]/g, "");
        if (telefone) telefone = telefone.replace(/[^0-9]/g, "");

        // Realiza verificação da prospecação
        let statusVerificacao = await this.verificaProspeccao({
          empresa,
          contato,
          telefone,
          email,
          cnpj,
          vendedor,
          comentarios,
        });

        // Caso a verificação tenha retornado algum resultado, a prospecção não é válida
        // A informação retornada é um objeto http, devolver ao Controller
        if (statusVerificacao) {
          return statusVerificacao;
        }

        // Caso nada tenha sido retornado da função de verificação, a prospecação é válida, e pode ser criada

        // Criar Prospecção
        await Prospeccao.create({
          idusuario,
          empresa,
          contato,
          telefone,
          email,
          cnpj,
          vendedor,
          comentarios,
        });

        return http.created({
          message: "Nova prospecção de cliente corporativo criada.",
        });
      } else {
        return http.badRequest({
          message:
            "Informe corretamente os atributos da prospecação através do body, em formato JSON",
        });
      }
    } catch (error) {
      console.log(filename, "Erro ao criar nova prospecção:", error.message);
      return http.failure({
        message: "Erro ao criar nova prospeccção:" + error.message,
      });
    }
  },

  // API - Atualizar uma prospecção existente
  async atualizarProspeccao(req) {
    try {
      console.log(filename, "Inici;ando atualização de prospeccao");
      if (req.body) {
        let { id, empresa, contato, telefone, email, cnpj, vendedor, comentarios } =
          req.body;

        // Limpar campos necessários contra caracteres inválidos
        if (cnpj) cnpj = cnpj.replace(/[^0-9]/g, "");
        if (telefone) telefone = telefone.replace(/[^0-9]/g, "");

        console.log("Objetos finais:");

        console.log(id, empresa, contato, telefone, email, cnpj, vendedor, comentarios);

        // Realiza verificação da prospecação
        let statusVerificacao = await this.verificaProspeccao({
          empresa,
          contato,
          telefone,
          email,
          cnpj,
          vendedor,
        });

        // Caso a verificação tenha retornado algum resultado, a prospecção não é válida
        // A informação retornada é um objeto http, devolver ao Controller
        if (statusVerificacao) {
          return statusVerificacao;
        }

        // Caso nada tenha sido retornado da função de verificação, a prospecação é válida

        // Atualizar a Prospecção com os novos dados
        await Prospeccao.update(
          {
            empresa,
            contato,
            telefone,
            email,
            cnpj,
            comentarios,
          },
          {
            where: {
              id: id,
            },
          }
        );

        return http.ok({
          message: "Prospecção atualizada com sucesso.",
        });
      } else {
        return http.badRequest({
          message:
            "Informe corretamente os atributos da prospecação através do body, em formato JSON",
        });
      }
    } catch (error) {
      console.log(filename, "Erro ao atualizar prospecção:", error.message);
      return http.failure({
        message: "Erro ao atualizar prospeccção:" + error.message,
      });
    }
  },

  // API - Validar um novo registro de prospecção para verificar se ele é permitido
  async validarProspeccao(req) {
    try {
      if (req.body) {
        let { empresa, contato, telefone, email, cnpj, vendedor, comentarios } = req.body;

        // Limpar campos necessários contra caracteres inválidos
        if (cnpj) cnpj = cnpj.replace(/[^0-9]/g, "");
        if (telefone) telefone = telefone.replace(/[^0-9]/g, "");

        // Realiza verificação da prospecação
        let statusVerificacao = await this.verificaProspeccao({
          empresa,
          contato,
          telefone,
          email,
          cnpj,
          vendedor,
          comentarios,
        });

        // Caso a verificação tenha retornado algum resultado, a prospecção não é válida
        // A informação retornada é um objeto http, devolver ao Controller
        if (statusVerificacao) {
          return statusVerificacao;
        }

        // Caso nada tenha sido retornado da função de verificação, a prospecação é válida
        // Informar ao usuário que a prospecção é válida e pode ser criada

        return http.ok({
          message: "A prospecção informada é válida, e pode ser criada.",
        });
      } else {
        return http.badRequest({
          message:
            "Informe corretamente os atributos da prospecação através do body, em formato JSON",
        });
      }
    } catch (error) {
      console.log(filename, "Erro ao validar prospecção:", error.message);
      return http.failure({ message: error.message });
    }
  },

  // API - Listar as prospecções existentes
  async listarProspeccoes(req, res) {
    try {
      console.log(filename, "Iniciando listagem de prospecções realizadas");

      if (!req.query.idusuario) {
        return http.badRequest({
          message: "Requisição realizada sem nenhum ID de usuário informado.",
        });
      }

      const idusuario = req.query.idusuario;

      // Lista de usuários que podem realizar a requisição de listagem completa
      const usersAdmin = [
        "471cd426-4050-4118-8ae7-b449f2ad7d40", // Felipe Marchesan
        "caa86543-b722-4a2f-ba4d-0ff84089b170", // Luscas Gusmão
        "e349fdc1-ce22-4707-8d6b-af06abab5386", // Rhenan Dias
        "dbb73324-e0ea-447a-ad7f-4dd2ecbb649c", // Hesley Lira
        "ee954c5b-6a1d-40be-b6f3-5bfde95df3ce", // Katia Suto
      ];

      // Verificar filtros para a busca da prospecção
      let dataInicial = req.query.inicio;
      let dataFinal = req.query.final;

      // Por padrão carregar prospecções do mês corrente
      if (!dataInicial && !dataFinal) {
        console.log("Padrão");
        dataInicial = moment().startOf("month").format("YYYY-MM-DD HH:mm:ss");
        dataFinal = moment().endOf("month").format("YYYY-MM-DD HH:mm:ss");
      } else {
        console.log("Personalizado");
        console.log("Valor recebido:", dataInicial, dataFinal);

        // Foram recebidas data inicial e final
        // Formatar as datas recebidas para o padrão do banco de dados

        dataInicial = moment(dataInicial, "YYYY-MM-DD")
          .startOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        dataFinal = moment(dataFinal, "YYYY-MM-DD")
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
      }

      console.log(filename, "Data Inicial:", dataInicial);
      console.log(filename, "Data Final:", dataFinal);

      // Parâmetro de listagem de usuário
      let whereParams = usersAdmin.includes(idusuario) ? {} : { idusuario };

      // Acrescenta parâmetro de filtro de data
      whereParams["createdAt"] = {
        [Op.between]: [dataInicial, dataFinal],
      };

      // Busca prospecções no banco de dados
      const prospeccoes = await Prospeccao.findAll({
        order: [["createdAt", "desc"]],
        where: whereParams,
        raw: true,
      });

      return http.ok({
        prospeccoes: prospeccoes,
      });
    } catch (error) {
      console.log(filename, "Erro ao listar prospecções:", error.message);
      return http.failure({
        message: error.message,
      });
    }
  },

  // Helper - Realiza verificação de prospecação contra as regras de negócio definidas
  async verificaProspeccao(prospeccao) {
    // A função de verificação roda uma verificação com os dados inseridos contra as regras de negócio
    // Caso a prospecação esbarre em uma regra, sua descrição será retornada
    // Caso a prospecação passe em todos os estágios de verificação, nada será retornado
    // Caso nada tenha sido retornado, considerar a prospecação como válida

    // Regras de negócio:

    // 1 - Reprovar prospecação com CNPJ duplicado
    //     Verificar validade da prospecação, validade de 90 dias irão expirar
    //     Prospecções expiradas podem ser adquiridas por outro vendedor
    // 2 - Em caso de Telefone ou Email duplicado, exigir CPNJ
    //     A prospecção será feita para quem fornecer o CPNJ válido
    // 3 - Caso o telefone ou email sejam duplicados, e o vendedor anterior foi o mesmo
    //     Então este vendedor irá manter a sua prospecação, pode escrever novamente

    // Procedimentos preparatórios
    let { empresa, contato, telefone, email, cnpj, vendedor } = prospeccao;

    // Verifica por requisitos obrigatórios
    let faltamRequisitos = false;

    if (!empresa || empresa.length === 0) faltamRequisitos = true;
    if (!contato || contato.length === 0) faltamRequisitos = true;
    if (!telefone || telefone.length === 0) faltamRequisitos = true;
    if (!email || email.length === 0) faltamRequisitos = true;
    if (!vendedor || vendedor.length === 0) faltamRequisitos = true;

    if (faltamRequisitos) {
      return http.badRequest({
        message:
          "Para realizar uma prospecção, é necessário preencher corretamente os campos de empresa, contato, telefone e e-mail.",
      });
    }

    // Caso tenha sido inserido um CNPJ, verificar se o mesmo é válido
    if (cnpj && cnpj.length > 0) {
      if (!validarCnpj.validarCNPJ(cnpj)) {
        return http.badRequest({
          message:
            "O CNPJ informado não é válido, favor inserir um CNPJ válido e tentar novamente.",
        });
      }
    }

    // Buscar prospecções existentes no banco de dados
    // CPF, Email e telefone iguais, desde que não sejam nulos ou vazios
    // Trazer prospecções que estejam dentro da validade de 90 dias
    let prospeccoes = await Prospeccao.findAll({
      where: {
        [Op.or]: [
          {
            cnpj: {
              [Op.eq]: cnpj,
              [Op.not]: null,
              [Op.not]: "",
            },
          },
          {
            email: {
              [Op.eq]: email,
              [Op.not]: null,
              [Op.not]: "",
            },
          },
          {
            telefone: {
              [Op.eq]: telefone,
              [Op.not]: null,
              [Op.not]: "",
            },
          },
        ],
        createdAt: {
          [Op.gt]: moment().subtract(90, "days"),
        },
      },
      raw: true,
    });

    // @Debug
    // console.log("Prospeccoes:", prospeccoes);

    // Verificar se já existe uma prospeção para este CNPJ
    if (cnpj && cnpj.length > 0 && vendedor && vendedor.length > 0) {
      for (const prospeccao of prospeccoes) {
        // Verifica por CNPJ duplicado, a menos que seja do mesmo vendedor
        if (prospeccao.cnpj === cnpj && prospeccao.vendedor !== vendedor) {
          let dataProspeccao = new Date(prospeccao.createdAt).toLocaleDateString("pt-BR");
          return http.ok({
            message: `Já existe uma prospecção realizada para o CNPJ informado, pelo vendedor: ${prospeccao.vendedor}, realizada no dia ${dataProspeccao}`,
          });
        }
      }
    }

    // 2 - Verificar se já existe uma prospecção com este email ou telefone

    // Caso o telefone já exista, exigir um CNPJ
    // A menos que o vendedor seja o mesmo, nesse caso ele pode ter cadastrado o CNPJ errado
    // Então é permitido a remoção do CNPJ existente
    if (telefone && telefone.length > 0) {
      for (const prospeccao of prospeccoes) {
        if (
          prospeccao.telefone === telefone &&
          (!cnpj || cnpj.length === 0) &&
          prospeccao.vendedor != vendedor
        ) {
          return http.ok({
            message:
              "Já existe uma prospecção realizada para este contato telefônico, favor informar um CNPJ válido.",
          });
        }
      }
    }

    // Caso o email já exista, exigir um CNPJ
    // A menos que o vendedor seja o mesmo, nesse caso ele pode ter cadastrado o CNPJ errado
    // Então é permitido a remoção do CNPJ existente
    if (email && email.length > 0) {
      for (const prospeccao of prospeccoes) {
        if (
          prospeccao.email === email &&
          (!cnpj || cnpj.length === 0) &&
          prospeccao.vendedor != vendedor
        ) {
          return http.ok({
            message:
              "Já existe uma prospecção cadastrada para este email, favor informar um CNPJ válido.",
          });
        }
      }
    }
  },
};
