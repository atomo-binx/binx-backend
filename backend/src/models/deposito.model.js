const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Deposito = sequelize.define(
  "Deposito",
  {
    idestoque: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    tableName: "tbestoque",
    timestamps: false,
  }
);

module.exports = Deposito;
