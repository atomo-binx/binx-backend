const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Usuario = sequelize.define(
  "Usuario",
  {
    idusuario: {
      type: DataTypes.STRING(45),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      default: true
    },
  },
  {
    tableName: "tbusuario",
  }
);

module.exports = Usuario;
