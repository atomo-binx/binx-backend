const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const AnunciosMercadoLivre = sequelize.define(
  "AnunciosMercadoLivre",
  {
    idanuncio: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    tipoanuncio: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    tarifa: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
    },
    taxa: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
    },
    idloja: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    preco: {
      type: DataTypes.DECIMAL(7, 2),
      allowNull: true,
    },
  },
  {
    tableName: "tbanunciosml",
    timestamps: true,
  }
);

module.exports = AnunciosMercadoLivre;
