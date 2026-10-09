# Production Deployment

## 1. Target Infrastructure

Hostinger VPS running:

``` text
Ubuntu 24.04 LTS
Docker
Docker Compose
Nginx
Cloudflare
```

Recommended initial class:

``` text
2–4 vCPU
8 GB RAM
100 GB+ NVMe
```

The exact Hostinger plan can change; size based on real traffic and
workload.

## 2. Docker Services

``` text
nginx
frontend
medusa-server
medusa-worker
postgres
redis
```

Example:

``` text
docker-compose.yml

services:
  nginx:
  frontend:
  medusa-server:
  medusa-worker:
  postgres:
  redis:
```

Do not expose PostgreSQL or Redis directly to the internet.

## 3. Domains

``` text
example.com              -> Next.js
www.example.com          -> Next.js
api.example.com          -> Medusa
admin.example.com        -> Admin
```

If using a path-based custom admin:

``` text
example.com/admin
```

Use whichever model gives the cleanest security and deployment boundary.

## 4. Environment Variables

### Frontend

``` text
NEXT_PUBLIC_MEDUSA_URL
NEXT_PUBLIC_RAZORPAY_KEY_ID
NEXT_PUBLIC_SITE_URL
```

Never put private secrets in `NEXT_PUBLIC_*`.

### Backend

``` text
NODE_ENV
DATABASE_URL
REDIS_URL
JWT_SECRET
COOKIE_SECRET

STORE_CORS
ADMIN_CORS
AUTH_CORS

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET

AMAZON_SHIPPING_CLIENT_ID
AMAZON_SHIPPING_CLIENT_SECRET
AMAZON_SHIPPING_ACCOUNT_ID

RESEND_API_KEY

S3_ACCESS_KEY
S3_SECRET_KEY
S3_BUCKET
S3_REGION

SENTRY_DSN
```

Use secrets management / protected environment variables. Never commit
`.env`.

## 5. Production Build

``` text
git push
  ↓
CI
  ↓
Lint
  ↓
Typecheck
  ↓
Unit tests
  ↓
Build
  ↓
Docker image
  ↓
Deploy
  ↓
Database migrations
  ↓
Restart server
  ↓
Restart worker
  ↓
Health checks
```

## 6. Medusa Server / Worker

Run two application processes:

``` text
medusa-server
MEDUSA_WORKER_MODE=server

medusa-worker
MEDUSA_WORKER_MODE=worker
```

Medusa recommends separate server and worker deployment modes for
production. Redis-backed workflow execution is also recommended for
production.

## 7. Database Migration

Run migrations as a controlled deployment step.

Never blindly reset production databases.

Backup before destructive migrations.

## 8. Health Checks

Frontend:

``` text
GET /
```

API:

``` text
GET /health
```

Database:

``` text
SELECT 1
```

Redis:

``` text
PING
```

Worker:

-   heartbeat
-   queue health
-   last successful job timestamp

## 9. Monitoring

### Sentry

Track:

-   Frontend exceptions
-   API exceptions
-   Payment errors
-   Webhook failures
-   Amazon API failures
-   Worker failures

### Structured Logs

Every request should include:

``` text
request_id
user_id where available
route
status
duration
```

Every webhook should include:

``` text
provider
external_event_id
request_id
processing_status
```

## 10. Cloudflare

Use Cloudflare for:

-   DNS
-   TLS
-   Basic edge protection
-   CDN/static caching where appropriate

Do not cache authenticated API responses.

## 11. Security

Enable:

-   HTTPS
-   Firewall
-   SSH keys
-   Fail2ban or equivalent
-   Automatic security updates where appropriate
-   Strong secrets
-   Database private networking
-   Redis private networking
-   Admin RBAC
-   Audit logging

## 12. Deployment Rollback

If deployment fails:

``` text
Stop rollout
 ↓
Keep previous container image
 ↓
Check migrations
 ↓
Inspect logs
 ↓
Rollback application
 ↓
Restore database only if required
```

Do not automatically roll back a database schema after arbitrary data
migrations.

## 13. Backups

Minimum:

``` text
Daily PostgreSQL backup
Weekly full server backup
Off-server copy
Monthly restore test
```

## 14. Staging

Staging should use:

``` text
staging database
staging Redis
test Razorpay credentials
Amazon Shipping sandbox/test credentials where available
staging storage
staging email domain
```

Never test payment/refund/shipment mutations against production
accidentally.

## 15. Launch Checklist

### Commerce

-   Products
-   Variants
-   Inventory
-   Pricing
-   Tax
-   Cart
-   Checkout
-   Razorpay

### UAV

-   Compatibility rules
-   Configurator
-   Manufacturing workflow
-   Flight test
-   QC

### Shipping

-   Amazon account connected
-   Shipment creation tested
-   Tracking tested
-   Webhook/polling tested
-   RTO/exception mapping tested

### Security

-   HTTPS
-   Firewall
-   Secrets
-   RBAC
-   Audit log
-   Backups

### Observability

-   Sentry
-   Logs
-   Health checks
-   Alerts

### Final

-   Mobile QA
-   Desktop QA
-   SEO
-   Sitemap
-   Robots
-   Legal pages
-   Terms
-   Privacy
-   Shipping policy
-   Return/refund policy
-   Warranty policy
