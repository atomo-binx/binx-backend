const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbbudgetcompras', {
    idbudget: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    datainicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    idcategoria: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'tbcategoriapedidocompra',
        key: 'idcategoria'
      }
    }
  }, {
    sequelize,
    tableName: 'tbbudgetcompras',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idbudget" },
        ]
      },
      {
        name: "tbbudgetcompras_idcategoria_idx",
        using: "BTREE",
        fields: [
          { name: "idcategoria" },
        ]
      },
    ]
  });
};
