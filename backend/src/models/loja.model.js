const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Loja = sequelize.define(
  "Loja",
  {
    idloja: {
      type: DataTypes.INTEGER,
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
    tableName: "tbloja",
    timestamps: false,
  }
);

module.exports = Loja;
