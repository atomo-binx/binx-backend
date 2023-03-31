const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbparcela', {
    idparcela: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idpedido: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    idlancamento: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    datavencimento: {
      type: DataTypes.DATE,
      allowNull: false
    },
    idformapagamento: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'tbformapagamento',
        key: 'idformapagamento'
      }
    }
  }, {
    sequelize,
    tableName: 'tbparcela',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idparcela" },
        ]
      },
      {
        name: "tbparcela_idformapagamento_idx",
        using: "BTREE",
        fields: [
          { name: "idformapagamento" },
        ]
      },
    ]
  });
};
