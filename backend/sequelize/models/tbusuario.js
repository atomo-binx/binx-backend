const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbusuario', {
    idusuario: {
      type: DataTypes.STRING(45),
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'tbusuario',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idusuario" },
        ]
      },
    ]
  });
};
