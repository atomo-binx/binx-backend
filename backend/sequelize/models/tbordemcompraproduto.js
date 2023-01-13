const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbordemcompraproduto', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idordemcompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbordemcompra',
        key: 'id'
      }
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
          { name: "id" },
        ]
      },
      {
        name: "fk_tbordemcompraproduto_idsku_idx",
        using: "BTREE",
        fields: [
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
    ]
  });
};
