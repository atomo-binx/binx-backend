select
tbproduto.idsku, tbproduto.nome,
max(tbcompraproduto.idpedidocompra) as pedido, 
tbstatuscompra.nome as situação,
tbcompraproduto.quantidade, replace(tbcompraproduto.valor, ".", ",") as custo,
tbfornecedor.nomefornecedor as fornecedor
from tbproduto 
inner join tbcompraproduto on tbproduto.idsku = tbcompraproduto.idsku
inner join tbpedidocompra on tbcompraproduto.idpedidocompra = tbpedidocompra.idpedidocompra
inner join tbfornecedor on tbpedidocompra.idfornecedor = tbfornecedor.idfornecedor
inner join tbstatuscompra on tbpedidocompra.idstatus = tbstatuscompra.idstatus
where 
-- Restrições de Produto
tbproduto.idsku regexp("^[0-9]+$")
and tbproduto.situacao = true
-- Restrições de Fornecedor: Baú, Loja Física, Transferência
and tbfornecedor.idfornecedor not in("7401278638", "9172761844", "10733118103")
-- Restriçõs de Pedido de Compra: que não sejam "cancelado"
and tbpedidocompra.idstatus <> 2
-- Agrupamento
group by tbproduto.idsku;