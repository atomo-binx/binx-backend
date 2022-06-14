const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbemailenviado', {
    idpedidovenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbpedidovenda',
        key: 'idpedidovenda'
      }
    },
    idemail: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbemail',
        key: 'idemail'
      }
    }
  }, {
    sequelize,
    tableName: 'tbemailenviado',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idpedidovenda" },
          { name: "idemail" },
        ]
      },
      {
        name: "idemail_idx",
        using: "BTREE",
        fields: [
          { name: "idemail" },
        ]
      },
    ]
  });
};
