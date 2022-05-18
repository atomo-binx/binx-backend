const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcompraproduto', {
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    idpedidocompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbpedidocompra',
        key: 'idpedidocompra'
      }
    },
    produto: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(18,6),
      allowNull: false
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbcompraproduto',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idsku" },
          { name: "idpedidocompra" },
        ]
      },
      {
        name: "idpedidocompra",
        using: "BTREE",
        fields: [
          { name: "idpedidocompra" },
        ]
      },
    ]
  });
};
