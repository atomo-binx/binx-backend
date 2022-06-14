const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbprospeccao', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idusuario: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    empresa: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    contato: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    telefone: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    cnpj: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    vendedor: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbprospeccao',
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
    ]
  });
};
