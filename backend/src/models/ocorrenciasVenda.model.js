const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const OcorrenciaVenda = sequelize.define(
  "OcorrenciaVenda",
  {
    idocorrencia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    idpedidovenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    datapedido: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dataocorrencia: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ocorrencia: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    situacao: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "tbocorrenciavenda",
  }
);

module.exports = OcorrenciaVenda;
