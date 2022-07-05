select
  tbproduto.idsku as "SKU",
  tbproduto.nome as "Produto",
  tbprodutoestoque.quantidade as "Qntd Atual",
  tbprodutoestoque.minimo as "Min",
  tbprodutoestoque.maximo as "Max",
  tbproduto.curva as "Curva",
  max(tbcompraproduto.idpedidocompra) as "Último Pedido",
  tbstatuscompra.nome as "Situação",
  tbcompraproduto.quantidade as "Qntd. Comprada",
  replace(tbcompraproduto.valor, ".", ",") as "Custo",
  tbfornecedor.nomefornecedor as "Fornecedor"
from
  tbproduto
  inner join tbcompraproduto on tbproduto.idsku = tbcompraproduto.idsku
  inner join tbpedidocompra on tbcompraproduto.idpedidocompra = tbpedidocompra.idpedidocompra
  inner join tbfornecedor on tbpedidocompra.idfornecedor = tbfornecedor.idfornecedor
  inner join tbstatuscompra on tbpedidocompra.idstatus = tbstatuscompra.idstatus
  inner join tbprodutoestoque on tbproduto.idsku = tbprodutoestoque.idsku
where
  tbproduto.idsku regexp("^[0-9]+$")
  and tbproduto.situacao = true
  and tbfornecedor.idfornecedor not in(
    "7401278638",
    "9172761844",
    "10733118103",
    "12331146486",
    "15723207321",
    "15727421793"
  )
  and tbpedidocompra.idstatus <> 2
  and tbprodutoestoque.idestoque = 7141524213
group by
  tbproduto.idsku;