const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('auditoriacorporativo', {
    numeropedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbpedidovenda',
        key: 'idpedidovenda'
      }
    },
    margem: {
      type: DataTypes.DECIMAL(10,5),
      allowNull: true
    },
    situacao: {
      type: DataTypes.STRING(45),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'auditoriacorporativo',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "numeropedido" },
        ]
      },
    ]
  });
};
