const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tborcamento', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idordemcompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbordemcompra',
        key: 'idordemcompra'
      }
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'tbproduto',
        key: 'idsku'
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
      references: {
        model: 'tbsituacaoorcamento',
        key: 'id'
      }
    },
    valor: {
      type: DataTypes.DECIMAL(18,6),
      allowNull: true
    },
    previsao: {
      type: DataTypes.DATE,
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
        name: "fk_tborcamento_idsku_idx",
        using: "BTREE",
        fields: [
          { name: "idsku" },
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
        name: "fk_tborcamento_idordemcompra_idx",
        using: "BTREE",
        fields: [
          { name: "idordemcompra" },
        ]
      },
    ]
  });
};
