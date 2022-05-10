const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const StatusCompra = sequelize.define(
  "StatusCompra",
  {
    idstatus: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "tbstatuscompra",
    timestamps: false,
  }
);

module.exports = StatusCompra;
