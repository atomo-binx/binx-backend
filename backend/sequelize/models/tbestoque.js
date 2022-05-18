const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbestoque', {
    idestoque: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'tbestoque',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idestoque" },
        ]
      },
    ]
  });
};
