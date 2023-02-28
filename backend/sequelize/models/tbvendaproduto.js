const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbvendaproduto', {
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    idpedidovenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbpedidovenda',
        key: 'idpedidovenda'
      }
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    valorunidade: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: false
    },
    custo: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbvendaproduto',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idsku" },
          { name: "idpedidovenda" },
        ]
      },
      {
        name: "idpedidovenda_idx",
        using: "BTREE",
        fields: [
          { name: "idpedidovenda" },
        ]
      },
      {
        name: "idsku_idx",
        using: "BTREE",
        fields: [
          { name: "idsku" },
        ]
      },
    ]
  });
};
