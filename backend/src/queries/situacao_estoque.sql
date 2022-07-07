SELECT
  tbproduto.idsku as "SKU",
  tbproduto.nome as " Produto",
  tbproduto.curva as "Curva",
  tbprodutoestoque.minimo as "Min",
  tbprodutoestoque.maximo as "Max",
  tbprodutoestoque.quantidade as "Qntd",
  case
    when tbprodutoestoque.quantidade > tbprodutoestoque.minimo then "Acima"
    when tbprodutoestoque.quantidade < tbprodutoestoque.minimo then "Abaixo"
    when tbprodutoestoque.quantidade = tbprodutoestoque.minimo then "Igual"
    else "-"
  end as "Situação",
  replace(
    round(
      (
        tbprodutoestoque.quantidade / tbprodutoestoque.minimo
      ),
      2
    ),
    ".",
    ","
  ) as "Cobertura"
FROM
  tbproduto
  inner join tbprodutoestoque on tbproduto.idsku = tbprodutoestoque.idsku
where
  tbprodutoestoque.idestoque = 7141524213
  and tbproduto.idsku regexp("^[0-9]+$")
  and tbproduto.situacao = 1;