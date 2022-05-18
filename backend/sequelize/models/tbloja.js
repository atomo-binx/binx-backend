const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbloja', {
    idloja: {
      type: DataTypes.INTEGER,
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
    tableName: 'tbloja',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idloja" },
        ]
      },
    ]
  });
};
