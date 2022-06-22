SELECT
  tbproduto.idsku as "SKU",
  tbproduto.nome as "Nome",
  tbproduto.curva as "Curva",
  tbprodutoestoque.quantidade as "Qntd"
from
  tbproduto
  JOIN tbprodutoestoque on tbproduto.idsku = tbprodutoestoque.idsku
WHERE
  tbproduto.situacao = 1
  AND tbproduto.idsku <> ""
  AND tbproduto.idsku REGEXP("^[0-9]+$")
  AND tbprodutoestoque.quantidade < 1
  AND tbprodutoestoque.idestoque = 7141524213;