select
  tbproduto.idsku,
  tbfornecedor.nomefornecedor,
  tbpedidocompra.idpedidocompra,
  tbstatuscompra.nome as "status",
  tbpedidocompra.datacriacao,
  tbcompraproduto.codigofornecedor
from
  tbproduto
  inner join tbcompraproduto on tbcompraproduto.idsku = tbproduto.idsku
  inner join tbpedidocompra on tbpedidocompra.idpedidocompra = tbcompraproduto.idpedidocompra
  inner join tbfornecedor on tbfornecedor.idfornecedor = tbpedidocompra.idfornecedor
  inner join tbstatuscompra on tbpedidocompra.idstatus = tbstatuscompra.idstatus
where
  tbproduto.idsku regexp ("^[0-9]+$")
  and tbproduto.situacao = 1
  and tbpedidocompra.idstatus <> 2
  and tbfornecedor.idfornecedor not in (
    -- Baú da Eletrônica Componentes Eletronicos Ltda -
    "7401278638",
    -- Loja Física
    "9172761844",
    -- TRANSFERENCIA
    "10733118103",
    -- estoque virtual
    "12331146486",
    -- ESTOQUE VIRTUAL
    "15723207321",
    -- LANÇAMENTO DE ESTOQUE DE PEDIDO
    "15727421793"
  )
order by
  tbpedidocompra.datacriacao desc;