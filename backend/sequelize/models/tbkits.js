const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbkits', {
    idskupai: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    idskufilho: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    quantidade: {
      type: DataTypes.FLOAT(10,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbkits',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idskupai" },
          { name: "idskufilho" },
        ]
      },
      {
        name: "fk_skufilho_idsku_idx",
        using: "BTREE",
        fields: [
          { name: "idskufilho" },
        ]
      },
    ]
  });
};
