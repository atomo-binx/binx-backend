const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const MotivoPrecificacao = sequelize.define(
  "MotivoPrecificacao",
  {
    idmotivo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
  },
  {
    tableName: "tbmotivoprecificacao",
    timestamps: false,
  }
);

module.exports = MotivoPrecificacao;
