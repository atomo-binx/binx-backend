const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const EmailEnviado = sequelize.define(
  "EmailEnviado",
  {
    idpedidovenda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    idemail: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    tableName: "tbemailenviado",
  }
);

module.exports = EmailEnviado;
