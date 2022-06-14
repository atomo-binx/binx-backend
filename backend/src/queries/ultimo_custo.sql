select
  idsku as "SKU",
  nome as "Nome",
  replace(ultimocusto, ".", ",") as "Último Custo"
from
  tbproduto
where
  situacao = 1
  and idsku <> ""