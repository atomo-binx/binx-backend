const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbpedidocompra', {
    idpedidocompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idfornecedor: {
      type: DataTypes.STRING(45),
      allowNull: false,
      references: {
        model: 'tbfornecedor',
        key: 'idfornecedor'
      }
    },
    idstatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbstatuscompra',
        key: 'idstatus'
      }
    },
    datacriacao: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dataconclusao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dataprevista: {
      type: DataTypes.DATE,
      allowNull: true
    },
    precificado: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'tbpedidocompra',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idpedidocompra" },
        ]
      },
      {
        name: "idfornecedor_idx",
        using: "BTREE",
        fields: [
          { name: "idfornecedor" },
        ]
      },
      {
        name: "idstatus_idx",
        using: "BTREE",
        fields: [
          { name: "idstatus" },
        ]
      },
    ]
  });
};
