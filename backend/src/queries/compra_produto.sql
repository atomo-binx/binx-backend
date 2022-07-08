SELECT
  tbcompraproduto.idsku as "SKU",
  tbcompraproduto.idpedidocompra as "Pedido",
  tbcompraproduto.produto as "Produto",
  replace(tbcompraproduto.valor, ".", ",") as "Valor",
  tbcompraproduto.quantidade as "Quantidade",
  date_format(tbpedidocompra.datacriacao, "%d/%m/%Y") as "Data",
  tbstatuscompra.nome as "Situação",
  tbfornecedor.nomefornecedor as "Fornecedor",
  tbcompraproduto.codigofornecedor as "Cód. Fornecedor"
FROM
  bdBau.tbcompraproduto
  inner join tbpedidocompra on tbpedidocompra.idpedidocompra = tbcompraproduto.idpedidocompra
  inner join tbstatuscompra on tbpedidocompra.idstatus = tbstatuscompra.idstatus
  inner join tbfornecedor on tbpedidocompra.idfornecedor = tbfornecedor.idfornecedor
  inner join tbproduto on tbcompraproduto.idsku = tbproduto.idsku
where
  tbpedidocompra.idfornecedor not in(
    "7401278638",
    "9172761844",
    "10733118103",
    "12331146486",
    "15723207321",
    "15727421793"
  )
  and tbpedidocompra.idstatus <> 2
  and tbproduto.idsku regexp("^[0-9]+$")
  and tbproduto.situacao = 1
order by
  datacriacao desc;