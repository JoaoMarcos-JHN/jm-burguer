-- Writes an order, its items and their options in one transaction, so a
-- failure halfway never leaves an order without items.
-- Prices arrive already recalculated by the server (lib/orders/price-order.ts);
-- the table constraints check the arithmetic once more.
-- Only the service role may call it: the public cannot create orders directly.

create function create_order(p_order jsonb, p_items jsonb)
returns table (id uuid, number bigint)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number bigint;
  v_item jsonb;
  v_item_id uuid;
begin
  insert into orders (
    customer_name, customer_phone, fulfillment, delivery_zone_id,
    address_cep, address_street, address_number, address_complement,
    address_neighborhood, address_reference,
    payment_method, change_for_cents,
    subtotal_cents, delivery_fee_cents, total_cents, notes
  )
  values (
    p_order ->> 'customer_name',
    p_order ->> 'customer_phone',
    (p_order ->> 'fulfillment')::fulfillment_type,
    nullif(p_order ->> 'delivery_zone_id', '')::uuid,
    nullif(p_order ->> 'address_cep', ''),
    nullif(p_order ->> 'address_street', ''),
    nullif(p_order ->> 'address_number', ''),
    nullif(p_order ->> 'address_complement', ''),
    nullif(p_order ->> 'address_neighborhood', ''),
    nullif(p_order ->> 'address_reference', ''),
    (p_order ->> 'payment_method')::payment_method,
    (p_order ->> 'change_for_cents')::integer,
    (p_order ->> 'subtotal_cents')::integer,
    (p_order ->> 'delivery_fee_cents')::integer,
    (p_order ->> 'total_cents')::integer,
    nullif(p_order ->> 'notes', '')
  )
  returning orders.id, orders.number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (
      order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents, notes
    )
    values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name',
      (v_item ->> 'unit_price_cents')::integer,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'line_total_cents')::integer,
      nullif(v_item ->> 'notes', '')
    )
    returning order_items.id into v_item_id;

    insert into order_item_options (
      order_item_id, option_id, group_name, option_name, unit_price_cents, quantity
    )
    select
      v_item_id,
      (o ->> 'option_id')::uuid,
      o ->> 'group_name',
      o ->> 'option_name',
      (o ->> 'unit_price_cents')::integer,
      (o ->> 'quantity')::integer
    from jsonb_array_elements(coalesce(v_item -> 'options', '[]'::jsonb)) as o;
  end loop;

  return query select v_order_id, v_order_number;
end;
$$;

revoke execute on function create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function create_order(jsonb, jsonb) to service_role;
