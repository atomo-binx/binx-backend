const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const FormaPagamento = sequelize.define(
  "FormaPagamento",
  {
    idformapagamento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    descricao: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "tbformapagamento",
  }
);

module.exports = FormaPagamento;
