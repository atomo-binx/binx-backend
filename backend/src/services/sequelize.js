const Sequelize = require("sequelize");

// dbConfigurações para a conexão do Sequelize ao Banco de Dados
const dbConfig = {
  host: process.env.DB_HOST_NAME,
  dialect: "mysql",
  // logging: console.log,
  logging: false,
  pool: {
    max: 20,
    min: 0,
    idle: 10000,
    acquire: 60000,
  },
};

// Cria Instância de Conexão com o Banco de Dados
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER_NAME,
  process.env.DB_PASSWORD,
  dbConfig
);

module.exports = sequelize;
