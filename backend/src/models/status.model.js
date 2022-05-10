const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Status = sequelize.define(
  "Status",
  {
    idstatus: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "tbstatus",
    timestamps: false,
  }
);

module.exports = Status;
