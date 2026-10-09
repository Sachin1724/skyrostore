# Business Workflows

## 1. Product Purchase

``` text
Customer
  ↓
Browse product
  ↓
Product validation
  ↓
Add to cart
  ↓
Cart recalculation
  ↓
Address
  ↓
Shipping method
  ↓
Razorpay order
  ↓
Payment
  ↓
Server verification
  ↓
Medusa order
  ↓
Order confirmed
```

## 2. Standard Product Order

``` text
PENDING
  ↓
CONFIRMED
  ↓
PROCESSING
  ↓
PACKED
  ↓
SHIPMENT CREATED
  ↓
SHIPPED
  ↓
OUT FOR DELIVERY
  ↓
DELIVERED
```

## 3. Prebuilt UAV Order

``` text
ORDER CONFIRMED
       ↓
CONFIGURATION CONFIRMED
       ↓
COMPONENTS ALLOCATED
       ↓
ASSEMBLY
       ↓
WIRING
       ↓
FIRMWARE CONFIGURATION
       ↓
CALIBRATION
       ↓
MOTOR TEST
       ↓
GPS / SENSOR TEST
       ↓
FLIGHT TEST
       ↓
QC APPROVED
       ↓
PACKED
       ↓
SHIPMENT CREATED
       ↓
SHIPPED
       ↓
DELIVERED
```

## 4. UAV Configuration Workflow

``` text
Select frame
 ↓
Select electronics
 ↓
Select propulsion
 ↓
Select battery
 ↓
Select navigation
 ↓
Select payload
 ↓
Backend compatibility engine
 ↓
Calculate:
  - weight
  - power requirement
  - estimated flight time
  - payload margin
  - cost
 ↓
PASS / WARNING / ERROR
 ↓
Save configuration
```

The compatibility engine must run server-side.

## 5. Payment Workflow

``` text
Create cart
 ↓
Create Medusa payment collection
 ↓
Create Razorpay order
 ↓
Customer pays
 ↓
Razorpay callback/webhook
 ↓
Verify signature/server state
 ↓
Capture/confirm payment
 ↓
Complete order
 ↓
Emit order.placed
```

Failure:

``` text
Payment failed
 ↓
Order remains unpaid
 ↓
Cart remains recoverable
 ↓
Customer can retry
```

## 6. Amazon Shipping Workflow

``` text
Order packed
 ↓
Create Amazon shipment
 ↓
Amazon returns shipment/tracking information
 ↓
Store shipment ID
 ↓
Store tracking number
 ↓
Store label/reference
 ↓
Shipment status = CREATED
 ↓
Amazon tracking events
 ↓
Webhook/push or polling where supported
 ↓
Update shipment
 ↓
Append tracking event
 ↓
Customer order timeline updates
```

Admin should not manually update every tracking event when automatic
synchronization is enabled.

Manual fallback:

``` text
Admin selects courier
 ↓
Enters tracking number
 ↓
Enters tracking URL
 ↓
System records manual shipment
```

Manual shipment data must be visibly marked as manual.

## 7. Manufacturing Workflow

When an order contains a prebuilt UAV:

``` text
Order Confirmed
 ↓
Create ManufacturingJob
 ↓
Reserve/allocate components
 ↓
Operator starts assembly
 ↓
Record assembly completion
 ↓
Firmware configuration
 ↓
Calibration
 ↓
Bench tests
 ↓
Flight test
 ↓
QC checklist
 ↓
QC approval
 ↓
Mark packed
```

Any failure should create an exception rather than silently advancing.

## 8. Flight Test Workflow

``` text
Manufacturing stage = FLIGHT_TEST
 ↓
Assign pilot
 ↓
Create test session
 ↓
Run checklist
 ↓
Record telemetry reference
 ↓
Record observations
 ↓
PASS / FAIL
```

If FAIL:

``` text
FAIL
 ↓
Manufacturing = REWORK_REQUIRED
 ↓
Repair
 ↓
Retest
```

## 9. QC Workflow

Checklist examples:

``` text
Frame inspection
Motor mounting
Propeller condition
ESC wiring
Power distribution
Battery connector
GPS lock
Compass
RC link
Telemetry
Firmware
Failsafe
Return-to-home
Sensor health
Physical packaging
Documentation
```

Only authorized QC users can approve.

## 10. Cancellation

Before shipment:

``` text
Customer/Admin cancellation
 ↓
Validate cancellation rules
 ↓
Cancel order
 ↓
Release inventory
 ↓
Refund if eligible
 ↓
Cancel manufacturing job
```

After shipment:

``` text
Do not treat cancellation as a normal delete.
Use return/RTO workflow.
```

## 11. Refund

``` text
Refund requested
 ↓
Check order/payment state
 ↓
Create Razorpay refund
 ↓
Receive refund event/status
 ↓
Update payment
 ↓
Update order
 ↓
Notify customer
```

## 12. Return / RTO

``` text
Delivery exception
 ↓
RTO / return initiated
 ↓
Shipment status = RTO
 ↓
Warehouse receives item
 ↓
Inspection
 ↓
Inventory decision
 ↓
Refund / replacement
```

## 13. Notifications

Events trigger notifications:

``` text
order.confirmed
payment.confirmed
shipment.created
shipment.in_transit
shipment.out_for_delivery
shipment.delivered
manufacturing.stage_changed
flight_test.failed
qc.approved
```

Notification flow:

``` text
Business event
 ↓
Redis/event system
 ↓
Worker
 ↓
Resend
 ↓
Email/SMS provider if later added
```

Notifications should not block checkout or order creation.

## 14. Event Reliability

Every event handler must support:

-   Retry
-   Idempotency
-   Dead-letter/error logging
-   Structured logging
-   Auditability

Never assume an external API will respond exactly once.
