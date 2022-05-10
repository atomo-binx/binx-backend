const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Categoria = sequelize.define(
  "Categoria",
  {
    idcategoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tipocurva: {
      type: DataTypes.STRING(1),
      allowNull: false,
    },
  },
  {
    tableName: "tbcategoria",
    timestamps: false,
  }
);

module.exports = Categoria;
