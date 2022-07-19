SELECT
  tbprodutoestoque.idsku as "SKU",
  tbproduto.nome as "Produto",
  tbprodutoestoque.quantidade as "Geral",
  loja.quantidade as "Loja",
  tbproduto.localizacao as "Localização"
FROM
  bdBau.tbprodutoestoque
  inner join (
    SELECT
      idsku,
      quantidade
    FROM
      bdBau.tbprodutoestoque
    where
      idestoque = 9172701393
  ) as loja on tbprodutoestoque.idsku = loja.idsku
  inner join tbproduto on tbproduto.idsku = tbprodutoestoque.idsku
where
  idestoque = 7141524213
  AND tbproduto.idsku REGEXP("^[0-9]+$")
  AND tbproduto.situacao = 1;