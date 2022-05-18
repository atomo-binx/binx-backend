const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcategoria', {
    idcategoria: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    tipocurva: {
      type: DataTypes.CHAR(1),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbcategoria',
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
