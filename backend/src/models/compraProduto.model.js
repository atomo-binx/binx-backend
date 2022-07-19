const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const CompraProduto = sequelize.define(
  "CompraProduto",
  {
    idsku: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    idpedidocompra: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    produto: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codigofornecedor: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
  },
  {
    tableName: "tbcompraproduto",
  }
);

module.exports = CompraProduto;
