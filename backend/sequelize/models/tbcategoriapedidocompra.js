const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcategoriapedidocompra', {
    idcategoria: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.STRING(45),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbcategoriapedidocompra',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idcategoria" },
        ]
      },
    ]
  });
};
