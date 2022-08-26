const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "tbprodutoestoque",
    {
      idestoque: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "tbestoque",
          key: "idestoque",
        },
      },
      idsku: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true,
        references: {
          model: "tbproduto",
          key: "idsku",
        },
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mediames: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maximo: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      minimo: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "tbprodutoestoque",
      timestamps: true,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "idestoque" }, { name: "idsku" }],
        },
        {
          name: "idskuestoque_idx",
          using: "BTREE",
          fields: [{ name: "idsku" }],
        },
      ],
    }
  );
};
