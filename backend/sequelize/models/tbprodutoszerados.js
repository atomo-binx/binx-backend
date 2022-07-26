const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "tbprodutoszerados",
    {
      idocorrencia: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      idsku: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: "tbproduto",
          key: "idsku",
        },
      },
      quantidadeanterior: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "tbprodutoszerados",
      timestamps: true,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "idocorrencia" }],
        },
        {
          name: "tbprodutoszerados_idsku_idx",
          using: "BTREE",
          fields: [{ name: "idsku" }],
        },
      ],
    }
  );
};
