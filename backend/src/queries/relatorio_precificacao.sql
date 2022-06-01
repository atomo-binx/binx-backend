select
  tbproduto.idsku as "SKU",
  tbproduto.nome as "Produto",
  replace(tbproduto.precovenda, ".", ",") as "Preço de Venda",
  replace(tbproduto.ultimocusto, ".", ",") as "Último Custo",
  replace(tbcompraproduto.valor, ".", ",") as "Valor de Compra",
  tbcompraproduto.quantidade as "Quantidade",
  case
    when tbcompraproduto.valor > tbproduto.ultimocusto then "Maior"
    when tbcompraproduto.valor < tbproduto.ultimocusto then "Menor"
    when tbcompraproduto.valor = tbproduto.ultimocusto then "Igual"
    else "-"
  end as "Situação",
  tbpedidocompra.idpedidocompra as "Pedido",
  tbfornecedor.nomefornecedor as "Fornecedor",
  replace(
    (tbproduto.precovenda - tbcompraproduto.valor) / tbproduto.precovenda,
    ".",
    ","
  ) as "Margem"
from
  tbproduto
  join tbcompraproduto on tbproduto.idsku = tbcompraproduto.idsku
  join tbpedidocompra on tbcompraproduto.idpedidocompra = tbpedidocompra.idpedidocompra
  join tbfornecedor on tbpedidocompra.idfornecedor = tbfornecedor.idfornecedor
where
  tbpedidocompra.idstatus = 3