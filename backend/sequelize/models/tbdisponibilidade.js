const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbdisponibilidade', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    data: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbdisponibilidade',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
