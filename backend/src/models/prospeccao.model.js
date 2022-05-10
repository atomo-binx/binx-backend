const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Prospeccao = sequelize.define(
  "Prospeccao",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    idusuario: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    empresa: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contato: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    cnpj: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    vendedor: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tbprospeccao",
  }
);

module.exports = Prospeccao;
