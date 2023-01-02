const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbordemcompraproduto', {
    idordemcompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbordemcompra',
        key: 'idordemcompra'
      }
    },
    idsku: {
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
    tableName: 'tbordemcompraproduto',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idordemcompra" },
          { name: "idsku" },
        ]
      },
      {
        name: "fk_tbordemcompraproduto_idordemcompra_idx",
        using: "BTREE",
        fields: [
          { name: "idordemcompra" },
        ]
      },
      {
        name: "fk_tbordemcompraproduto_idsku_idx",
        using: "BTREE",
        fields: [
          { name: "idsku" },
        ]
      },
    ]
  });
};
