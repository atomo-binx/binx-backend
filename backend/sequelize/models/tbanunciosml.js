const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbanunciosml', {
    idanuncio: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    tipoanuncio: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    preco: {
      type: DataTypes.DECIMAL(7,2),
      allowNull: true
    },
    tarifa: {
      type: DataTypes.DECIMAL(4,2),
      allowNull: true
    },
    taxa: {
      type: DataTypes.DECIMAL(4,2),
      allowNull: true
    },
    idloja: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbanunciosml',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idanuncio" },
        ]
      },
      {
        name: "ml_idsku_idx",
        using: "BTREE",
        fields: [
          { name: "idsku" },
        ]
      },
    ]
  });
};
