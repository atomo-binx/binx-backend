const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbocorrenciaordemcompra', {
    idocorrencia: {
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
    idsituacaoordemcompra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbsituacaoordemcompra',
        key: 'id'
      }
    },
    idusuario: {
      type: DataTypes.STRING(45),
      allowNull: false,
      references: {
        model: 'tbusuario',
        key: 'idusuario'
      }
    },
    dataocorrencia: {
      type: DataTypes.DATE,
      allowNull: false
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbocorrenciaordemcompra',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idocorrencia" },
        ]
      },
      {
        name: "fk_tbocorrenciaordemcompra_idordemcompra_idx",
        using: "BTREE",
        fields: [
          { name: "idordemcompra" },
        ]
      },
      {
        name: "fk_tbocorrenciaordemcompra_idusuario_idx",
        using: "BTREE",
        fields: [
          { name: "idusuario" },
        ]
      },
      {
        name: "fk_tbocorrenciaordemcompra_idsituacaoordemcompra_idx",
        using: "BTREE",
        fields: [
          { name: "idsituacaoordemcompra" },
        ]
      },
    ]
  });
};
