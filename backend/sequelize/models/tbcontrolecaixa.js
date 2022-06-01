const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcontrolecaixa', {
    idcaixa: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    idsituacao: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbsituacaocaixa',
        key: 'idsituacao'
      }
    },
    idoperadorabertura: {
      type: DataTypes.STRING(45),
      allowNull: true,
      references: {
        model: 'tbusuario',
        key: 'idusuario'
      }
    },
    idoperadorfechamento: {
      type: DataTypes.STRING(45),
      allowNull: true,
      references: {
        model: 'tbusuario',
        key: 'idusuario'
      }
    },
    idoperadorconferencia: {
      type: DataTypes.STRING(45),
      allowNull: true,
      references: {
        model: 'tbusuario',
        key: 'idusuario'
      }
    },
    trocoabertura: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: true
    },
    trocofechamento: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: true
    },
    dataabertura: {
      type: DataTypes.DATE,
      allowNull: true
    },
    datafechamento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dataconferencia: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbcontrolecaixa',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idcaixa" },
        ]
      },
      {
        name: "tbcontrolecaixa_idoperadorabertura_idx",
        using: "BTREE",
        fields: [
          { name: "idoperadorabertura" },
        ]
      },
      {
        name: "tbcontrolecaixa_idoperadorfechamento_idx",
        using: "BTREE",
        fields: [
          { name: "idoperadorfechamento" },
        ]
      },
      {
        name: "tbcontrolecaixa_idoperadorconferencia_idx",
        using: "BTREE",
        fields: [
          { name: "idoperadorconferencia" },
        ]
      },
      {
        name: "tbcontrolecaixa_idsituacao_idx",
        using: "BTREE",
        fields: [
          { name: "idsituacao" },
        ]
      },
    ]
  });
};
