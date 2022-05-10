const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const client = new SESClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.COGNITO_REGION,
});

const filename = __filename.slice(__dirname.length + 1) + " -";

module.exports = {
  async enviar(remetente, destinatario, assunto, html) {
    return new Promise((resolve, reject) => {
      // Parâmetros para envio de email pela API do SES
      const params = {
        Source: remetente,
        Destination: {
          ToAddresses: destinatario,
          // BccAddresses: ["debug@baudaeletronica.com.br"]
        },
        Message: {
          Subject: {
            Data: assunto,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: "Não foi possível carregar este conteúdo, atualize a página e tente novamente.",
              Charset: "UTF-8",
            },
            Html: {
              Data: html,
              Charset: "UTF-8",
            },
          },
        },
      };

      // Monta o comando de disparo de email
      const command = new SendEmailCommand(params);

      // Envia o comando de email
      client
        .send(command)
        .then((response) => {
          resolve();
        })
        .catch((error) => {
          console.log(filename, "Não foi possível realizar o envio do email:", error.message);
          reject(error);
        });
    });
  },
};
