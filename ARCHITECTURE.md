# System Architecture

## 1. High-Level Architecture

``` text
                         INTERNET
                            |
                     Cloudflare DNS/CDN
                            |
                         HTTPS
                            |
                          Nginx
                 ___________|____________
                |                        |
        Next.js Storefront        Medusa API/Admin
                |                        |
                |                  Server + Worker
                |                        |
                |               _________|_________
                |              |         |         |
                |          PostgreSQL   Redis    Storage
                |                        |
                |                   Jobs / Events
                |
       Customer Browser
                |
        -----------------------------
        External Integrations
        -----------------------------
        Razorpay
        Amazon Shipping
        Resend
        PostHog
        Sentry
```

## 2. Runtime Components

### Next.js

Responsible for:

-   Customer UI
-   SEO
-   Product pages
-   Search/filter UI
-   Cart UI
-   Checkout UI
-   Account pages
-   Order tracking
-   Custom admin UI if required

### Medusa Server

Responsible for:

-   REST APIs
-   Authentication
-   Commerce modules
-   Custom UAV modules
-   Workflows
-   Payment integration
-   Fulfillment integration
-   Order management
-   Inventory management
-   Admin APIs

### Medusa Worker

Responsible for:

-   Scheduled jobs
-   Subscribers
-   Async notifications
-   Webhook processing
-   Background synchronization
-   Long-running workflow work

### PostgreSQL

System of record for:

-   Commerce data
-   UAV data
-   Order state
-   Shipment state
-   Manufacturing state
-   Audit data

### Redis

Used for:

-   Sessions where configured
-   Workflow engine
-   Background processing
-   Event/pub-sub infrastructure
-   Locks
-   Cache

## 3. Modular Monolith

The backend is intentionally one deployable application.

``` text
Medusa Application
|
+-- Commerce
|   +-- Product
|   +-- Cart
|   +-- Order
|   +-- Customer
|   +-- Inventory
|   +-- Payment
|   +-- Fulfillment
|
+-- UAV Domain
|   +-- Compatibility
|   +-- Configurator
|   +-- Manufacturing
|   +-- Flight Test
|   +-- Quality
|
+-- Integrations
|   +-- Razorpay
|   +-- Amazon Shipping
|   +-- Resend
|   +-- Cloudinary/S3
|
+-- Infrastructure
    +-- Redis
    +-- PostgreSQL
    +-- Logging
    +-- Monitoring
```

Do not split these into microservices in v1.

## 4. Domain Boundaries

### Commerce Domain

Owns money and customer purchasing.

### UAV Configuration Domain

Owns technical compatibility and build configuration.

### Manufacturing Domain

Owns preparation of prebuilt UAVs after an order.

### Shipment Domain

Owns courier shipment and tracking.

### Payment Domain

Owns payment state and reconciliation.

These domains communicate through workflows/events instead of directly
mutating unrelated tables.

## 5. State Separation

Never use one `status` field for everything.

``` text
Order
  PENDING
  CONFIRMED
  PROCESSING
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED

Shipment
  CREATED
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  EXCEPTION
  RTO

UAV Manufacturing
  NOT_REQUIRED
  CONFIGURATION_CONFIRMED
  COMPONENTS_ALLOCATED
  ASSEMBLY
  WIRING
  FIRMWARE
  CALIBRATION
  MOTOR_TEST
  GPS_TEST
  FLIGHT_TEST
  QC
  PACKED
  READY_FOR_SHIPMENT
```

## 6. Security Boundaries

Public:

-   Storefront
-   Store API
-   Authentication endpoints

Private:

-   PostgreSQL
-   Redis
-   Amazon credentials
-   Razorpay secret
-   Cloud storage credentials
-   Resend API key
-   Sentry server credentials

Only Nginx exposes HTTP/HTTPS.

Recommended firewall:

-   80/tcp
-   443/tcp
-   SSH only from trusted IPs where possible

## 7. Scaling Path

### Phase 1

One Hostinger VPS:

-   Nginx
-   Next.js
-   Medusa server
-   Medusa worker
-   PostgreSQL
-   Redis

### Phase 2

Move databases to managed services if required.

### Phase 3

Separate:

-   Frontend
-   API
-   Worker
-   PostgreSQL
-   Redis

Do not prematurely introduce Kubernetes or microservices.
