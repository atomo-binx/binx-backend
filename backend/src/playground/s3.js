const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config({ path: "../../.env" });

const path = require("path");

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

async function rotina() {
  return new Promise((resolve, reject) => {
    const file = "./placeholder.jpg";
    const fileStream = fs.createReadStream(file);

    let data = new Date().toLocaleString("pt-BR") + ".png";
    data = data.replace("/", "_");
    data = data.replace("/", "_");

    const params = {
      Bucket: process.env.AWS_S3_URL,
      Key: "Binx/" + data,
      Body: fileStream,
    };

    const command = new PutObjectCommand(params);

    client
      .send(command)
      .then((response) => {
        console.log("Sucesso ao enviar objeto");
        resolve();
      })
      .catch((error) => {
        console.log("Falha ao enviar objeto:", error.message);
        reject();
      });
  });
}

rotina();
