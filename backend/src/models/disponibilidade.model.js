const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Disponibilidade = sequelize.define(
  "Disponibilidade",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    data: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false,
    },
  },
  {
    tableName: "tbdisponibilidade",
  }
);

module.exports = Disponibilidade;
