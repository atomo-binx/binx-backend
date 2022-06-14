const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbfreteforcado', {
    idpedidovenda: {
      type: DataTypes.STRING(45),
      allowNull: false,
      primaryKey: true
    },
    valorsedex: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    prazosedex: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    valorpac: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    prazopac: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    valordlog: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    prazodlog: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    prazosolicitado: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbfreteforcado',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idpedidovenda" },
        ]
      },
    ]
  });
};
