const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Precificacao = sequelize.define(
  "Precificacao",
  {
    idPrecificacao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    idmotivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dataprecificacao: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pedidocompra: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tbprecificacao",
  }
);

module.exports = Precificacao;
