const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbformapagamento', {
    idformapagamento: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbformapagamento',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idformapagamento" },
        ]
      },
    ]
  });
};
