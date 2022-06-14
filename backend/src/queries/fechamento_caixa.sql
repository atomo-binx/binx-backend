select
  tbpedidovenda.idpedidovenda,
  tbpedidovenda.cliente,
  tbpedidovenda.totalvenda,
  tbpedidovenda.formapagamento,
  tbocorrenciavenda.datapedido,
  tbocorrenciavenda.situacao as "ocorrencia",
  tbocorrenciavenda.dataocorrencia
from
  tbpedidovenda
  join tbocorrenciavenda on tbpedidovenda.idpedidovenda = tbocorrenciavenda.idpedidovenda
where
  tbpedidovenda.idloja = 203398261
  and tbpedidovenda.idstatusvenda = 9
  and tbocorrenciavenda.dataocorrencia between '2022-05-13 00:00:00'
  and '2022-05-13 23:59:59';

-- Filtrar por método de pagamento
select
  tbpedidovenda.formapagamento,
  sum(tbpedidovenda.totalvenda) as "total_venda"
from
  tbpedidovenda
  join tbocorrenciavenda on tbpedidovenda.idpedidovenda = tbocorrenciavenda.idpedidovenda
where
  tbpedidovenda.idloja = 203398261
  and tbpedidovenda.idstatusvenda = 9
  and tbpedidovenda.formapagamento = "Loja - Dinheiro" -- and tbpedidovenda.formapagamento = "Loja - Cartão de Débito"
  -- and tbpedidovenda.formapagamento = "Loja - Cartão de Crédito"
  -- and tbpedidovenda.formapagamento = "Loja - Transferência "
  and tbocorrenciavenda.dataocorrencia between '2022-05-13 00:00:00'
  and '2022-05-13 23:59:59';