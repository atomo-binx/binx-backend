const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const ProdutoDeposito = sequelize.define(
  "ProdutoDeposito",
  {
    idestoque: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    idsku: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    maximo: {
      type: DataTypes.INTEGER,
    },
    minimo: {
      type: DataTypes.INTEGER,
    },
    quantidade: {
      type: DataTypes.INTEGER,
    },
    mediames: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "tbprodutoestoque",
  }
);

module.exports = ProdutoDeposito;
