const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Fornecedor = sequelize.define(
  "Fornecedor",
  {
    idfornecedor: {
      type: DataTypes.STRING(45),
      primaryKey: true,
      allowNull: false,
    },
    nomefornecedor: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  },
  {
    tableName: "tbfornecedor",
  }
);

module.exports = Fornecedor;
