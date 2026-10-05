# Haven Link API

The backend for Haven Link: Node.js, Express and PostgreSQL.

## What it does so far
- `GET /api/health` and `GET /api/health/db`: is the server (and database) up?
- `POST /api/auth/register`: create an account (roles: resident, owner, pro, vendor).
- `POST /api/auth/login`: sign in, returns a token.
- `GET /api/auth/me`: who is signed in (needs `Authorization: Bearer <token>`).

Passwords are stored only as bcrypt hashes. Sign-in is rate limited. Reports,
viewings, orders, properties and products are added in later steps.

## Run it on your computer
1. Install PostgreSQL and create an empty database, for example `havenlink`.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET`
   (the file explains how to make a secret). `.env` is never committed.
4. `npm run dev` starts the API at http://localhost:4000. The tables are created
   automatically on start.
5. In the project's root `.env` set `VITE_API_URL=http://localhost:4000`, then run
   the site with `npm run dev` as usual.

Run the tests (they use a separate database and empty its tables, so give them
their own, e.g. `havenlink_test`, via `TEST_DATABASE_URL`): `npm test`

## Put it on Render
1. **Database:** New > PostgreSQL. When it is ready, copy its **Internal Database URL**.
2. **API:** New > Web Service, pick this repository, then:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
   - Environment variables:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = the Internal Database URL
     - `JWT_SECRET` = a long random secret (32+ characters)
     - `CLIENT_ORIGIN` = your website address, with no trailing slash, for example `https://havenlink.onrender.com`
3. **Website:** in the Static Site's Environment, set `VITE_API_URL` to the API's
   address (for example `https://havenlink-api.onrender.com`), then redeploy the
   site. Until you do, the site keeps running in demo mode.

Check Render's current free-plan limits for databases and web services
(free services sleep when idle and free databases can expire).

## Homes and shop products (the catalog)

The homes and shop products live in the database (tables `properties` and `products`).
The starter catalog is kept in `server/seed/properties.json` and `server/seed/products.json`.
Every time the server starts it loads those files: starter rows are added or updated to
match the files, starter rows removed from the files are deleted, and rows created by
owners or vendors (source `owner`) are never touched. You can also run it by hand with
`npm run seed`.

To change the starter catalog (for example after adding photos), edit the data in the
website's `src/data/` folder and run `node scripts/export-catalog.mjs` in the project root. That
rewrites the two seed files. Then commit them and push.

Orders are priced by the server from the `products` table (plus any chosen options).
Names and prices sent by the browser are ignored.

## Owner listings, photos and the admin account

- Owners post homes (`/api/owner/properties`). A new or edited home waits for an admin to
  approve it (`/api/admin/properties`) and is hidden from the public until then.
- Photos are uploaded to `/api/images` (JPEG, PNG or WebP, up to about 700 KB each) and are
  kept in the database. Anyone can view a photo; only owners and vendors can upload.
- There is no sign-up form for admins. Create one with the script below, giving the details
  in environment variables (PowerShell). Run it from the `server` folder:

  ```powershell
  $env:ADMIN_EMAIL = "you@example.com"
  $env:ADMIN_NAME = "Your Name"
  $env:ADMIN_PASSWORD = "a long password you will remember"
  npm run create-admin
  ```

  It uses `DATABASE_URL`. To make an admin for the LIVE site, set `DATABASE_URL` to the live
  (Neon) address for that one command only, then close the window. Never save the address or
  the password in a file, and never commit them.

## Reaching owners: messages and viewing requests

- A visitor can message the owner of any home that an owner posted (`POST /api/messages` with
  `kind: "owner"` and the `propertyId`). The conversation belongs to both people: each sees it in
  their own list, with unread counts, and either can write. Writing again about the same home
  continues the same conversation. The starter homes still use their sample agents.
- Owners answer viewing requests for their own homes: `GET /api/owner/viewings`, then
  `POST /api/owner/viewings/:reference/confirm | decline | reschedule`. Declining needs a short
  reason and rescheduling needs a new date and time. The visitor sees the status and the note.
- `GET /api/owner/summary` returns the number of waiting requests (for the badge in the owner's menu).
- Deleting an owner's account also deletes their conversations.
