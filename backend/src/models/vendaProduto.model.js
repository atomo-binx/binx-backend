const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const VendaProduto = sequelize.define(
  "VendaProduto",
  {
    idsku: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    idpedidovenda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
    },
    valorunidade: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
  },
  {
    tableName: "tbvendaproduto",
  }
);

module.exports = VendaProduto;
