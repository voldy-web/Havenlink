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
