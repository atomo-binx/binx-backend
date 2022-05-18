const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbprodutofornecedor', {
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    idfornecedor: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbprodutofornecedor',
    timestamps: false,
    indexes: [
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
