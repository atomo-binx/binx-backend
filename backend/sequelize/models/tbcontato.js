const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbcontato', {
    idcontato: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fantasia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipo: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    cpfcnpj: {
      type: DataTypes.STRING(14),
      allowNull: true
    },
    ierg: {
      type: DataTypes.STRING(14),
      allowNull: true
    },
    endereco: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numero: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    bairro: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    cep: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    complemento: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    uf: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    telefone: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    celular: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    situacao: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    contribuinte: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    vendedor: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    dataalteracao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    datainclusao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clientedesde: {
      type: DataTypes.DATE,
      allowNull: true
    },
    limitecredito: {
      type: DataTypes.DECIMAL(18,10),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbcontato',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idcontato" },
        ]
      },
    ]
  });
};
