const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Produto = sequelize.define(
  "Produto",
  {
    idsku: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    curva: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    idcurva: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    custo: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
    ultimocusto: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
    idcategoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    precovenda: {
      type: DataTypes.DECIMAL(18, 10),
      allowNull: true,
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    peso: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    urlproduto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    urlimagem: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pesomagento: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    localizacao: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    formato: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "tbproduto",
  }
);

module.exports = Produto;
