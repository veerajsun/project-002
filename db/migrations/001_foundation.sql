-- Sabland backend foundation (PostgreSQL 13 or newer).
-- Money is stored as whole PAISE (integers): Rs 2,499 = 249900. No decimals, no rounding errors.
-- Statuses are text + CHECK (easy to extend later with a new migration).
-- This migration is applied inside ONE transaction by scripts/db-migrate.mjs:
-- if anything fails, nothing is half-created.

CREATE TABLE products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  pack_grams    integer NOT NULL,
  price_paise   integer NOT NULL,
  mrp_paise     integer NOT NULL,
  is_available  boolean NOT NULL DEFAULT true,
  status        text NOT NULL DEFAULT 'ACTIVE',
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  CONSTRAINT products_name_length CHECK (length(name) BETWEEN 1 AND 300),
  CONSTRAINT products_pack_positive CHECK (pack_grams > 0),
  CONSTRAINT products_price_positive CHECK (price_paise > 0),
  CONSTRAINT products_price_le_mrp CHECK (price_paise <= mrp_paise),
  CONSTRAINT products_status_valid CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED'))
);
CREATE INDEX products_status_sort_idx ON products (status, sort_order);

CREATE TABLE product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  path        text NOT NULL,
  sort_order  integer NOT NULL,
  CONSTRAINT product_images_sort_valid CHECK (sort_order >= 0),
  CONSTRAINT product_images_unique_sort UNIQUE (product_id, sort_order)
);

-- One row per phone-verification attempt. NOTHING in this project creates a VERIFIED row yet:
-- real SMS verification (server side) is a later step. Orders can only exist with a VERIFIED row.
CREATE TABLE phone_verifications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                text NOT NULL,
  status               text NOT NULL DEFAULT 'PENDING',
  code_hash            text,              -- keyed hash of the code. NEVER the code itself
  attempts             integer NOT NULL DEFAULT 0,
  session_token_hash   text UNIQUE,       -- hash of the random token kept in an httpOnly cookie
  provider_message_id  text,
  expires_at           timestamptz NOT NULL,
  verified_at          timestamptz,
  consumed_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pv_phone_format CHECK (phone ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT pv_status_valid CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED', 'CONSUMED', 'FAILED')),
  CONSTRAINT pv_attempts_valid CHECK (attempts >= 0),
  CONSTRAINT pv_verified_has_time CHECK (status <> 'VERIFIED' OR verified_at IS NOT NULL),
  CONSTRAINT pv_consumed_has_times CHECK (status <> 'CONSUMED' OR (verified_at IS NOT NULL AND consumed_at IS NOT NULL))
);
CREATE INDEX phone_verifications_phone_idx ON phone_verifications (phone, created_at DESC);

CREATE SEQUENCE order_number_seq START 1;

CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text NOT NULL UNIQUE
                   DEFAULT ('SBL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0')),
  status           text NOT NULL DEFAULT 'NEW',
  payment_method   text NOT NULL DEFAULT 'COD',
  currency         text NOT NULL DEFAULT 'INR',
  customer_name    text NOT NULL,
  customer_phone   text NOT NULL,                                   -- the VERIFIED phone
  subtotal_paise   integer NOT NULL,
  savings_paise    integer NOT NULL DEFAULT 0,
  shipping_paise   integer NOT NULL DEFAULT 0,
  total_paise      integer NOT NULL,
  verification_id  uuid NOT NULL UNIQUE REFERENCES phone_verifications (id),  -- one verification = one order
  idempotency_key  text NOT NULL UNIQUE,                            -- a double-click cannot create two orders
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_cod_only CHECK (payment_method = 'COD'),
  CONSTRAINT orders_inr_only CHECK (currency = 'INR'),
  CONSTRAINT orders_status_valid CHECK (status IN ('NEW', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RTO')),
  CONSTRAINT orders_phone_format CHECK (customer_phone ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT orders_name_length CHECK (length(trim(customer_name)) BETWEEN 2 AND 60),
  CONSTRAINT orders_subtotal_positive CHECK (subtotal_paise > 0),
  CONSTRAINT orders_amounts_not_negative CHECK (savings_paise >= 0 AND shipping_paise >= 0),
  CONSTRAINT orders_total_matches CHECK (total_paise = subtotal_paise + shipping_paise),
  CONSTRAINT orders_idempotency_length CHECK (length(idempotency_key) BETWEEN 16 AND 64)
);
CREATE INDEX orders_created_idx ON orders (created_at DESC);
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX orders_phone_idx ON orders (customer_phone);

CREATE TABLE order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products (id),
  product_slug      text NOT NULL,        -- snapshots: what the customer bought, as it was then
  product_name      text NOT NULL,
  pack_grams        integer NOT NULL,
  unit_price_paise  integer NOT NULL,
  mrp_paise         integer NOT NULL,
  quantity          integer NOT NULL,
  line_total_paise  integer NOT NULL,
  CONSTRAINT order_items_unique_product UNIQUE (order_id, product_id),
  CONSTRAINT order_items_quantity_valid CHECK (quantity BETWEEN 1 AND 10),
  CONSTRAINT order_items_price_positive CHECK (unit_price_paise > 0),
  CONSTRAINT order_items_line_matches CHECK (line_total_paise = unit_price_paise * quantity)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);

CREATE TABLE delivery_addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  mobile      text NOT NULL,
  house       text NOT NULL,
  street      text NOT NULL,
  landmark    text,
  city        text NOT NULL,
  state       text NOT NULL,
  pin_code    text NOT NULL,
  country     text NOT NULL DEFAULT 'IN',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT da_name_length CHECK (length(trim(full_name)) BETWEEN 2 AND 60),
  CONSTRAINT da_mobile_format CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT da_pin_format CHECK (pin_code ~ '^[1-9][0-9]{5}$'),
  CONSTRAINT da_country_india CHECK (country = 'IN')
);

CREATE TABLE order_status_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ose_to_status_valid CHECK (to_status IN ('NEW', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RTO'))
);
CREATE INDEX order_status_events_order_idx ON order_status_events (order_id, created_at);
