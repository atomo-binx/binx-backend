const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbfornecedor', {
    idfornecedor: {
      type: DataTypes.STRING(45),
      allowNull: false,
      primaryKey: true
    },
    nomefornecedor: {
      type: DataTypes.STRING(200),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbfornecedor',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idfornecedor" },
        ]
      },
    ]
  });
};
