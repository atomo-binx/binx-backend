const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbprecificacao', {
    idprecificacao: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    idmotivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbmotivoprecificacao',
        key: 'idmotivo'
      }
    },
    dataprecificacao: {
      type: DataTypes.DATE,
      allowNull: false
    },
    pedidocompra: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbpedidocompra',
        key: 'idpedidocompra'
      }
    }
  }, {
    sequelize,
    tableName: 'tbprecificacao',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idprecificacao" },
        ]
      },
      {
        name: "p_idmotivo_idx",
        using: "BTREE",
        fields: [
          { name: "idmotivo" },
        ]
      },
      {
        name: "p_pedidocompra_idx",
        using: "BTREE",
        fields: [
          { name: "pedidocompra" },
        ]
      },
      {
        name: "p_idsku_idx",
        using: "BTREE",
        fields: [
          { name: "idsku" },
        ]
      },
    ]
  });
};
