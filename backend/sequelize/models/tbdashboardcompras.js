const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbdashboardcompras', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    ativos: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    meta: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    data: {
      type: DataTypes.DATE,
      allowNull: true
    },
    disponibilidade_geral: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    disponibilidade_curva_a: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    disponibilidade_curva_b: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    disponibilidade_curva_c: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    disponibilidade_sem_curva: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    abaixo_min_geral: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    abaixo_min_curva_a: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    abaixo_min_curva_b: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    abaixo_min_curva_c: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    abaixo_min_sem_curva: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    indisponiveis_geral: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    indisponiveis_curva_a: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    indisponiveis_curva_b: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    indisponiveis_curva_c: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    indisponiveis_sem_curva: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbdashboardcompras',
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
