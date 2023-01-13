const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tborcamento', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idordemcompraproduto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbordemcompraproduto',
        key: 'id'
      }
    },
    idfornecedor: {
      type: DataTypes.STRING(45),
      allowNull: false,
      references: {
        model: 'tbfornecedor',
        key: 'idfornecedor'
      }
    },
    idsituacaoorcamento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'tbsituacaoorcamento',
        key: 'id'
      }
    },
    valor: {
      type: DataTypes.DECIMAL(18,6),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tborcamento',
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
      {
        name: "fk_tborcamento_idfornecedor_idx",
        using: "BTREE",
        fields: [
          { name: "idfornecedor" },
        ]
      },
      {
        name: "fk_tborcamento_idsituacaoorcamento_idx",
        using: "BTREE",
        fields: [
          { name: "idsituacaoorcamento" },
        ]
      },
      {
        name: "fk_tborcamento_idordemcompraproduto_idx",
        using: "BTREE",
        fields: [
          { name: "idordemcompraproduto" },
        ]
      },
    ]
  });
};
