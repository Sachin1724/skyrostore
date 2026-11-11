# Deploying Skyrostore to one VPS

Tested: all three images build and serve on Linux (backend store/admin/auth
routes, storefront pages with security headers, admin login redirect).
Not yet done on a real server or domain.

## 1. Server

Ubuntu 24.04, 4 GB RAM or more (Hostinger KVM 2+). Install Docker:
`curl -fsSL https://get.docker.com | sh`. Open ports 80 and 443 only.

## 2. DNS (Hostinger hPanel → DNS)

A records to the VPS IP: `@`, `www`, `api`, `admin`.

## 3. Configuration

```bash
git clone <repo> skyrostore && cd skyrostore
cp .env.example .env                       # build values: URLs, keys, Firebase
cp apps/backend/.env.example apps/backend/.env
cp apps/storefront/.env.example apps/storefront/.env
cp apps/admin/.env.example apps/admin/.env  # create from the storefront one if missing
sed -i 's/example.com/YOURDOMAIN.com/g' deploy/nginx/skyrostore.conf
```

Backend `.env` for production: Supabase `DATABASE_URL` + `DATABASE_SSL_CA=./supabase-ca.crt`,
fresh `JWT_SECRET` / `COOKIE_SECRET` / `STOREFRONT_PROXY_SECRET` (same proxy secret in the
storefront `.env`), `STORE_CORS=https://www.YOURDOMAIN.com`,
`ADMIN_CORS=https://admin.YOURDOMAIN.com`, `AUTH_CORS=` both, live Razorpay, Shipmozo and
Firebase values. The backend refuses to start with dev secrets.

## 4. First certificate (once)

nginx cannot start before a certificate exists, so issue it with certbot's own server:

```bash
docker compose run --rm -p 80:80 --entrypoint certbot certbot certonly --standalone \
  -d YOURDOMAIN.com -d www.YOURDOMAIN.com -d api.YOURDOMAIN.com -d admin.YOURDOMAIN.com \
  --email you@YOURDOMAIN.com --agree-tos --no-eff-email
```

## 5. Start

```bash
docker compose build
docker compose run --rm -e RUN_MIGRATIONS=1 backend   # migrations; Ctrl+C once "Server is ready"
docker compose up -d
```

Renewal runs inside the `certbot` service; add a weekly `docker compose exec nginx nginx -s reload`
cron so nginx serves renewed certificates.

## 6. After go-live

- Razorpay: webhook `https://api.YOURDOMAIN.com/webhooks/razorpay` (payment.captured, payment.failed),
  Magic Checkout shipping-info URL `https://api.YOURDOMAIN.com/razorpay/shipping-info`.
- Firebase → Authorized domains: `www.YOURDOMAIN.com`. Google Cloud → OAuth client →
  redirect URI `https://www.YOURDOMAIN.com/__/auth/handler`.
- Update: `git pull && docker compose build && docker compose up -d`.
