# Backend Architecture

## 1. Backend Stack

-   Node.js
-   TypeScript
-   Medusa v2
-   PostgreSQL
-   Redis
-   Docker
-   Nginx

Medusa's architecture is based around API routes, workflows, modules and
a PostgreSQL data layer. Custom modules are the correct place for
UAV-specific domain behavior.

## 2. Repository Structure

``` text
apps/
  web/
    app/
    components/
    lib/
    hooks/
    styles/

  backend/
    src/
      api/
      modules/
        uav/
        compatibility/
        manufacturing/
        flight-test/
        quality/
        shipment/
      workflows/
      subscribers/
      jobs/
      links/
      integrations/
      scripts/
      admin/
    medusa-config.ts

packages/
  ui/
  types/
  validation/
  config/

docs/
  ARCHITECTURE.md
  BACKEND.md
  FRONTEND.md
  API.md
  WORKFLOWS.md
  DATABASE.md
  DEPLOYMENT.md
```

## 3. Custom Modules

### UAV Module

Stores technical metadata for UAV products.

Example:

``` text
UAVModel
- id
- product_id
- class
- max_takeoff_weight
- payload_capacity
- recommended_battery
- flight_time_min
- flight_time_max
- firmware
- documentation
```

### Compatibility Module

Stores rules between components.

``` text
CompatibilityRule
- id
- source_type
- source_id
- target_type
- target_id
- rule_type
- severity
- condition
- message
```

Rule types:

-   COMPATIBLE
-   WARNING
-   INCOMPATIBLE
-   REQUIRED

Examples:

``` text
Motor KV -> Propeller
ESC current -> Motor current
Battery voltage -> ESC voltage
Battery connector -> Power system
Flight controller -> Frame
GPS -> Flight controller
Receiver -> Flight controller
Payload -> UAV capacity
```

### Configurator Module

Stores saved UAV builds.

``` text
UAVConfiguration
- id
- customer_id
- name
- frame
- flight_controller
- esc
- motors
- propellers
- battery
- gps
- receiver
- telemetry
- payload
- estimated_weight
- estimated_flight_time
- estimated_cost
- validation_status
```

### Manufacturing Module

Tracks prebuilt UAV production.

``` text
ManufacturingJob
- id
- order_id
- product_id
- configuration_id
- current_stage
- assigned_operator
- started_at
- completed_at
- notes
```

### Flight Test Module

``` text
FlightTest
- id
- manufacturing_job_id
- test_type
- location
- pilot
- result
- telemetry_reference
- notes
- tested_at
```

### Quality Module

``` text
QualityCheck
- id
- manufacturing_job_id
- checklist
- result
- inspector
- signed_at
- remarks
```

## 4. API Routes

Medusa's native Store APIs are under `/store`. Custom APIs should use a
clear `/store` or `/admin` boundary and follow Medusa's authentication
model.

### Customer

``` text
GET    /store/uav-models
GET    /store/uav-models/:id
POST   /store/uav/configurations/validate
POST   /store/uav/configurations
GET    /store/uav/configurations/:id
GET    /store/orders/:id/timeline
GET    /store/shipments/:id/tracking
```

### Admin

``` text
GET    /admin/uav/configurations
GET    /admin/manufacturing/jobs
GET    /admin/manufacturing/jobs/:id
POST   /admin/manufacturing/jobs/:id/advance
POST   /admin/manufacturing/jobs/:id/flight-test
POST   /admin/manufacturing/jobs/:id/qc
POST   /admin/orders/:id/create-shipment
POST   /admin/orders/:id/refund
POST   /admin/orders/:id/cancel
```

### Webhooks

``` text
POST /webhooks/razorpay
POST /webhooks/amazon-shipping
POST /webhooks/storage
```

## 5. Backend Rules

### Validate on Server

Never trust:

-   Price
-   Stock
-   Compatibility
-   Payment state
-   Shipment state
-   Admin permissions
-   Order ownership

### Idempotency

Every external webhook/event must have:

``` text
provider
external_event_id
received_at
processed_at
status
payload_hash
```

Duplicate events must not create duplicate:

-   Orders
-   Payments
-   Shipments
-   Notifications
-   Timeline entries

## 6. Event Examples

``` text
order.placed
payment.authorized
payment.captured
payment.failed

uav.configuration.created
uav.configuration.validated

manufacturing.started
manufacturing.stage_changed
flight_test.completed
quality.approved

shipment.created
shipment.tracking_updated
shipment.delivered

notification.required
```

## 7. Background Jobs

Use the worker for:

-   Email
-   Shipment synchronization
-   Tracking polling where required
-   Search indexing
-   Analytics events
-   Low-stock alerts
-   Abandoned cart processing
-   Invoice generation
-   Scheduled maintenance

## 8. Admin RBAC

Recommended roles:

``` text
SUPER_ADMIN
OPERATIONS
INVENTORY
MANUFACTURING
QC
SUPPORT
FINANCE
CONTENT_MANAGER
```

Permissions should be explicit.

Example:

``` text
orders.read
orders.update
orders.cancel
orders.refund

inventory.read
inventory.update

manufacturing.read
manufacturing.advance

qc.read
qc.approve

products.read
products.write

finance.read
```

## 9. Audit Log

Every sensitive admin action should create:

``` text
AuditLog
- id
- actor_id
- action
- entity_type
- entity_id
- before
- after
- ip
- user_agent
- created_at
```

Sensitive actions include:

-   Refund
-   Cancel order
-   Change price
-   Change stock
-   Approve QC
-   Create shipment
-   Change tracking
-   Change admin role
