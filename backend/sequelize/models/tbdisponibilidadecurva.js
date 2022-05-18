const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbdisponibilidadecurva', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    data: {
      type: DataTypes.DATE,
      allowNull: true
    },
    curva_1: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    curva_2: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    curva_3: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    curva_4: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbdisponibilidadecurva',
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
