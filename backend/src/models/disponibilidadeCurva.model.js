const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const DisponibilidadeCurva = sequelize.define(
  "DisponibilidadeCurva",
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
    curva_1: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    curva_2: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    curva_3: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    curva_4: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
  },
  {
    tableName: "tbdisponibilidadecurva",
  }
);

module.exports = DisponibilidadeCurva;
