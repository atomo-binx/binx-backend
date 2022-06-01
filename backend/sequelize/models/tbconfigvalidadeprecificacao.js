const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbconfigvalidadeprecificacao', {
    idconfig: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idcategoria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbcategoria',
        key: 'idcategoria'
      }
    },
    idcurva: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbcurva',
        key: 'idcurva'
      }
    },
    validade: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbconfigvalidadeprecificacao',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idconfig" },
        ]
      },
      {
        name: "vp_idcategoria_idx",
        using: "BTREE",
        fields: [
          { name: "idcategoria" },
        ]
      },
      {
        name: "cp_idcurva_idx",
        using: "BTREE",
        fields: [
          { name: "idcurva" },
        ]
      },
    ]
  });
};
