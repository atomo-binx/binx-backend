SELECT
  tbproduto.idsku as "SKU",
  tbproduto.nome as "Produto",
  tbproduto.curva as "Curva",
  tbprodutoestoque.quantidade as "Qntd"
from
  tbproduto
  JOIN tbprodutoestoque ON tbproduto.idsku = tbprodutoestoque.idsku
  LEFT JOIN (
    -- PRODUTOS ZERADOS COM PEDIDO DE COMPRA
    SELECT
      tbproduto.idsku
    FROM
      tbproduto
      JOIN tbcompraproduto ON tbproduto.idsku = tbcompraproduto.idsku
      JOIN tbprodutoestoque ON tbcompraproduto.idsku = tbprodutoestoque.idsku
      JOIN tbpedidocompra ON tbcompraproduto.idpedidocompra = tbpedidocompra.idpedidocompra
      JOIN tbstatuscompra ON tbpedidocompra.idstatus = tbstatuscompra.idstatus
      JOIN tbfornecedor ON tbpedidocompra.idfornecedor = tbfornecedor.idfornecedor
    WHERE
      tbpedidocompra.idstatus IN (0, 3)
      AND tbproduto.idsku REGEXP ("^[0-9]+$")
      AND tbprodutoestoque.idestoque = 7141524213
      AND tbprodutoestoque.quantidade < 1
      AND tbfornecedor.idfornecedor NOT IN (
        7401278638,
        10733118103,
        12331146486,
        15723207321,
        15727421793,
        9172761844
      )
  ) as produtoszerados ON tbproduto.idsku = produtoszerados.idsku
WHERE
  tbproduto.situacao = 1
  AND tbproduto.idsku <> ""
  AND tbproduto.idsku REGEXP ("^[0-9]+$")
  AND tbprodutoestoque.idestoque = 7141524213
  AND tbprodutoestoque.quantidade < 1
  AND produtoszerados.idsku is null
  and tbproduto.curva = 'curva a';