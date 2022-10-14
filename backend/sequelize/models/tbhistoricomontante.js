const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbhistoricomontante', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    montante_geral: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    montante_curva_a: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    montante_curva_b: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    montante_curva_c: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    montante_sem_curva: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    montante_relativo_curva_a: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    montante_relativo_curva_b: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    montante_relativo_curva_c: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    montante_relativo_sem_curva: {
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
