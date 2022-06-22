SELECT
  tbfornecedor.nomefornecedor as "Fornecedor",
  count(tbpedidocompra.idfornecedor) as "Pedidos no Período",
  avg(
    datediff(
      tbpedidocompra.dataconclusao,
      tbpedidocompra.datacriacao
    )
  ) as "Lead Time Médio"
FROM
  bdBau.tbpedidocompra
  join tbfornecedor on tbpedidocompra.idfornecedor = tbfornecedor.idfornecedor
where
  tbpedidocompra.idstatus = 1
  and datacriacao between '2022-04-01 00:00:00'
  and '2022-06-30 23:59:59'
group by
  tbfornecedor.idfornecedor;