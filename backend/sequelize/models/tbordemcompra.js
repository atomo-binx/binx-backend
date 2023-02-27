const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbordemcompra', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idtipoordemcompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'tbtipoordemcompra',
        key: 'id'
      }
    },
    idsituacaoordemcompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'tbsituacaoordemcompra',
        key: 'id'
      }
    },
    idcomprador: {
      type: DataTypes.STRING(45),
      allowNull: true,
      references: {
        model: 'tbusuario',
        key: 'idusuario'
      }
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    datafinalizacao: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbordemcompra',
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
        name: "fk_idtipoordemcompra_idx",
        using: "BTREE",
        fields: [
          { name: "idtipoordemcompra" },
        ]
      },
      {
        name: "fk_tbordemcompra_idcomprador_idx",
        using: "BTREE",
        fields: [
          { name: "idcomprador" },
        ]
      },
      {
        name: "fk_tbordemcompra_idsituacaoordemcompra_idx",
        using: "BTREE",
        fields: [
          { name: "idsituacaoordemcompra" },
        ]
      },
    ]
  });
};
