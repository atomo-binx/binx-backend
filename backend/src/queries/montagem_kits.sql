SELECT
  idskupai as "SKU Pai",
  idskufilho as "SKU Filho",
  replace(tbkits.quantidade, '.', ',') as "Quantidade por Kit",
  nome as "Produto",
  replace(ultimocusto, '.', ',') as "Último Custo",
  replace(ultimocusto * tbkits.quantidade, ".", ",") as "Custo Total",
  tbprodutoestoque.quantidade as "Disponível",
  floor(tbprodutoestoque.quantidade / tbkits.quantidade) as "Possíveis"
FROM
  bdBau.tbkits
  inner join tbproduto on tbkits.idskufilho = tbproduto.idsku
  inner join tbprodutoestoque on tbkits.idskufilho = tbprodutoestoque.idsku
where
  tbprodutoestoque.idestoque = 7141524213;