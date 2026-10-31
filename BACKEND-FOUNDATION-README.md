# Sabland backend foundation (step 1): database + safe API skeleton

Project folder: C:\Users\Admin\Desktop\sabaland-frontend-step1
NO existing file is changed. Homepage, product pages, cart, checkout, header, footer and Track Order are untouched.
Everything here is NEW. Cash on Delivery is the only payment. No order can be created yet (see the end).

## Database choice
PostgreSQL, through the `pg` package and plain SQL files (no ORM, no code generation).
- One DATABASE_URL works with a free PostgreSQL on your Windows PC AND with any hosted PostgreSQL.
- It is a normal network connection: no SSH is needed. You run the setup commands from your own PC.
- Limitation: if your web host only lets its database be used from the host itself ("localhost only"),
  you cannot run the setup from your PC. A hosted PostgreSQL that allows remote connections (for example Neon) works.
- Only 2 new packages: pg and @types/pg (both free).

## New files (22, including this README)
| Folder | Files |
|---|---|
| db/migrations | 001_foundation.sql (all tables) |
| scripts | db-migrate.mjs, db-seed.mjs, db-selftest.mjs, check-backend-foundation.mjs, _db-utils.mjs |
| src/server | constants, env, db, pricing, products, orders, verification, http, validation (.ts) |
| src/app/api | health, products, cart/quote, orders (route.ts each) |
| project root | .env.example, .gitignore, this README |

## Tables
products, product_images, phone_verifications, orders, order_items, delivery_addresses, order_status_events.
Money is stored in paise (whole numbers). The database itself refuses: any payment method except COD, totals that do
not add up, quantities outside 1-10, bad PIN codes/mobile numbers, and any order without a phone-verification record.

## API
GET  /api/health       database reachable? (reveals nothing else)
GET  /api/products     products from the database (prices in paise)
POST /api/cart/quote   prices a cart from DATABASE prices; prices sent by the browser are ignored; creates nothing
POST /api/orders       ALWAYS answers 503 "Phone verification is not available yet..." (no order, nothing saved)

## Windows setup (run in a VS Code PowerShell terminal, in the project folder)
1. Check Node:                       node -v
2. Install the 2 packages:           npm.cmd install pg@8
                                     npm.cmd install -D @types/pg@8
3. Get a database (pick ONE):
   a) Local: install PostgreSQL for Windows (free, postgresql.org -> Download -> Windows). Remember the
      password you choose for the "postgres" user. Open pgAdmin -> right-click Databases -> Create -> Database -> name: sabland
      DATABASE_URL = postgresql://postgres:YOUR_PASSWORD@localhost:5432/sabland
      (if the password has special characters such as @ or #, URL-encode them, e.g. @ becomes %40)
   b) Hosted: create a free PostgreSQL on a provider that allows remote connections and copy its connection string.
4. Create your secret file:          Copy-Item .env.example .env.local
   Open .env.local and put your real DATABASE_URL in it. NEVER share this file. It is ignored by git.
5. Safety check (no database needed): node scripts\check-backend-foundation.mjs
6. Create the tables:                node scripts\db-migrate.mjs
7. Add your 4 products:              node scripts\db-seed.mjs
8. Test the database rules:          node scripts\db-selftest.mjs      (everything is rolled back; nothing is kept)
9. Build, then run:                  npm.cmd run build
                                     npm.cmd run dev
10. Look at it:  http://localhost:3000/api/health   and   http://localhost:3000/api/products
    Price a cart:
      Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/cart/quote -ContentType "application/json" -Body '{"items":[{"slug":"khalta-500g","quantity":2}]}'
    Try to place an order (must be refused):
      try { Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/orders -ContentType "application/json" -Body '{}' } catch { $_.ErrorDetails.Message }

If any command prints an error, copy the full message and send it to me.

## Ordinary Node hosting without SSH
- Run steps 6-8 on your own PC with DATABASE_URL pointing at the hosted database.
- On the host, set the same DATABASE_URL (and SITE_ORIGIN = your https address) in its environment-variable settings.
- Never upload .env.local.

## Blocked until the real phone verification exists (a later step)
- Any order. src/server/verification.ts always returns "no proof", so POST /api/orders refuses everything.
- The database also refuses an order row without a phone-verification record.
- Not built here on purpose: SMS sending, OTP check, admin panel, Google Sheets, any payment service.
