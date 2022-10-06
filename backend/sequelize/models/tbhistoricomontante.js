const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbhistoricomontante', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    geral: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    curva_a: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    curva_b: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    curva_c: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    sem_curva: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    data: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbhistoricomontante',
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
