const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Curva = sequelize.define(
  "Curva",
  {
    idcurva: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
  },
  {
    tableName: "tbcurva",
    timestamps: false,
  }
);

module.exports = Curva;
