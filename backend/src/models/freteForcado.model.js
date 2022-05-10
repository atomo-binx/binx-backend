const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

// Atualizando

const FreteForcado = sequelize.define(
  "FreteForcado",
  {
    idpedidovenda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    valorsedex: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    prazosedex: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valorpac: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    prazopac: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valordlog: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    prazodlog: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    prazosolicitado: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "tbfreteforcado",
  }
);

module.exports = FreteForcado;