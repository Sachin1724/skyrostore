# Admin panel fix plan

Source: an external review of `apps/admin` (51 screens/components). Status as of this commit.

## Phase 1 - breaks with real data (done)
- [x] **Pagination** on Orders, Products, Customers, Inventory: `?page=N`, "Showing 21-40 of 312", filters kept in the URL (`components/ui/pagination.tsx`). Orders page size 25, products 50, customers 25, inventory 50.
- [x] **Phone layout**: sidebar becomes a slide-in drawer below `md` (menu button in the top bar); top bar and padding shrink. Tables still scroll sideways on a phone.
- [x] **`error.tsx` + `loading.tsx`** in `(dashboard)/`: retry button and a skeleton for every admin page.

## Phase 2 - daily workflow
- [x] **Toasts** (`sonner`): `<Toaster>` in the shell; the order fulfilment workbench and the bulk-quote workbench now toast every result.
- [x] Bulk-quote conversion uses `ConfirmDialog` instead of `window.confirm`.
- [x] "Delivered" order badge uses the same tinted style as the other states.
- [x] Error toasts on brands, categories, promotions, media and moderation.
- [ ] Toasts on the remaining screens (customers, product editor, settings, content, returns, stock cell).
- [x] Order search matches phone (digits only), customer name, AWB and Razorpay payment/order id.
- [ ] Search on Customers, Quotations, Returns, Support.
- [ ] Bulk actions on Orders and Products (select, then act).
- [ ] Split the three 600+ line workbenches into panels.

## Phase 3 - polish
- [x] Dashboard: today's and 7-day sales, daily bar chart, low-stock list (from the 200 most recent orders).
- [x] Order totals, refund box and e-way bill check in the admin now treat amounts as paise (they showed raw paise before).
- [ ] Phone: orders as stacked cards.
- [ ] Empty states with a next-step button.
- [ ] Labels and tooltips on icon-only buttons.
- [ ] Keyboard shortcuts (`/` search, `g o` orders).

## Security (before giving anyone else a login)
- [ ] Put the admin domain behind Cloudflare Access.
- [x] Roles: "staff" (fulfil orders) and "owner" (refunds, settings, promotions, users). Role lives in the Medusa user's metadata; no role counts as owner. Set it with `ADMIN_EMAIL=... ADMIN_ROLE=staff npx medusa exec ./src/scripts/set-admin-role.ts` in `apps/backend`. The backend refuses owner-only calls from staff; the admin screens also hide them.
- Side effect: staff also cannot save homepage copy or media-index changes, because those write the store record (owner-only).
