const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const PedidoCompra = sequelize.define(
  "PedidoCompra",
  {
    idpedidocompra: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    idfornecedor: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    idstatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    datacriacao: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dataprevista: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dataconclusao: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tbpedidocompra",
  }
);

module.exports = PedidoCompra;
