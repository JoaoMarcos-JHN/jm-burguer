-- Demo data for the portfolio version. Store details are fictional.
-- Products come from the original JM Burguer menu.

insert into store_settings (name, tagline, address, whatsapp_number, pix_key, accepts_pickup, min_order_cents)
values (
  'JM Burguer',
  'Hambúrguer artesanal em Campinas',
  'Rua Afonso Vieira, 10 - Campinas, SP',
  '5519900000000',
  'pix@jmburguer.exemplo',
  true,
  2000
);

-- Thursday to Sunday, 18:00 to 23:00 (weekday: 0 = Sunday).
insert into opening_hours (weekday, opens_at, closes_at) values
  (4, '18:00', '23:00'),
  (5, '18:00', '23:00'),
  (6, '18:00', '23:00'),
  (0, '18:00', '23:00');

insert into delivery_zones (neighborhood, fee_cents, sort_order) values
  ('Centro', 500, 1),
  ('Cambuí', 600, 2),
  ('Guanabara', 600, 3),
  ('Castelo', 700, 4),
  ('Taquaral', 800, 5),
  ('Barão Geraldo', 1200, 6);

insert into categories (name, slug, sort_order) values
  ('Burgers', 'burgers', 1),
  ('Bebidas', 'bebidas', 2);

insert into products (category_id, name, slug, description, price_cents, image_path, is_featured, sort_order)
select c.id, p.name, p.slug, p.description, p.price_cents, p.image_path, p.is_featured, p.sort_order
from (values
  ('burgers', 'Cheese Duplo Burguer', 'cheese-duplo-burguer',
   'Pão brioche tostado, duplo hambúrguer 150g artesanal, queijo prato derretido, alface crocante, tomate fresco e maionese da casa.',
   3499, 'hamb-1.png', false, 1),
  ('burgers', 'Cheddar Duplo Bacon', 'cheddar-duplo-bacon',
   'Pão brioche, duplo hambúrguer 150g artesanal, bacon, queijo prato derretido, alface crocante, tomate fresco e maionese da casa.',
   3199, 'hamb-2.png', false, 2),
  ('burgers', 'Clássico JM', 'classico-jm',
   'Pão brioche tostado, duplo hambúrguer 150g artesanal, bacon, queijo prato derretido, alface crocante, cebola roxa, tomate fresco e maionese da casa.',
   3099, 'hamb-3.png', false, 3),
  ('burgers', 'Blue Smash', 'blue-smash',
   'Dois smashs de carne suculenta, cheddar derretido, cebola roxa e molho especial JM no pão preto com gergelim azul.',
   3799, 'hamb-4.png', false, 4),
  ('burgers', 'Texano Flame', 'texano-flame',
   'Hambúrguer bovino 180g, bacon crocante, queijo prato, barbecue artesanal e cebola crispy.',
   3499, 'hamb-5.png', false, 5),
  ('burgers', 'Duplo Pecado', 'duplo-pecado',
   'Dois burgers 150g, cheddar duplo, bacon em tiras e molho JM.',
   3999, 'hamb-6.png', false, 6),
  ('burgers', 'Burguer do Chef', 'burguer-do-chef',
   'Receita exclusiva da casa que muda a cada semana.',
   4199, 'hamb-7.png', false, 7),
  ('burgers', 'JMBurguer Supremo', 'jmburguer-supremo',
   'Hambúrguer especial da casa, queijo cheddar, cebola caramelizada, picles, alface, tomate e molho exclusivo.',
   4399, 'hamb-8.png', true, 8),
  ('bebidas', 'Coca-Cola Lata', 'coca-cola-lata', '350 ml.', 599, 'refri-1.png', false, 1),
  ('bebidas', 'Guaraná Lata', 'guarana-lata', '350 ml.', 599, 'refri-2.png', false, 2)
) as p (category_slug, name, slug, description, price_cents, image_path, is_featured, sort_order)
join categories c on c.slug = p.category_slug;

-- Fixed ids so the groups can be linked to products below.
insert into option_groups (id, name, internal_name, min_select, max_select) values
  ('00000000-0000-0000-0000-000000000001', 'Ponto da carne', null, 1, 1),
  ('00000000-0000-0000-0000-000000000002', 'Adicionais', 'Adicionais dos burgers', 0, 5),
  ('00000000-0000-0000-0000-000000000003', 'Vire combo', null, 0, 1);

insert into options (option_group_id, name, price_cents, max_quantity, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Ao ponto', 0, 1, 1),
  ('00000000-0000-0000-0000-000000000001', 'Mal passado', 0, 1, 2),
  ('00000000-0000-0000-0000-000000000001', 'Bem passado', 0, 1, 3),
  ('00000000-0000-0000-0000-000000000002', 'Bacon extra', 500, 2, 1),
  ('00000000-0000-0000-0000-000000000002', 'Cheddar extra', 300, 2, 2),
  ('00000000-0000-0000-0000-000000000002', 'Hambúrguer extra 150g', 1000, 1, 3),
  ('00000000-0000-0000-0000-000000000002', 'Ovo', 300, 1, 4),
  ('00000000-0000-0000-0000-000000000002', 'Cebola caramelizada', 400, 1, 5),
  ('00000000-0000-0000-0000-000000000003', 'Batata frita média + refrigerante lata', 1990, 1, 1);

-- Every burger gets "Adicionais" and "Vire combo"; smash burgers are always
-- well done, so "Ponto da carne" skips the Blue Smash.
insert into product_option_groups (product_id, option_group_id, sort_order)
select p.id, g.option_group_id, g.sort_order
from products p
join categories c on c.id = p.category_id and c.slug = 'burgers'
cross join (values
  ('00000000-0000-0000-0000-000000000001'::uuid, 1),
  ('00000000-0000-0000-0000-000000000002'::uuid, 2),
  ('00000000-0000-0000-0000-000000000003'::uuid, 3)
) as g (option_group_id, sort_order)
where not (p.slug = 'blue-smash' and g.option_group_id = '00000000-0000-0000-0000-000000000001');
