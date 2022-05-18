const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../../sequelize/config/config.js")[env];

const initModels = require("../../sequelize/models/init-models");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const models = initModels(sequelize);

module.exports = { sequelize, models };
