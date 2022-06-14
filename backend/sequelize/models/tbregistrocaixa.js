const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbregistrocaixa', {
    idregistro: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idcaixa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbcaixa',
        key: 'idcaixa'
      }
    },
    idformapagamento: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'tbformapagamento',
        key: 'idformapagamento'
      }
    },
    valor: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbregistrocaixa',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idregistro" },
        ]
      },
      {
        name: "tbregistroscaixa_idcaixa_idx",
        using: "BTREE",
        fields: [
          { name: "idcaixa" },
        ]
      },
      {
        name: "tbregistroscaixa_idformapagamento_idx",
        using: "BTREE",
        fields: [
          { name: "idformapagamento" },
        ]
      },
    ]
  });
};
