const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbproduto', {
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    precovenda: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    },
    formato: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    curva: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    idcurva: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbcurva',
        key: 'idcurva'
      }
    },
    custo: {
      type: DataTypes.DECIMAL(18,6),
      allowNull: true
    },
    ultimocusto: {
      type: DataTypes.DECIMAL(18,6),
      allowNull: true
    },
    idcategoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbcategoria',
        key: 'idcategoria'
      }
    },
    situacao: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    peso: {
      type: DataTypes.DECIMAL(18,4),
      allowNull: true
    },
    localizacao: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    urlproduto: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    urlimagem: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pesomagento: {
      type: DataTypes.DECIMAL(18,4),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbproduto',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idsku" },
        ]
      },
      {
        name: "idcategoria",
        using: "BTREE",
        fields: [
          { name: "idcategoria" },
        ]
      },
      {
        name: "p_idcurva_idx",
        using: "BTREE",
        fields: [
          { name: "idcurva" },
        ]
      },
    ]
  });
};
