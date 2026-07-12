# Shopkart — Production-Readiness Roadmap

Goal: turn this project (seller portal `my-app` + storefront `ecomm-front`, shared MongoDB) into a portfolio piece that demonstrates real production engineering — scalability, security, code quality, UX — backed by load-test proof.

Everything below was found by reading the actual code, not guessed.

---

## 🚨 Critical bug found during audit (fix immediately, independent of the roadmap)

`ecomm-front/src/app/api/success/route.js` — the `PUT` endpoint that marks an order as paid is **not a Stripe webhook and has no auth or signature verification**. Any unauthenticated request can call it with an arbitrary order `_id` and `Paid: true`, mark that order paid, and it will even trigger a real order-confirmation email. This means anyone can "buy" anything for free right now. Needs to become a signature-verified Stripe webhook before anything else ships.

---

## Phase 0 — Foundational cleanup (do first, applies to both apps)

- Resolve the unresolved git merge-conflict markers left in root `README.md`.
- Delete or repurpose the stale duplicate `my-app/my-app/` nested folder (near-copy of the real app, untracked, confusing).
- Decide repo structure: keep as two independent Next apps, or move to a monorepo (npm/yarn workspaces or Turborepo) so shared code (Mongoose models, DB connection, types) lives in one place instead of two.
- Fix dependency version drift between the two apps:
  - `next-auth`: `^4.24.7` (my-app) vs `"beta"` (ecomm-front) — pin both to the same stable release.
  - AWS SDK: `@aws-sdk/client-s3` v3 (my-app) vs `aws-sdk` v2 (ecomm-front, deprecated/EOL) — standardize on v3.
  - Mongoose versions differ slightly between apps — align.
- Add `.env.example` to both apps documenting required env vars.
- Remove all 30+ leftover `console.log` statements; replace with a real logger (pino/winston) with log levels.
- Add ESLint/Prettier config consistently, fix warnings.
- Add GitHub Actions CI: lint + build (+ tests once they exist) on every push/PR.
- Write a real top-level README: architecture diagram, how the two apps share one DB, setup instructions.

---

## Phase 1 — Seller Portal (`my-app`)

### Data layer / scalability
- **No indexes exist on any Mongoose schema.** Add indexes: `sellerId` on Product/BackOrders, unique `email` on User, `category` on Product. Every seller-scoped query is currently a full collection scan.
- **No pagination anywhere.** `GET /api/products`, `/api/catagories`, `/api/orders` all return the entire result set. Add `limit`/`skip` or cursor-based pagination.
- Add a shared Mongoose connection module with `maxPoolSize` explicitly configured — under concurrent load (i.e. during your load test) unbounded connections can exhaust MongoDB Atlas's connection limit fast. This is a great "found via load testing, fixed it" story.
- Add server-side validation (Zod) to every POST/PUT route instead of ad hoc `if` checks.
- Dead code: `products/page.jsx` sends `?sellerId=` as a query param, but `/api/products` ignores it and uses the session instead — leftover from before auth was added. Remove it.
- No stock/inventory concept anywhere in the Product schema — add one, it's needed for Phase 2 oversell protection too.
- Consider soft-delete + audit trail for products/orders instead of hard delete.

### Security
- **`/api/catagories` route has no ownership scoping** — any authenticated seller can edit or delete *any* category, not just their own (unlike products/orders, which correctly scope by `sellerId`). Fix to match the pattern already used elsewhere.
- `/api/upload` has no file-size or MIME-type limit before the buffer hits `sharp` — a large/malformed upload can be used to exhaust server memory. Add limits.
- No rate limiting on login, signup, or product-create endpoints — add it (also the first thing your own load test will expose).
- Add security headers via `next.config.js` (CSP, X-Frame-Options, etc.).
- Secrets are correctly gitignored right now (`.env`, `res_publicKey*` are not tracked) — add a pre-commit hook (gitleaks) so that stays true.

### Code quality
- Fix the "catagories/Catagory" typo consistently, or explicitly document it as known debt if you don't want a breaking rename.
- Duplicated client-side auth state: pages read `window.sessionStorage` manually for the logged-in user (5 files) *in addition to* next-auth's `useSession()`, and the server ignores the client-sent id anyway. Drop the manual sessionStorage plumbing — it's redundant and can desync.
- Extract repeated inline SVG icons into shared icon components.
- Replace raw `<img>` with `next/image`.
- Add loading/error/empty states to every data-fetching page — right now failed fetches just log to console and empty tables render as blank.

### UI/UX (you flagged this as the weakest part — agreed after reading it)
- Replace the raw HTML `<table>` on Products/Orders with a real responsive, sortable, paginated data table — current table will visually break on mobile.
- Establish a real design system pass: spacing scale, type scale, consistent color tokens (currently ad hoc Tailwind classes).
- Add a toast/notification system (e.g. react-hot-toast) — right now success/error feedback is `console.log` or a plain inline string.
- Turn the dashboard home page into an actual dashboard (orders today, revenue, low stock) — right now it's just a greeting.
- Replace full-page navigation for delete confirmation (`/products/delete/[...id]`) with an in-place confirm modal.
- Fix the "Sigun Up" typo.
- Add loading skeletons instead of blank screens.
- Full responsive + accessibility pass (alt text, aria-labels, contrast, keyboard nav).

### Testing
- Zero test files currently exist. Add:
  - Unit tests (Vitest/Jest) for API routes and utilities.
  - Integration tests for auth, product CRUD, order retrieval.
  - E2E (Playwright) for signup → login → create product → view orders.

### Performance & load testing (the recruiter "proof")
- Add caching for category lookups (rarely change, currently hit DB every request).
- Baseline load test with k6 or Artillery against GET/POST `/api/products` and login, *before* optimizing.
- Apply the indexing/pagination/pooling fixes above.
- Re-run the same load test, record before/after numbers (p50/p95 latency, throughput, error rate under N concurrent users) — this is your actual portfolio artifact.
- Add basic observability: Sentry for errors, request timing logs.

### Deployment
- Real staging + prod environments (not just local/dev).
- Health-check endpoint.
- Documented deploy + rollback steps.
- Uptime monitoring.

---

## Phase 2 — Storefront (`ecomm-front`)

Shares the same MongoDB as the seller portal, but maintains its **own independent copies** of the Product/User/Order/Backorders schemas — real drift risk since both apps must be kept in sync by hand right now.

### Data layer / scalability
- **Biggest single bottleneck in the whole project**: `GET /api` (the main product-listing endpoint the storefront calls with zero params) runs `product.find()` with no filter, no limit, no pagination — returns the entire product catalog on every page load. Fix this first; it's the best "before/after" load-test story available in this codebase.
- Add filtering (category, price range, search) — right now the API can only return everything or one product by id.
- Eliminate model duplication between the two apps (shared package, or a documented sync process).
- Add stock field + oversell protection at checkout (needs Phase 1's stock field too).
- **Checkout bug**: `createAggregatedDocument` in the checkout route matches line items back to products by `productName` string equality. Two products with the same name (plausible in a multi-seller marketplace) will misattribute the order to the wrong product/seller. Match by `_id` instead.
- Ensure the storefront only lists products from active/valid sellers.

### Security
- Fix the critical unauthenticated payment-confirmation endpoint noted at the top of this doc — convert to a real, signature-verified Stripe webhook.
- Align `next-auth` and AWS SDK versions with Phase 0.
- Add rate limiting to cart/checkout endpoints (public, unauthenticated today).
- Add input validation on the checkout payload (address, email format) — currently trusts the client-sent shape as-is.
- Note: checkout *does* correctly recompute price server-side from the DB rather than trusting the client — that part is already right, keep it.

### Cart / checkout UX
- Cart lives only in `localStorage` (`CartContext`) — fine for guests, but it means cart doesn't follow a logged-in user across devices. Consider syncing to the account.
- Add loading/error states around checkout and payment.

### UI/UX
- Full visual pass on product grid, filters, search, product detail page — currently minimal styled-components UI.
- Responsive shopping-flow audit end to end.
- Image optimization (`next/image` + CDN/cache headers on S3 assets).
- Loading skeletons for product grid, cart, checkout.

### Testing & load testing
- Unit/integration tests for cart, checkout, order creation.
- Load test the product-listing and checkout endpoints specifically — this is the actual customer-facing path, and currently the least optimized one.
- Once stock exists, test for race conditions on concurrent checkout of the last unit.

---

## Suggested order of attack

1. Fix the critical payment-auth bug (hours, not days — do this regardless of everything else).
2. Phase 0 cleanup (repo hygiene, dead code, version alignment) — fast, immediate credibility win if anyone opens the repo.
3. Phase 1 data-layer fixes (indexes, pagination, pooling, category-ownership bug) — highest load-testing ROI.
4. Phase 1 UI overhaul.
5. Phase 1 tests + load test, record before/after numbers.
6. Repeat steps 3-5 for Phase 2, fixing the product-matching and listing-pagination bugs before load testing it.
7. Deployment/observability polish, then write the case-study (README + numbers) for your resume/portfolio.

This is a big list by design — you asked not to skip anything. Don't try to do all of it before you start applying; the highest-value subset is the critical bug fix, the indexing/pagination work (steps 1-3), and one clean load-test story with real before/after numbers. Everything else compounds your credibility but isn't blocking.
