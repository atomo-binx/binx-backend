var DataTypes = require("sequelize").DataTypes;
var _tbanunciosml = require("./tbanunciosml");
var _tbcaixa = require("./tbcaixa");
var _tbcategoria = require("./tbcategoria");
var _tbcategoriacompra = require("./tbcategoriacompra");
var _tbcompraproduto = require("./tbcompraproduto");
var _tbconfigvalidadeprecificacao = require("./tbconfigvalidadeprecificacao");
var _tbcontato = require("./tbcontato");
var _tbcurva = require("./tbcurva");
var _tbcustopedido = require("./tbcustopedido");
var _tbcustoproposta = require("./tbcustoproposta");
var _tbdashboardcompras = require("./tbdashboardcompras");
var _tbdisponibilidade = require("./tbdisponibilidade");
var _tbdisponibilidadecurva = require("./tbdisponibilidadecurva");
var _tbemail = require("./tbemail");
var _tbemailenviado = require("./tbemailenviado");
var _tbestoque = require("./tbestoque");
var _tbestrutura = require("./tbestrutura");
var _tbformapagamento = require("./tbformapagamento");
var _tbfornecedor = require("./tbfornecedor");
var _tbfreteforcado = require("./tbfreteforcado");
var _tbhistoricomontante = require("./tbhistoricomontante");
var _tbkits = require("./tbkits");
var _tbloja = require("./tbloja");
var _tbmotivoprecificacao = require("./tbmotivoprecificacao");
var _tbocorrenciavenda = require("./tbocorrenciavenda");
var _tbpedidocompra = require("./tbpedidocompra");
var _tbpedidovenda = require("./tbpedidovenda");
var _tbprecificacao = require("./tbprecificacao");
var _tbproduto = require("./tbproduto");
var _tbprodutoestoque = require("./tbprodutoestoque");
var _tbprodutofornecedor = require("./tbprodutofornecedor");
var _tbprodutoszerados = require("./tbprodutoszerados");
var _tbprospeccao = require("./tbprospeccao");
var _tbregistrocaixa = require("./tbregistrocaixa");
var _tbsituacaocaixa = require("./tbsituacaocaixa");
var _tbstatus = require("./tbstatus");
var _tbstatuscompra = require("./tbstatuscompra");
var _tbusuario = require("./tbusuario");
var _tbvendaproduto = require("./tbvendaproduto");

function initModels(sequelize) {
  var tbanunciosml = _tbanunciosml(sequelize, DataTypes);
  var tbcaixa = _tbcaixa(sequelize, DataTypes);
  var tbcategoria = _tbcategoria(sequelize, DataTypes);
  var tbcategoriacompra = _tbcategoriacompra(sequelize, DataTypes);
  var tbcompraproduto = _tbcompraproduto(sequelize, DataTypes);
  var tbconfigvalidadeprecificacao = _tbconfigvalidadeprecificacao(sequelize, DataTypes);
  var tbcontato = _tbcontato(sequelize, DataTypes);
  var tbcurva = _tbcurva(sequelize, DataTypes);
  var tbcustopedido = _tbcustopedido(sequelize, DataTypes);
  var tbcustoproposta = _tbcustoproposta(sequelize, DataTypes);
  var tbdashboardcompras = _tbdashboardcompras(sequelize, DataTypes);
  var tbdisponibilidade = _tbdisponibilidade(sequelize, DataTypes);
  var tbdisponibilidadecurva = _tbdisponibilidadecurva(sequelize, DataTypes);
  var tbemail = _tbemail(sequelize, DataTypes);
  var tbemailenviado = _tbemailenviado(sequelize, DataTypes);
  var tbestoque = _tbestoque(sequelize, DataTypes);
  var tbestrutura = _tbestrutura(sequelize, DataTypes);
  var tbformapagamento = _tbformapagamento(sequelize, DataTypes);
  var tbfornecedor = _tbfornecedor(sequelize, DataTypes);
  var tbfreteforcado = _tbfreteforcado(sequelize, DataTypes);
  var tbhistoricomontante = _tbhistoricomontante(sequelize, DataTypes);
  var tbkits = _tbkits(sequelize, DataTypes);
  var tbloja = _tbloja(sequelize, DataTypes);
  var tbmotivoprecificacao = _tbmotivoprecificacao(sequelize, DataTypes);
  var tbocorrenciavenda = _tbocorrenciavenda(sequelize, DataTypes);
  var tbpedidocompra = _tbpedidocompra(sequelize, DataTypes);
  var tbpedidovenda = _tbpedidovenda(sequelize, DataTypes);
  var tbprecificacao = _tbprecificacao(sequelize, DataTypes);
  var tbproduto = _tbproduto(sequelize, DataTypes);
  var tbprodutoestoque = _tbprodutoestoque(sequelize, DataTypes);
  var tbprodutofornecedor = _tbprodutofornecedor(sequelize, DataTypes);
  var tbprodutoszerados = _tbprodutoszerados(sequelize, DataTypes);
  var tbprospeccao = _tbprospeccao(sequelize, DataTypes);
  var tbregistrocaixa = _tbregistrocaixa(sequelize, DataTypes);
  var tbsituacaocaixa = _tbsituacaocaixa(sequelize, DataTypes);
  var tbstatus = _tbstatus(sequelize, DataTypes);
  var tbstatuscompra = _tbstatuscompra(sequelize, DataTypes);
  var tbusuario = _tbusuario(sequelize, DataTypes);
  var tbvendaproduto = _tbvendaproduto(sequelize, DataTypes);

  tbemail.belongsToMany(tbpedidovenda, { as: 'idpedidovenda_tbpedidovendas', through: tbemailenviado, foreignKey: "idemail", otherKey: "idpedidovenda" });
  tbestoque.belongsToMany(tbproduto, { as: 'idsku_tbproduto_tbprodutoestoques', through: tbprodutoestoque, foreignKey: "idestoque", otherKey: "idsku" });
  tbpedidocompra.belongsToMany(tbproduto, { as: 'idsku_tbprodutos', through: tbcompraproduto, foreignKey: "idpedidocompra", otherKey: "idsku" });
  tbpedidovenda.belongsToMany(tbemail, { as: 'idemail_tbemails', through: tbemailenviado, foreignKey: "idpedidovenda", otherKey: "idemail" });
  tbpedidovenda.belongsToMany(tbproduto, { as: 'idsku_tbproduto_tbvendaprodutos', through: tbvendaproduto, foreignKey: "idpedidovenda", otherKey: "idsku" });
  tbproduto.belongsToMany(tbestoque, { as: 'idestoque_tbestoques', through: tbprodutoestoque, foreignKey: "idsku", otherKey: "idestoque" });
  tbproduto.belongsToMany(tbpedidocompra, { as: 'idpedidocompra_tbpedidocompras', through: tbcompraproduto, foreignKey: "idsku", otherKey: "idpedidocompra" });
  tbproduto.belongsToMany(tbpedidovenda, { as: 'idpedidovenda_tbpedidovenda_tbvendaprodutos', through: tbvendaproduto, foreignKey: "idsku", otherKey: "idpedidovenda" });
  tbproduto.belongsToMany(tbproduto, { as: 'skufilho_tbprodutos', through: tbestrutura, foreignKey: "skupai", otherKey: "skufilho" });
  tbproduto.belongsToMany(tbproduto, { as: 'skupai_tbprodutos', through: tbestrutura, foreignKey: "skufilho", otherKey: "skupai" });
  tbproduto.belongsToMany(tbproduto, { as: 'idskufilho_tbprodutos', through: tbkits, foreignKey: "idskupai", otherKey: "idskufilho" });
  tbproduto.belongsToMany(tbproduto, { as: 'idskupai_tbprodutos', through: tbkits, foreignKey: "idskufilho", otherKey: "idskupai" });
  tbregistrocaixa.belongsTo(tbcaixa, { foreignKey: "idcaixa"});
  tbcaixa.hasMany(tbregistrocaixa, { foreignKey: "idcaixa"});
  tbconfigvalidadeprecificacao.belongsTo(tbcategoria, { foreignKey: "idcategoria"});
  tbcategoria.hasMany(tbconfigvalidadeprecificacao, { foreignKey: "idcategoria"});
  tbproduto.belongsTo(tbcategoria, { foreignKey: "idcategoria"});
  tbcategoria.hasMany(tbproduto, { foreignKey: "idcategoria"});
  tbpedidovenda.belongsTo(tbcontato, { foreignKey: "idcontato"});
  tbcontato.hasMany(tbpedidovenda, { foreignKey: "idcontato"});
  tbconfigvalidadeprecificacao.belongsTo(tbcurva, { foreignKey: "idcurva"});
  tbcurva.hasMany(tbconfigvalidadeprecificacao, { foreignKey: "idcurva"});
  tbproduto.belongsTo(tbcurva, { foreignKey: "idcurva"});
  tbcurva.hasMany(tbproduto, { foreignKey: "idcurva"});
  tbemailenviado.belongsTo(tbemail, { foreignKey: "idemail"});
  tbemail.hasMany(tbemailenviado, { foreignKey: "idemail"});
  tbprodutoestoque.belongsTo(tbestoque, { foreignKey: "idestoque"});
  tbestoque.hasMany(tbprodutoestoque, { foreignKey: "idestoque"});
  tbpedidovenda.belongsTo(tbformapagamento, { foreignKey: "idformapagamento"});
  tbformapagamento.hasMany(tbpedidovenda, { foreignKey: "idformapagamento"});
  tbregistrocaixa.belongsTo(tbformapagamento, { foreignKey: "idformapagamento"});
  tbformapagamento.hasMany(tbregistrocaixa, { foreignKey: "idformapagamento"});
  tbpedidocompra.belongsTo(tbfornecedor, { foreignKey: "idfornecedor"});
  tbfornecedor.hasMany(tbpedidocompra, { foreignKey: "idfornecedor"});
  tbpedidovenda.belongsTo(tbloja, { foreignKey: "idloja"});
  tbloja.hasMany(tbpedidovenda, { foreignKey: "idloja"});
  tbprecificacao.belongsTo(tbmotivoprecificacao, { foreignKey: "idmotivo"});
  tbmotivoprecificacao.hasMany(tbprecificacao, { foreignKey: "idmotivo"});
  tbcompraproduto.belongsTo(tbpedidocompra, { foreignKey: "idpedidocompra"});
  tbpedidocompra.hasMany(tbcompraproduto, { foreignKey: "idpedidocompra"});
  tbprecificacao.belongsTo(tbpedidocompra, { foreignKey: "pedidocompra"});
  tbpedidocompra.hasMany(tbprecificacao, { foreignKey: "pedidocompra"});
  tbemailenviado.belongsTo(tbpedidovenda, { foreignKey: "idpedidovenda"});
  tbpedidovenda.hasMany(tbemailenviado, { foreignKey: "idpedidovenda"});
  tbocorrenciavenda.belongsTo(tbpedidovenda, { foreignKey: "idpedidovenda"});
  tbpedidovenda.hasMany(tbocorrenciavenda, { foreignKey: "idpedidovenda"});
  tbvendaproduto.belongsTo(tbpedidovenda, { foreignKey: "idpedidovenda"});
  tbpedidovenda.hasMany(tbvendaproduto, { foreignKey: "idpedidovenda"});
  tbanunciosml.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbanunciosml, { foreignKey: "idsku"});
  tbcompraproduto.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbcompraproduto, { foreignKey: "idsku"});
  tbcustoproposta.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbcustoproposta, { foreignKey: "idsku"});
  tbestrutura.belongsTo(tbproduto, { foreignKey: "skupai"});
  tbproduto.hasMany(tbestrutura, { foreignKey: "skupai"});
  tbestrutura.belongsTo(tbproduto, { foreignKey: "skufilho"});
  tbproduto.hasMany(tbestrutura, { foreignKey: "skufilho"});
  tbkits.belongsTo(tbproduto, { foreignKey: "idskupai"});
  tbproduto.hasMany(tbkits, { foreignKey: "idskupai"});
  tbkits.belongsTo(tbproduto, { foreignKey: "idskufilho"});
  tbproduto.hasMany(tbkits, { foreignKey: "idskufilho"});
  tbprecificacao.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbprecificacao, { foreignKey: "idsku"});
  tbprodutoestoque.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbprodutoestoque, { foreignKey: "idsku"});
  tbprodutofornecedor.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbprodutofornecedor, { foreignKey: "idsku"});
  tbprodutoszerados.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbprodutoszerados, { foreignKey: "idsku"});
  tbvendaproduto.belongsTo(tbproduto, { foreignKey: "idsku"});
  tbproduto.hasMany(tbvendaproduto, { foreignKey: "idsku"});
  tbcaixa.belongsTo(tbsituacaocaixa, { foreignKey: "idsituacao"});
  tbsituacaocaixa.hasMany(tbcaixa, { foreignKey: "idsituacao"});
  tbpedidovenda.belongsTo(tbstatus, { foreignKey: "idstatusvenda"});
  tbstatus.hasMany(tbpedidovenda, { foreignKey: "idstatusvenda"});
  tbpedidocompra.belongsTo(tbstatuscompra, { foreignKey: "idstatus"});
  tbstatuscompra.hasMany(tbpedidocompra, { foreignKey: "idstatus"});
  tbcaixa.belongsTo(tbusuario, { foreignKey: "idoperadorabertura"});
  tbusuario.hasMany(tbcaixa, { foreignKey: "idoperadorabertura"});
  tbcaixa.belongsTo(tbusuario, { foreignKey: "idoperadorconferencia"});
  tbusuario.hasMany(tbcaixa, { foreignKey: "idoperadorconferencia"});
  tbcaixa.belongsTo(tbusuario, { foreignKey: "idoperadorfechamento"});
  tbusuario.hasMany(tbcaixa, { foreignKey: "idoperadorfechamento"});

  return {
    tbanunciosml,
    tbcaixa,
    tbcategoria,
    tbcategoriacompra,
    tbcompraproduto,
    tbconfigvalidadeprecificacao,
    tbcontato,
    tbcurva,
    tbcustopedido,
    tbcustoproposta,
    tbdashboardcompras,
    tbdisponibilidade,
    tbdisponibilidadecurva,
    tbemail,
    tbemailenviado,
    tbestoque,
    tbestrutura,
    tbformapagamento,
    tbfornecedor,
    tbfreteforcado,
    tbhistoricomontante,
    tbkits,
    tbloja,
    tbmotivoprecificacao,
    tbocorrenciavenda,
    tbpedidocompra,
    tbpedidovenda,
    tbprecificacao,
    tbproduto,
    tbprodutoestoque,
    tbprodutofornecedor,
    tbprodutoszerados,
    tbprospeccao,
    tbregistrocaixa,
    tbsituacaocaixa,
    tbstatus,
    tbstatuscompra,
    tbusuario,
    tbvendaproduto,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
