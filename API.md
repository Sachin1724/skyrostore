# API Specification

## 1. API Principles

-   REST
-   JSON
-   HTTPS only in production
-   Authentication required for private resources
-   Authorization enforced server-side
-   Zod / schema validation at boundaries
-   Idempotency for mutation endpoints
-   Pagination for collections
-   Stable error format

## 2. Base URLs

``` text
Store:
https://api.example.com/store

Admin:
https://api.example.com/admin

Webhooks:
https://api.example.com/webhooks
```

## 3. Response Format

Success:

``` json
{
  "data": {},
  "meta": {}
}
```

Error:

``` json
{
  "error": {
    "code": "UAV_CONFIGURATION_INVALID",
    "message": "Selected ESC is incompatible with the motor.",
    "details": {
      "source": "esc_123",
      "target": "motor_456"
    },
    "request_id": "req_xxx"
  }
}
```

## 4. Pagination

``` text
?page=1&limit=20
```

Response:

``` json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120
  }
}
```

## 5. Product APIs

``` text
GET /store/products
GET /store/products/:id
GET /store/product-categories
GET /store/collections
```

Filters:

``` text
category_id
collection_id
q
min_price
max_price
in_stock
compatibility
```

## 6. UAV APIs

### Validate Configuration

``` text
POST /store/uav/configurations/validate
```

Request:

``` json
{
  "frame_id": "frame_01",
  "flight_controller_id": "fc_01",
  "esc_id": "esc_01",
  "motor_ids": ["motor_01", "motor_02"],
  "propeller_id": "prop_01",
  "battery_id": "battery_01",
  "gps_id": "gps_01",
  "payload_grams": 500
}
```

Response:

``` json
{
  "valid": true,
  "warnings": [],
  "errors": [],
  "estimates": {
    "weight_grams": 2140,
    "flight_time_minutes": 23,
    "payload_capacity_grams": 750,
    "total_price": 84999
  }
}
```

### Save Configuration

``` text
POST /store/uav/configurations
```

### Retrieve Configuration

``` text
GET /store/uav/configurations/:id
```

## 7. Order APIs

Use Medusa's native order/cart APIs wherever possible.

Custom additions:

``` text
GET /store/orders/:id/timeline
GET /store/orders/:id/manufacturing
GET /store/orders/:id/shipment
```

The server must verify that the authenticated customer owns the order.

## 8. Admin Order APIs

``` text
GET /admin/orders
GET /admin/orders/:id
POST /admin/orders/:id/confirm
POST /admin/orders/:id/pack
POST /admin/orders/:id/cancel
POST /admin/orders/:id/refund
```

## 9. Manufacturing APIs

``` text
POST /admin/manufacturing/jobs
GET /admin/manufacturing/jobs
GET /admin/manufacturing/jobs/:id
POST /admin/manufacturing/jobs/:id/advance
POST /admin/manufacturing/jobs/:id/flight-test
POST /admin/manufacturing/jobs/:id/qc
```

## 10. Shipment APIs

``` text
POST /admin/orders/:id/create-shipment
GET /admin/shipments/:id
GET /store/shipments/:id/tracking
```

Shipment response:

``` json
{
  "id": "ship_123",
  "provider": "amazon_shipping",
  "status": "IN_TRANSIT",
  "tracking_number": "XXXX",
  "tracking_url": "https://...",
  "estimated_delivery": "2026-10-04",
  "events": [
    {
      "status": "PICKED_UP",
      "timestamp": "2026-10-01T10:30:00Z",
      "location": "Bhubaneswar"
    }
  ]
}
```

## 11. Razorpay Webhook

``` text
POST /webhooks/razorpay
```

Server flow:

``` text
Receive webhook
 ↓
Verify Razorpay signature
 ↓
Check external event ID
 ↓
Store event
 ↓
Process event
 ↓
Update payment
 ↓
Update order if appropriate
 ↓
Emit internal event
 ↓
Return 2xx
```

Never trust a browser redirect as proof of payment.

## 12. Amazon Shipping Webhook

``` text
POST /webhooks/amazon-shipping
```

Flow:

``` text
Receive event
 ↓
Validate provider/authentication
 ↓
Check idempotency
 ↓
Store event
 ↓
Map Amazon status
 ↓
Update Shipment
 ↓
Append TrackingEvent
 ↓
Update customer-facing order timeline
 ↓
Notify customer if required
```

Exact Amazon Shipping API/webhook capabilities must be confirmed against
the client's enabled Amazon Shipping account before production
implementation.

## 13. Authentication

Customer:

``` text
Session / token managed by Medusa
```

Admin:

``` text
Authenticated admin
+
RBAC permission
+
Audit log
```

Never authorize admin operations based on a frontend role flag.

## 14. API Versioning

For custom public APIs, prefer:

``` text
/store/v1/...
/admin/v1/...
```

If the Medusa route is already stable and owned by Medusa, do not
duplicate it unnecessarily.

## 15. Rate Limiting

Protect:

-   Login
-   Password reset
-   Search
-   Configuration validation
-   Checkout
-   Webhooks
-   Admin endpoints

Webhook rate limits must allow legitimate provider bursts.
