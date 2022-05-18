const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbestrutura', {
    skupai: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    skufilho: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbestrutura',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "skupai" },
          { name: "skufilho" },
        ]
      },
      {
        name: "skufilho_idx",
        using: "BTREE",
        fields: [
          { name: "skufilho" },
        ]
      },
    ]
  });
};
