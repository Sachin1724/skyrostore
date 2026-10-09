# Database Architecture

## 1. Database

PostgreSQL is the source of truth.

Medusa's commerce modules create and manage their own commerce data.

Custom UAV modules add domain-specific tables.

## 2. Core Commerce Entities

``` text
Customer
Product
ProductVariant
ProductCategory
Collection
InventoryItem
StockLocation
Cart
CartItem
Order
OrderItem
Payment
Fulfillment
Promotion
Region
SalesChannel
```

Use Medusa's built-in models/modules instead of duplicating them.

## 3. Custom Entities

### uav_models

``` text
id
product_id
class
max_takeoff_weight_g
payload_capacity_g
min_flight_time_min
max_flight_time_min
firmware
documentation_url
created_at
updated_at
```

### compatibility_rules

``` text
id
source_type
source_id
target_type
target_id
rule_type
severity
condition_json
message
created_at
updated_at
```

### uav_configurations

``` text
id
customer_id
name
status
estimated_weight_g
estimated_flight_time_min
estimated_payload_g
estimated_cost
created_at
updated_at
```

### uav_configuration_items

``` text
id
configuration_id
product_variant_id
component_type
quantity
```

### manufacturing_jobs

``` text
id
order_id
uav_configuration_id
product_id
current_stage
assigned_operator_id
started_at
completed_at
notes
created_at
updated_at
```

### manufacturing_events

``` text
id
manufacturing_job_id
stage
status
actor_id
notes
created_at
```

### flight_tests

``` text
id
manufacturing_job_id
test_type
pilot_id
location
result
telemetry_reference
notes
tested_at
```

### quality_checks

``` text
id
manufacturing_job_id
checklist_json
result
inspector_id
remarks
signed_at
```

### shipments

If Medusa's fulfillment model already contains the required fields,
extend/link rather than duplicating the entire fulfillment system.

Custom shipment metadata can include:

``` text
provider
external_shipment_id
tracking_number
tracking_url
estimated_delivery
sync_mode
last_synced_at
```

### tracking_events

``` text
id
shipment_id
external_event_id
status
description
location
occurred_at
received_at
raw_payload
```

### audit_logs

``` text
id
actor_id
action
entity_type
entity_id
before_json
after_json
ip
user_agent
created_at
```

## 4. Relationships

``` text
Customer
  |
  +-- Orders
  |     |
  |     +-- Order Items
  |     |
  |     +-- Manufacturing Job
  |              |
  |              +-- Flight Tests
  |              +-- Quality Checks
  |
  +-- UAV Configurations
          |
          +-- Configuration Items
```

``` text
Product
  |
  +-- Product Variant
          |
          +-- Compatibility Rules
          +-- Inventory
          +-- Configuration Items
```

## 5. Indexes

Important indexes:

``` text
orders(customer_id)
orders(created_at)
orders(status)

manufacturing_jobs(order_id)
manufacturing_jobs(current_stage)

tracking_events(shipment_id, occurred_at)
tracking_events(external_event_id)

compatibility_rules(source_id, target_id)

audit_logs(entity_type, entity_id)
audit_logs(actor_id, created_at)
```

## 6. Data Integrity

Use:

-   Foreign keys
-   Unique constraints
-   Check constraints where useful
-   Transactions
-   Workflow compensation/rollback
-   Idempotency keys

## 7. Money

Do not use floating-point values for money.

Store monetary values using the conventions required by Medusa and the
payment integration.

Always retain:

``` text
currency
subtotal
discount
tax
shipping
total
```

## 8. JSON

Use JSON/JSONB for flexible technical data such as:

-   Compatibility conditions
-   QC checklist versions
-   Raw webhook payloads
-   Telemetry references
-   Product technical specifications

Do not put core searchable business fields into one giant JSON document.

## 9. Backup

Production:

-   Automated PostgreSQL backup
-   Off-server backup
-   Periodic restore test

Backups are not considered valid until restoration has been tested.
