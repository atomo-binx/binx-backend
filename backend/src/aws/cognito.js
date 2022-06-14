const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { ErrorStatus, OkStatus, UserNotFound } = require("../modules/codes");

const client = new CognitoIdentityProviderClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.COGNITO_REGION,
});

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  /*
    A API do Cognito retorna os dados de usuários de maneira diferente para um usuário ou vários
    - Ao listar apenas um usuário, os dados do usuário estarão em um objeto chamado "UserAttributes"
    - Ao listar vários usuários, os dados dos usuários estarão em um objeto chamado "Attributes"

    Foi criado um método de construção de dicionário para desestruturar cada um dos retornos.

    Para a leitura de um único usuário, é passado como chave para o dicionário o valor "UserAttributes"
    Para a leitura de vários usuários, é passado como chave o valor "Attributes"
  */

  desestruturaUsuario(usuario, indiceAtributos) {
    const dicionario = this.dicionarioAtributos(usuario[indiceAtributos]);

    return {
      idusuario: dicionario["sub"],
      email: dicionario["email"],
      nome: dicionario["custom:displayname"],
      situacao: usuario["Enabled"],
    };
  },

  desestruturaUsuarios(usuarios, indiceAtributos) {
    let usuariosDesestruturados = [];

    for (const usuario of usuarios) {
      const dicionario = this.dicionarioAtributos(usuario[indiceAtributos]);

      usuariosDesestruturados.push({
        idusuario: dicionario["sub"],
        email: dicionario["email"],
        nome: dicionario["custom:displayname"],
        situacao: usuario["Enabled"],
      });
    }

    return usuariosDesestruturados;
  },

  desestruturaTokens(tokens) {
    const accessToken = tokens["AuthenticationResult"]["AccessToken"];
    const idToken = tokens["AuthenticationResult"]["IdToken"];
    const refreshToken = tokens["AuthenticationResult"]["RefreshToken"];

    return {
      accessToken,
      idToken,
      refreshToken,
    };
  },

  dicionarioAtributos(atributos) {
    let dicionario = {};

    for (const atributo of atributos) {
      dicionario[atributo["Name"]] = atributo["Value"];
    }

    return dicionario;
  },

  async lerUsuario(sub) {
    params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: sub,
    };

    const command = new AdminGetUserCommand(params);

    return client.send(command).then((result) => {
      const usuario = this.desestruturaUsuario(result, "UserAttributes");
      return usuario;
    });
  },

  async listarUsuarios() {
    return new Promise(async (resolve, reject) => {
      let usuarios = [];
      let procurando = true;
      let paginationToken = null;
      let error = null;

      // Obter lista completa de usuários do Cognito
      while (procurando) {
        const params = {
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          PaginationToken: paginationToken,
        };

        const command = new ListUsersCommand(params);

        await client
          .send(command)
          .then((result) => {
            const usuariosRetornados = this.desestruturaUsuarios(
              result["Users"],
              "Attributes"
            );

            usuarios.push(...usuariosRetornados);

            if (result["PaginationToken"]) {
              paginationToken = result["PaginationToken"];
            } else {
              procurando = false;
            }
          })
          .catch((err) => {
            console.log(filename, "Erro ao listar usuários:", err.message);
            procurando = false;
            error = err;
          });
      }

      if (error) {
        reject(err);
      } else {
        resolve(usuarios);
      }
    });
  },

  async cadastrarUsuario(email, displayname) {
    return new Promise((resolve, reject) => {
      const params = {
        // MessageAction: "SUPPRESS",
        DesiredDeliveryMediums: ["EMAIL"],
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
        UserAttributes: [
          {
            Name: "custom:displayname",
            Value: displayname || "",
          },
          {
            Name: "email_verified",
            Value: "True",
          },
          {
            Name: "email",
            Value: email,
          },
        ],
      };

      const command = new AdminCreateUserCommand(params);

      client
        .send(command)
        .then((result) => {
          const usuario = this.desestruturaUsuario(
            result["User"],
            "Attributes"
          );
          resolve(usuario);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  async login(email, password) {
    return new Promise((resolve, reject) => {
      const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      };

      const command = new InitiateAuthCommand(params);

      client
        .send(command)
        .then((result) => {
          const tokens = this.desestruturaTokens(result);
          resolve(tokens);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};
