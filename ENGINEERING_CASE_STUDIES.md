# Engineering Case Studies — Shopkart

Interview/resume prep material. Each entry below is a real fix made during the production-readiness pass on this project, written as: what the problem was, how it was found, what the alternatives were, which one was chosen and why, and what happened as a result. Use these as talking points, not as something to read verbatim.

---

## 1. Unauthenticated payment confirmation endpoint

**Problem:** `ecomm-front`'s `/api/success` was a client-callable `PUT` endpoint that marked an order as "Paid." Any client — not just Stripe — could call it directly and mark an order paid without ever paying.

**How found:** During a security review of the checkout flow, tracing exactly what causes an order's `paid` field to flip from `false` to `true`.

**Ways to solve it:**
- Add a secret/token check to the existing endpoint.
- Add extra server-side validation of order details before trusting the call.
- Replace the client-callable endpoint entirely with a Stripe webhook, verified via signature.

**Chosen approach:** Full Stripe webhook with `stripe.webhooks.constructEvent()` signature verification. Payment confirmation is a trust boundary — the server should never take a client's word for it that money changed hands. This is the pattern Stripe's own docs specify for exactly this reason.

**After-effect:** The old `/api/success` PUT route was deleted outright. A new `/api/webhook` route verifies Stripe's signature using `STRIPE_WEBHOOK_SECRET`, then updates the order and sends a confirmation email. Verified locally using the Stripe CLI (`stripe listen`) and Stripe's India test card.

---

## 2. Missing multi-tenant scoping on categories (authorization bug)

**Problem:** The categories API had no seller ownership checks on `GET`/`POST` (some mutations had partial checks, but reads and creates were fully open). Any authenticated seller could view or manipulate another seller's categories.

**How found:** While adding pagination to the categories endpoint, noticed the query filter had no `sellerId` at all, unlike the products and orders endpoints which were already scoped correctly.

**Ways to solve it:**
- Leave categories as a shared, global taxonomy across all sellers (a legitimate design in some marketplace models).
- Add `sellerId` and scope only the mutation endpoints (partial fix).
- Add `sellerId` and scope all four CRUD operations consistently with how products/orders already work.

**Chosen approach:** Full scoping on all CRUD operations. The app's data model already treats each seller as an independent store (products and orders are both seller-scoped), so leaving categories global would have been an inconsistency, not a design choice.

**After-effect:** `sellerId` added to the schema and enforced on create/read/update/delete. Known follow-up: pre-existing categories created before this fix have no `sellerId` and became invisible to their original owner — a data backfill consideration, not yet resolved.

---

## 3. Broken S3 credentials on image upload

**Problem:** Uploading a product image returned a 500 with "Resolved credential object is not valid" after setting up a new AWS account.

**How found:** Reported directly when testing the upload feature; root-caused by reading the actual route file and finding a broken explicit `credentials` block still present in the `S3Client` constructor from an earlier partial fix.

**Ways to solve it:**
- Fix the explicit credentials object (hardcode/reconstruct key and secret directly in the constructor call).
- Remove the explicit credentials block and rely on the AWS SDK's default credential provider chain (environment variables picked up automatically).

**Chosen approach:** Default credential chain. It's the AWS-recommended pattern, avoids duplicating credential-loading logic that the SDK already does correctly, and works unchanged if credentials are later provided via an IAM role instead of static keys (e.g. after deploying to AWS).

**After-effect:** Upload confirmed working.

---

## 4. Missing database indexes

**Problem:** Mongoose schemas had no indexes on the fields actually used to filter queries (`sellerId`, `category`, `orderId`), meaning every list query was a full collection scan — fine at a handful of documents, not fine at scale.

**How found:** Proactive review ahead of load testing — reasoning about what would break under concurrent load rather than waiting for the load test to expose it as a failure.

**Ways to solve it:**
- Add targeted single-field indexes matching existing query patterns.
- Add compound indexes for anticipated future query patterns.
- Do nothing and rely on MongoDB Atlas's automatic index suggestions after real traffic.

**Chosen approach:** Targeted single-field indexes (`sellerId`, `category`, `orderId`, plus a `unique` index on `User.email`). Matches queries that already exist in the code; compound indexes without real query-pattern data would have been speculative.

**After-effect:** Verified via lint/format at the time, then confirmed directly with a load test: with 3,000 seeded products, the paginated + indexed endpoint held p(95) latency at 20.82ms — barely above the 11.28ms baseline measured on a near-empty dataset, despite a 250x increase in data volume. See the load-testing case study below for the full methodology and numbers.

---

## 5. Unbounded list endpoints (no pagination)

**Problem:** `/api/products`, `/api/orders`, and `/api/catagories` GET requests returned every document belonging to a seller in a single response. Fine during development, but would degrade badly as data grew.

**How found:** Same proactive scalability review as the indexing fix.

**Ways to solve it:**
- Offset-based pagination (`page`/`limit`, `skip`/`limit` in MongoDB).
- Cursor-based pagination (scales better at very large sizes, more complex to implement correctly).
- Leave the API unbounded and paginate only in the browser after fetching everything (doesn't reduce server load at all).

**Chosen approach:** Offset-based pagination. This is a seller admin dashboard, not a public feed — per-seller product counts are expected to stay in the hundreds, not millions, so cursor-based complexity wasn't justified yet.

**After-effect:** All three endpoints now return `{ data, pagination: { page, limit, total, totalPages } }`. This changed the response shape, which broke one frontend consumer that expected a bare array (see #9 below) — a direct lesson in why changing a shared API contract requires sweeping every consumer, not just the ones you remember.

---

## 6. MongoDB connection pooling + a concurrency race condition

**Problem:** The Mongoose connection helper checked `mongoose.connection.readyState === 1` (fully connected) to decide whether to open a new connection. While a connection was still *in progress* (`readyState === 2`), every concurrent request independently called `mongoose.connect()` again instead of waiting for the one already underway.

**How found:** While implementing connection pool sizing ahead of the load test, reasoning through what happens when many requests hit the app at once — exactly the scenario the load test is about to create — rather than discovering it as a live failure during the test itself.

**Ways to solve it:**
- Cache the in-flight connection *promise* itself, so concurrent callers all await the same connection attempt.
- Add an explicit lock/mutex flag around the connect call.
- Ignore it, since it typically self-heals once the first connection resolves.

**Chosen approach:** Cache the promise. It's the standard idiom for this exact problem in serverless/Next.js apps, and pairs naturally with an explicit `maxPoolSize: 10` to keep total connections bounded against MongoDB Atlas's free-tier connection cap.

**After-effect:** Eliminated duplicate connection attempts under concurrent load. The value of this fix was proven concretely later, in an unexpected way: the exact same unfixed bug turned up independently in `ecomm-front`'s own connection helper during its load test, and fixing it there took that endpoint's p(95) from 2.12s down to 86.13ms in a single change — see the load-testing case study below.

---

## 7. No server-side input validation

**Problem:** Routes trusted client-sent JSON almost entirely. Product `price` only had to satisfy Mongoose's `Number` type (no positivity check — a negative price would have been accepted). Signup only checked that `email`/`password` were truthy, not that the email was actually well-formed.

**How found:** Proactive hardening pass, same phase as rate limiting and upload limits.

**Ways to solve it:**
- Keep manual `if` checks per field (already partially in place, inconsistent across routes).
- Adopt a schema validation library (Zod) with one declarative schema per resource.
- Rely purely on Mongoose's own schema-level casting.

**Chosen approach:** Zod. Declarative, reusable across routes, and returns structured field-level errors to the client instead of a generic 500 — and it separates "is this input well-formed" from "how does the database store it," which Mongoose's casting conflates.

**After-effect:** Rolling it out surfaced two real bugs immediately — proof the validation was doing its job: `price` arrived from the HTML form as a string (`"1000000"`), which `z.number()` rejected outright; fixed with `z.coerce.number()` to match the coercion Mongoose used to do silently. Separately, an empty-string `category` (sent when no category is selected) was a valid Zod string but not a valid MongoDB ObjectId, crashing on save; fixed by transforming `""` to `undefined` before it reached Mongoose.

---

## 8. No rate limiting on write endpoints

**Problem:** Signup and other write endpoints had no limit on repeated requests — open to brute-force attempts or spam account creation.

**How found:** Same hardening pass as input validation.

**Ways to solve it:**
- In-memory sliding-window limiter keyed by client IP — no new infrastructure required.
- Redis/Upstash-backed distributed limiter — correct across multiple horizontally-scaled instances, requires new infra.
- Rely on a platform-level WAF/rate-limit (e.g. Cloudflare) instead of application code.

**Chosen approach:** In-memory limiter. Matches the current single-instance deployment reality and needs zero new infrastructure. The known limitation — it won't work correctly if this ever runs as multiple instances behind a load balancer, since each instance tracks its own counts — was documented directly in the code rather than silently ignored.

**After-effect:** Applied to the signup endpoint. Deliberately *not* wired into the NextAuth credentials login flow yet — next-auth v4/v5's internal request handling in the `authorize()` callback has enough internal quirks that shipping an uncertain implementation there felt riskier than leaving it as a documented follow-up.

---

## 9. Frontend broke after a backend contract change (pagination rollout)

**Problem:** After changing the categories endpoint's response shape to `{ data, pagination }`, the product-creation page's category dropdown only ever showed the default "Uncategorized" option, even though categories existed in the database.

**How found:** Reported directly while manually testing product creation after the pagination change shipped.

**Ways to solve it:**
- Fix consumers one at a time as bugs get reported.
- Proactively search the whole codebase for every call site of the changed endpoints in one pass.
- Version the API (keep the old shape available at a separate path) to avoid breaking existing consumers at all.

**Chosen approach:** Full codebase sweep. Once the first broken consumer was found, grepped every call site of all three changed endpoints (`/api/products`, `/api/orders`, `/api/catagories`) rather than waiting for more one-off bug reports.

**After-effect:** Found and fixed the one broken consumer (`ProductForm.js`); confirmed every other consumer (list pages, by-id edit/delete pages) was already correct. Direct lesson: changing a shared API response shape needs a full-codebase check, not a fix-as-you-go approach.

---

## 10. Slow, inconsistent image loading on the storefront

**Problem:** Product images on the customer-facing storefront (`ecomm-front`) loaded slowly, and inconsistently — some fast, some slow — visibly hurting the browsing experience.

**How found:** Reported directly after noticing degraded UX while testing the storefront homepage.

**Ways to solve it:**
- Fix only at display time, using `next/image` for automatic resizing, lazy-loading, and format negotiation.
- Fix only at upload time, compressing/resizing images before they're ever stored in S3.
- Do both, and also backfill images that were already uploaded before the fix existed.

**Chosen approach:** All three. New uploads and already-existing data both needed addressing — fixing only new uploads would have left every previously-uploaded image slow indefinitely.

**After-effect:** Sharp resizes and compresses images at upload time; `next/image` (with S3 `remotePatterns` configured) handles serving; a one-time backfill script resizes pre-existing oversized images already sitting in S3. Confirmed noticeably faster by direct testing after the backfill ran.

---

## 11. Migrating next-auth v4 → v5 mid-project

**Problem:** `my-app` ran next-auth v4 on Next.js 15, which predates Next 15's requirement that dynamic APIs (`params`, `cookies()`, `headers()`) be awaited. This produced a wall of deprecation warnings on every auth request, and v4 is now legacy/unmaintained for the App Router.

**How found:** Warnings appeared in the dev console during unrelated testing; root-caused by reading the actual `[...nextauth]/route.js` (a two-line wrapper) and tracing the warning source into next-auth's own internal package code, ruling out anything in the app's own code.

**Ways to solve it:**
- Ignore it — the warnings are non-fatal, and session calls still return `200`.
- Migrate to v5 (Auth.js) immediately, before running the load test.
- Migrate later, after the load test, to avoid mixing migration risk with the thing meant to prove stability.

**Chosen approach:** Migrate now, deliberately accepting the timing risk, specifically so the load test runs against the final, representative auth stack rather than one about to be replaced.

**After-effect:** Required splitting the auth config into an edge-safe `auth.config.js` (used by middleware, which always runs on the Edge runtime and can't import Node-only code like `mongoose` or `bcrypt`) and a full `auth.js` (used everywhere else), plus rewriting `withAuth`, the NextAuth route handler, and the middleware itself. Two follow-on bugs surfaced and were resolved during rollout: a missing `secret` in the edge-safe config caused every protected route to incorrectly redirect, because the middleware's separate auth instance couldn't verify session tokens signed by the main one; and a stale `next-auth` cross-tab sync key left over in `localStorage` from before the migration caused confusing client-side behavior — traced and confirmed to be a non-sensitive broadcast signal (the actual session token lives in an httpOnly cookie), not a security issue.

---

## 12. Load testing my-app — proving the data-layer fixes actually hold up

**Problem:** Stories 4-6 above (indexes, pagination, connection pooling) were reasoned-through fixes, verified only by lint/format and manual smoke testing. No real evidence yet that they hold up under concurrent load or at a realistic data volume — a scalability claim without a measurement behind it is just an assumption.

**How found:** Not a bug report — a deliberate validation step taken before making any scalability claims in a resume or interview, on the reasoning that "I added indexes" is a much weaker statement than "I measured what indexes did."

**Ways to approach it:**
- Load test against the small dataset already sitting in the dev database.
- Seed a large synthetic dataset first, since indexes and pagination only pay off once there's enough data that scanning all of it actually costs something.
- Skip real numbers entirely and rely on the code change alone as the claim.

**Chosen approach:** Seed a large synthetic dataset, then measure at two data volumes on the same code. Installed k6 and wrote a test script that logs in once via NextAuth's actual credentials flow — scripting the CSRF-token-then-credentials-callback exchange so the test simulates a real authenticated seller session rather than hitting open endpoints — and reuses that session across up to 50 concurrent virtual users hitting `/api/products`, `/api/orders`, and `/api/catagories`. Wrote a separate seeding script to insert 3,000 synthetic products (reusing real S3 image URLs from existing data) under a real seller account.

**After-effect:** Ran the identical test at two data volumes against the same (already-fixed) code. Against the small pre-existing dataset: p(95)=11.28ms, 0% errors, ~254 req/s. Against the 3,000-product seeded dataset: p(95)=20.82ms, 0% errors, ~253 req/s sustained. Response time barely moved despite a 250x increase in data — measured evidence, not an assumption, that the indexing and pagination work scales.

---

## 13. Load testing ecomm-front — a wrong hypothesis that found two real bugs

**Problem:** Manual testing suggested the storefront's homepage felt slow, and the working theory was that image loading was the bottleneck.

**How found:** Rather than assume the hypothesis was correct, wrote a k6 script against the same 3,000-product seeded dataset that measured the product-listing API and the actual image-serving path (through Next's `/_next/image` optimization endpoint, matching what a real browser requests) as two separately tagged metrics — built specifically to test the theory, not confirm it.

**What the data actually showed:** The hypothesis was wrong. Images came back fast: p(95)=787ms, under threshold. The real problem was the product-listing API itself: p(95)=16.12s, because `ecomm-front`'s `/api` route had no pagination at all and returned every product in the database on every single request — confirmed by `data_received: 1.1 GB` transferred over the course of the test.

**Ways to fix it:**
- Add pagination, matching the pattern already proven in my-app.
- Add pagination and stop there, since "much faster" would already look like a win.
- Add pagination, then keep investigating rather than assume one fix was sufficient.

**Chosen approach:** The third option. Added `page`/`pageSize` pagination to `/api` (preserving the existing `?id=` and `?limit=` behavior used elsewhere in the app), then re-ran the test: p(95) dropped to 2.12s — a huge improvement, but still failing the 500ms threshold, with several requests hitting a full 60-second timeout. Rather than call that good enough, dug into why it was still slow instead of stopping at "much better."

**After-effect:** Found that `ecomm-front` had the identical connection-pooling race condition from Story 6 above, just never fixed there — the two apps don't share code, so only `my-app`'s connection helper had been patched. Applied the same fix (cached connection promise, bounded pool size) and re-ran a third time: p(95)=86.13ms, 0% errors, 0 timeouts, throughput up to ~167 req/s. Full arc across the three runs: 16.12s → 2.12s → 86.13ms, roughly a 187x improvement — from a single load test that disproved its own starting theory and surfaced two distinct, real bugs instead of the one it went looking for.

---

## What this list intentionally leaves out

Being upfront about this matters as much as the fixes above: there is currently no automated test coverage in either app, and no observability (structured logging, error tracking, or metrics) beyond what these load tests measured manually. AWS deployment is also not yet complete. Load testing itself is now done and produced real numbers, as documented above; testing and observability are the next gaps worth closing. Presenting this list without these caveats would overstate where the project actually stands.
