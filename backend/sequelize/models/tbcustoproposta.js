const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcustoproposta', {
    numeroproposta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idsku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tbproduto',
        key: 'idsku'
      }
    },
    custo: {
      type: DataTypes.DECIMAL(10,5),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbcustoproposta',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "numeroproposta" },
          { name: "idsku" },
        ]
      },
      {
        name: "idskucusto_idx",
        using: "BTREE",
        fields: [
          { name: "idsku" },
        ]
      },
    ]
  });
};
