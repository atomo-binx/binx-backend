const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tbpedidovenda', {
    idpedidovenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    datavenda: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    idloja: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbloja',
        key: 'idloja'
      }
    },
    idstatusvenda: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbstatus',
        key: 'idstatus'
      }
    },
    cliente: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    totalprodutos: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: true
    },
    totalvenda: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: true
    },
    fretecliente: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: true
    },
    fretetransportadora: {
      type: DataTypes.DECIMAL(18,2),
      allowNull: true
    },
    formapagamento: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    cpfcnpj: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    transportadora: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    rastreio: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    servico: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    ocorrencia: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    idpedidoloja: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    endereco: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    cep: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    numeronota: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    serienota: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    datanota: {
      type: DataTypes.DATE,
      allowNull: true
    },
    vendedor: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    alias: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    datamagento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    orderid: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    numeroproposta: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbpedidovenda',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "idpedidovenda" },
        ]
      },
      {
        name: "idloja",
        using: "BTREE",
        fields: [
          { name: "idloja" },
        ]
      },
      {
        name: "idstatusvenda",
        using: "BTREE",
        fields: [
          { name: "idstatusvenda" },
        ]
      },
    ]
  });
};
