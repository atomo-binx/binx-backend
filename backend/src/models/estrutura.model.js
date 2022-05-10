const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Estrutura = sequelize.define(
  "Estrutura",
  {
    skupai: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    skufilho: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "tbestrutura",
  }
);

module.exports = Estrutura;
