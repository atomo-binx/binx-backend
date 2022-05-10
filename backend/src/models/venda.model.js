const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");

const Venda = sequelize.define(
  "Venda",
  {
    idpedidovenda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    datavenda: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    idloja: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    idstatusvenda: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cliente: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    totalprodutos: {
      type: DataTypes.DECIMAL(18, 2),
    },
    totalvenda: {
      type: DataTypes.DECIMAL(18, 2),
    },
    fretecliente: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    fretetransportadora: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    formapagamento: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    cpfcnpj: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    transportadora: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    rastreio: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    servico: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    ocorrencia: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    idpedidoloja: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    endereco: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    cep: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    vendedor: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    numeronota: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    serienota: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    datamagento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    orderid: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    numeroproposta: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    datanota: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    alias: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "tbpedidovenda",
  }
);

module.exports = Venda;
