const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbstatus', {
    idstatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbstatus',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idstatus" },
        ]
      },
    ]
  });
};
