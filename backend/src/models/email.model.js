const DataTypes = require("sequelize");
const sequelize = require("../services/sequelize");
const EmailEnviado = require("./emailEnviado.model");

const Email = sequelize.define(
  "Email",
  {
    idemail: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
  },
  {
    tableName: "tbemail",
    timestamps: false,
  }
);

Email.belongsTo(EmailEnviado, {
  foreignKey: "idemail",
});

EmailEnviado.hasMany(Email, {
  sourceKey: "idemail",
  foreignKey: "idemail",
});

module.exports = Email;
