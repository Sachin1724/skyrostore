# Frontend Architecture

## 1. Stack

-   Next.js
-   TypeScript
-   App Router
-   Tailwind CSS
-   shadcn/ui
-   Framer Motion
-   Medusa JS SDK / REST API
-   Zod for client-side schema validation
-   React Hook Form where forms are complex

## 2. Storefront Principles

The visual direction should feel:

-   Aerospace
-   Technical
-   Precise
-   Premium
-   Minimal
-   Product-first

Avoid:

-   Generic SaaS gradients
-   Excessive cards
-   Over-animated UI
-   Fake 3D decoration
-   AI-generated visual clutter

## 3. Customer Routes

``` text
/
├── uavs/
│   ├── page
│   └── [slug]
├── parts/
│   ├── page
│   └── [category]
├── products/[slug]
├── build
├── search
├── cart
├── checkout
├── order/[id]
├── track/[id]
├── account/
│   ├── orders
│   ├── addresses
│   └── profile
├── support
└── contact
```

## 4. Homepage

Recommended structure:

``` text
Header
Hero
Featured UAV
Shop by System
Prebuilt UAVs
UAV Components
Build Your UAV
Engineering / Documentation
Support
Footer
```

Hero should communicate immediately:

> Professional UAVs & Components

Secondary message:

> Build, configure and deploy with confidence.

## 5. Product Listing

Filters:

``` text
Category
Price
Availability
Brand
Voltage
KV
Current
Weight
Connector
Compatibility
UAV Platform
```

Product card:

``` text
Image
Product name
Short technical descriptor
SKU
Price
Stock
Compatibility tag
```

## 6. Product Detail

``` text
Gallery
Product title
SKU
Price
Availability
Technical specification
Compatibility
What's included
Documentation
Downloads
Shipping information
Warranty
Add to cart
Buy now
```

## 7. UAV Configurator

Flow:

``` text
1. Select frame
2. Select flight controller
3. Select ESC
4. Select motors
5. Select propellers
6. Select battery
7. Select GPS
8. Select receiver
9. Select telemetry
10. Select payload
11. Validate
12. Review
13. Save / Add to cart
```

UI should show:

``` text
Compatibility: PASS

Estimated Weight: 2.1 kg
Estimated Flight Time: 23 min
Payload Capacity: 750 g
Estimated Cost: ₹XX,XXX
```

Warnings:

``` text
WARNING
Battery is compatible but flight time may decrease.
```

Errors:

``` text
INCOMPATIBLE
Selected ESC does not support the selected motor current.
```

The frontend only displays backend validation results.

## 8. Checkout

``` text
Cart
 ↓
Customer details
 ↓
Address
 ↓
GST / business details
 ↓
Shipping method
 ↓
Payment
 ↓
Order confirmation
```

Never calculate final payable amount only on the frontend.

## 9. Customer Order Page

Show:

``` text
Order #SC-10482

Order Status
Confirmed

Payment
Paid

Shipment
Amazon Shipping

Tracking
XXXXXXXX

Timeline
✓ Order placed
✓ Payment confirmed
✓ Order confirmed
✓ Packed
● Shipped
○ Out for delivery
○ Delivered
```

For a prebuilt UAV:

``` text
Configuration Confirmed
Assembly
Firmware Configuration
Calibration
Flight Testing
QC Approved
Packed
Shipped
Delivered
```

## 10. Admin UI

Admin navigation:

``` text
Dashboard
Orders
Products
Inventory
Customers
Quotes
UAV Builds
Manufacturing
Flight Tests
Quality Control
Shipments
Payments
Analytics
Support
Settings
```

### Order Detail

``` text
Order header
Customer
Items
Payment
Order timeline
Manufacturing timeline
Shipment
Tracking
Internal notes
Audit log
Actions
```

Actions:

``` text
Confirm
Start Processing
Mark Packed
Create Amazon Shipment
Cancel
Refund
Add Internal Note
```

## 11. Performance

Use:

-   Server Components by default
-   Client Components only where interaction is required
-   Image optimization
-   Lazy loading
-   Streaming where useful
-   Route-level caching
-   Minimal JavaScript
-   Skeleton states
-   Optimistic updates only for safe operations

## 12. Accessibility

Minimum:

-   Keyboard navigation
-   Visible focus states
-   Semantic HTML
-   Proper labels
-   Alt text
-   Contrast
-   Reduced motion support
-   Error messages connected to fields

## 13. SEO

Product pages must include:

-   Title
-   Description
-   Canonical URL
-   Product structured data
-   Availability
-   Price
-   Breadcrumbs
-   Open Graph image
-   Technical specifications

Generate sitemap and robots rules from the application.
