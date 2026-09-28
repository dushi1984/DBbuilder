-- Gridboard demo dataset (idempotent)

TRUNCATE orders RESTART IDENTITY;
TRUNCATE customers RESTART IDENTITY;
TRUNCATE products RESTART IDENTITY;

INSERT INTO products (name, category, unit_price) VALUES
  ('Nimbus Desk Chair',      'Furniture',   189.00),
  ('Orbit Task Lamp',        'Lighting',     39.50),
  ('Vector Monitor Stand',   'Accessories',  54.00),
  ('Cascade Standing Desk',  'Furniture',   549.00),
  ('Signal USB-C Hub',       'Accessories',  42.00),
  ('Drift Mechanical Keyboard', 'Peripherals', 129.00),
  ('Flux Wireless Mouse',    'Peripherals',  59.00),
  ('Halo 27-inch Monitor',   'Displays',    329.00),
  ('Pilot Webcam Pro',       'Peripherals',  99.00),
  ('Anchor Cable Kit',       'Accessories',  19.50),
  ('Echo Studio Speakers',   'Audio',       149.00),
  ('Terra Luggage Set',      'Travel',      279.00);

INSERT INTO customers (name, country, segment, created_at)
SELECT
  'Customer ' || g,
  (ARRAY['United States','Germany','Japan','Brazil','India','United Kingdom'])[1 + g % 6],
  (ARRAY['Enterprise','Mid-market','SMB'])[1 + g % 3],
  DATE '2025-01-02' + ((g * 7) % 300)
FROM generate_series(1, 48) AS g;

INSERT INTO orders (customer_id, product_id, quantity, unit_price, status, channel, region, ordered_at)
SELECT
  1 + (g * 13) % 48,
  1 + (g * 5) % 12,
  1 + (g % 4),
  round((SELECT unit_price FROM products WHERE id = 1 + (g * 5) % 12) * (0.85 + (g % 10) * 0.03), 2),
  (ARRAY['delivered','delivered','delivered','shipped','processing','cancelled'])[1 + g % 6],
  (ARRAY['online','online','retail','partner'])[1 + g % 4],
  (ARRAY['North America','Europe','APAC','LATAM'])[1 + g % 4],
  TIMESTAMP '2025-02-01 09:00:00' + (((g * 23) % 330) * INTERVAL '1 day') + (((g * 7) % 24) * INTERVAL '1 hour')
FROM generate_series(1, 420) AS g;

/* --------------------------- Starter dashboard --------------------------- */

INSERT INTO dashboards (id, name, created_at, updated_at) VALUES
  ('9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51', 'Revenue overview', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000001-1111-4111-8111-111111111111', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Total revenue',
   E'SELECT round(sum(unit_price * quantity)) AS value, ''Revenue, last 12 months'' AS sub FROM orders WHERE status <> ''cancelled''',
   'kpi', 3, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000002-2222-4222-8222-222222222222', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Orders',
   E'SELECT count(*) AS value, ''Orders, last 12 months'' AS sub FROM orders WHERE status <> ''cancelled''',
   'kpi', 3, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000003-3333-4333-8333-333333333333', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Avg order value',
   E'SELECT round(sum(unit_price * quantity) / nullif(count(*), 0), 2) AS value, ''Average order value'' AS sub FROM orders WHERE status <> ''cancelled''',
   'kpi', 3, 2)

ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000004-4444-4444-8444-444444444444', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Customers',
   E'SELECT count(*) AS value, ''Registered customers'' AS sub FROM customers',
   'kpi', 3, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000005-5555-4555-8555-555555555555', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Monthly revenue',
   E'SELECT to_char(ordered_at, ''YYYY-MM'') AS month, round(sum(unit_price * quantity)) AS revenue FROM orders WHERE status <> ''cancelled'' GROUP BY 1 ORDER BY 1',
   'bar', 8, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000006-6666-4666-8666-666666666666', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Revenue by channel',
   E'SELECT channel AS name, round(sum(unit_price * quantity)) AS revenue FROM orders WHERE status <> ''cancelled'' GROUP BY 1 ORDER BY 2 DESC',
   'pie', 4, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO widgets (id, dashboard_id, name, sql, type, span, "order") VALUES
  ('a1000007-7777-4777-8777-777777777777', '9f6a2c10-7c4b-4d5e-9a01-3b2c1d0e4f51',
   'Top products',
   E'SELECT p.name AS product, sum(o.quantity) AS units, round(sum(o.unit_price * o.quantity)) AS revenue FROM orders o JOIN products p ON p.id = o.product_id WHERE o.status <> ''cancelled'' GROUP BY p.name ORDER BY 3 DESC LIMIT 8',
   'table', 12, 6)
ON CONFLICT (id) DO NOTHING;

ANALYZE;
