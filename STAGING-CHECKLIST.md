# Staging checklist

Run on a staging copy (test Razorpay keys, test Shipmozo if available) before real orders. Everything below changed in the code-review hardening and admin work and has not been run against a live backend.

## Set up first
- [ ] Backend `.env` has `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `STOREFRONT_PROXY_SECRET`, `STORE_CORS`, `STOREFRONT_URL`; `JWT_SECRET` and `COOKIE_SECRET` are at least 32 characters. Production refuses to start otherwise.
- [ ] Same `STOREFRONT_PROXY_SECRET` in the storefront and admin envs.
- [ ] `pp_system_default` unlinked from the production region (Medusa admin, Region, Payment providers). Only `pp_razorpay` should remain.
- [ ] Admin Settings: real legal name, GSTIN, address, phone and support email entered. Invoices and the footer print nothing for empty fields.
- [ ] Optional: `GA4_ID` and `META_PIXEL_ID` in the root `.env` that docker compose reads; rebuild the storefront. Check consent rules first.

## Money
- [ ] Checkout: sending a different `provider_id` from the browser still pays through Razorpay.
- [ ] Pay with a test card. The order is created and the payment shows as captured (`captured_at` set).
- [ ] Customer self-cancel on an unpacked paid order issues a full Razorpay refund.
- [ ] Admin refund: the box is in rupees; refunding Rs 100 on a Rs 1,000 order refunds Rs 100.
- [ ] Order list, order detail and customer pages show rupees (not 1499900).
- [ ] Order confirmation email shows the right rupee total.
- [ ] Webhook: replay one `payment.captured` event twice; the second is logged "Already processed" (uses the `X-Razorpay-Event-Id` header).
- [ ] Stock gone after payment (let a hold expire, buy the last unit elsewhere, finish the first payment): the payment is refunded automatically.

## Shipping
- [ ] Booking a courier sends the declared value in rupees (check in the Shipmozo panel).
- [ ] An out-of-state order of Rs 50,000 or more asks for an e-Way Bill; one of Rs 500 does not.
- [ ] A product ticked "Surface shipping only" (admin, Commercial tab) blocks courier booking and shows the surface note on the product page.

## Access
- [ ] Mark a test user staff: `ADMIN_EMAIL=... ADMIN_ROLE=staff npx medusa exec ./src/scripts/set-admin-role.ts` in `apps/backend`.
- [ ] As staff: the refund box, Settings and Promotions are hidden, and a direct refund or settings save returns 403.
- [ ] As owner: all of the above works.
- [ ] Admin login from two different IPs is rate limited per IP, not for everyone.

## Accounts
- [ ] Phone sign-up: enter name and email, receive the confirmation link, open it, press "I have confirmed my email"; the account is created with that email.
- [ ] Phone sign-up with an email that already has an account says the email is in use.
- [ ] Wishlist and saved items work for guests and signed-in customers; a made-up `x-visitor-id: cus_...` header reads nothing.
- [ ] A new review or question is hidden until approved on the Reviews and questions page.

## Admin
- [ ] Orders, Products, Customers and Inventory page past the first page (create enough test rows or lower the page size temporarily).
- [ ] Order search finds an order by phone (with or without +91), AWB and Razorpay payment id.
- [ ] Dashboard shows today's and 7-day sales and the low-stock list; compare one number against the orders list.
- [ ] Open the admin on a phone: the menu button opens the sidebar.
- [ ] Stop the backend and open a page: the error page with Try again shows (not the Next.js default).
- [ ] Upload an image in admin with the non-root container; an existing `uploads` volume may need `chown` to the `node` user.

## Storefront
- [ ] Product page source contains a Product JSON-LD block with the right rupee price and stock.
- [ ] Throw an error in a page: the branded error page shows.
- [ ] If tags are on: GA4 and Meta test tools show one `purchase` per order and not on reload.
