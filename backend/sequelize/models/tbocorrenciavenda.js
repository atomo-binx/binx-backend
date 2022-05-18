const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbocorrenciavenda', {
    idocorrencia: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idpedidovenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbpedidovenda',
        key: 'idpedidovenda'
      }
    },
    datapedido: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dataocorrencia: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ocorrencia: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    situacao: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbocorrenciavenda',
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
        name: "tbocorrencia_idpedidovenda_fkey_idx",
        using: "BTREE",
        fields: [
          { name: "idpedidovenda" },
        ]
      },
    ]
  });
};
