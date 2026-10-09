# UAV Commerce Platform

Production documentation for a custom e-commerce and UAV operations
platform selling:

-   Prebuilt UAVs
-   UAV frames and kits
-   Flight controllers, ESCs, motors, propellers
-   GPS, telemetry, radios and sensors
-   Batteries and power systems
-   Accessories and spare parts
-   B2B / bulk orders

## Product Goal

Build a premium, technical commerce experience inspired by the
information architecture of specialist electronics/UAV stores, while
maintaining an original brand identity.

The platform has four major areas:

1.  Customer storefront
2.  Commerce backend
3.  Custom UAV operations/admin system
4.  Shipment/payment/infrastructure integrations

## Final Technology Stack

  Layer                            Technology
  -------------------------------- -----------------------------------------
  Storefront                       Next.js + TypeScript
  UI                               Tailwind CSS + shadcn/ui
  Motion                           Framer Motion
  Commerce                         Medusa v2
  Custom backend                   Medusa modules + workflows + API routes
  Database                         PostgreSQL
  Cache / jobs / workflow engine   Redis
  Product media                    Cloudinary or S3-compatible storage
  Payment                          Razorpay
  Shipping                         Amazon Shipping API
  Email                            Resend
  Analytics                        PostHog
  Monitoring                       Sentry
  Source control                   GitHub
  Hosting                          Hostinger VPS
  Reverse proxy                    Nginx
  Edge / DNS / SSL                 Cloudflare
  Containers                       Docker / Docker Compose

## Core Principle

Do not build a second e-commerce engine beside Medusa.

Medusa owns:

-   Products
-   Variants
-   Carts
-   Checkout
-   Customers
-   Orders
-   Inventory
-   Payments
-   Fulfillment
-   Promotions
-   Regions / tax / sales channels

Custom UAV functionality owns:

-   Compatibility
-   UAV configuration
-   Build validation
-   Assembly
-   Firmware configuration
-   Calibration
-   Flight testing
-   QC
-   UAV manufacturing timeline
-   Technical documentation

## Documentation Map

-   `ARCHITECTURE.md` --- system architecture and infrastructure
-   `BACKEND.md` --- backend modules, project structure and server rules
-   `FRONTEND.md` --- storefront and admin UI architecture
-   `API.md` --- API contract and endpoint conventions
-   `WORKFLOWS.md` --- customer, payment, order, UAV manufacturing and
    shipping workflows
-   `DATABASE.md` --- data model and relationships
-   `DEPLOYMENT.md` --- Hostinger/Docker production deployment

## Environments

-   Development: local Docker
-   Staging: `staging.example.com`
-   Production: `example.com`

Never share production credentials with development or staging.

## Non-Negotiable Rules

1.  PostgreSQL is the source of truth.
2.  Redis is infrastructure, not business data.
3.  Product images and documents do not live in PostgreSQL.
4.  Payment success is verified server-side.
5.  Webhooks are idempotent.
6.  Admin actions are audited.
7.  Frontend never talks directly to PostgreSQL.
8.  Amazon Shipping credentials never reach the browser.
9.  Compatibility rules are data-driven, not hardcoded in React.
10. Business order state, shipment state and UAV manufacturing state are
    separate.
