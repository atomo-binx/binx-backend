const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcustopedido', {
    idpedidovenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idpedidocompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    custo: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    considerado: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbcustopedido',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idpedidovenda" },
          { name: "idpedidocompra" },
          { name: "idsku" },
        ]
      },
    ]
  });
};
