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

## 14. Destructive-action confirmations relying on a blocking, unstyled third-party modal

**Problem:** Delete confirmations across the app used `react-confirm-alert`, a third-party dialog library with its own default styling — a full-screen dark overlay and a boxed dialog that had no dark-mode support and visibly didn't match the rest of the redesigned UI.

**How found:** Reported directly via screenshot — the confirmation dialog looked jarring next to the rest of the app, and fully obscured the page behind it.

**Ways to solve it:**
- Override `react-confirm-alert`'s CSS to match the app's design tokens.
- Replace it entirely with a custom confirmation built on `react-hot-toast`, already a dependency, rendered as a small non-blocking card instead of a full-screen modal.

**Chosen approach:** A custom `confirmToast()` helper. Avoided fighting a third-party library's internal styling, kept the page behind the confirmation fully visible and interactive, and reused a dependency already in the project instead of pulling in CSS overrides for a second one.

**After-effect:** Replaced every `confirmAlert()` call (Products, Categories) with `confirmToast()`. Took a few rounds to get right: the standard `toast()` call still inherits react-hot-toast's own default wrapper styling, which fought with custom background colors and left the card looking translucent no matter what Tailwind classes were applied to the inner content — the actual fix was switching to `toast.custom()`, which renders exactly the given JSX with zero default styling. Also moved off a dark-mode color variant using an opacity modifier (`amber-950/40`), which blended into the app's own dark background and defeated the point of an "alarming" warning color — settled on one solid, theme-independent amber instead.

---

## 15. Full-page navigation breaking flow on create/edit

**Problem:** Creating or editing a Category or Product required navigating to a separate route (`/products/new`, `/products/edit/[id]`), losing the list view entirely and requiring a full round-trip back to see the result.

**How found:** Direct design feedback, referencing an external reference UI (a slide-in "Create Change" panel) as the target feel.

**Ways to solve it:**
- Keep separate pages, improve their layout and return-navigation instead.
- Use a centered modal dialog.
- Use a slide-in side panel that overlays the list view and closes back into it on save/cancel.

**Chosen approach:** A slide-in side panel (overlay + `translate-x` transition), built once for Categories and then reused identically for Products. Keeps the list visible underneath instead of navigating away, and establishes one interaction pattern reused app-wide rather than a bespoke one per page.

**After-effect:** Required decoupling `ProductForm`'s save logic from a hardcoded `router.push` redirect into an optional `onSuccess` callback, so the same form component works both embedded in a panel and on its original standalone page (which still works unmodified via the old redirect, for any direct link to it). Refined over several rounds of visual feedback into fields grouped into visually distinct card sections (identity / images / price & stock) with a gray panel background and white section cards, closely modeled on a reference screenshot the user provided.

---

## 16. Row-based list layout was a poor fit for image-heavy content

**Problem:** The Products list reused the same horizontal-row layout as Orders and Categories. For products specifically — inherently visual, image-first items — this wasted the product image (a small 48px thumbnail) and read more like a spreadsheet than a storefront-adjacent admin tool.

**How found:** Direct feedback: "can we have cards instead of these big rows."

**Ways to solve it:**
- Keep rows, just enlarge the thumbnails.
- Switch to a responsive card grid.

**Chosen approach:** A responsive card grid (2–5 columns depending on viewport), image-forward with a square-cropped thumbnail, name/price/stock and actions below. Rows were kept for Orders and Categories — dense, comparison-heavy, non-visual data — since the row-vs-card decision was made per content type rather than applying one layout uniformly across the whole app.

**After-effect:** Products now render as an image-led grid; products with no uploaded image yet show a placeholder icon instead of a blank thumbnail.

---

## 17. Delivery agent assignment — a new domain entity, and a mid-build research correction

**Problem:** Orders had no notion of who placed the order or who was handling delivery — only a boolean `delivered` flag.

**How found:** Direct feature request, paired with a genuine open question from the user about whether an in-house "delivery agent" was even the right model for how real online sellers operate.

**Ways to solve it:**
- A free-text "assigned to" field per order — fastest, but no validation and no reuse of agent names.
- A full `DeliveryAgent` model with its own management page, referenced from each order via a live assignment dropdown.

**Chosen approach:** The full model. `Backorders.deliveryAgent` references a new seller-scoped `DeliveryAgent` collection (name, phone). Building this also surfaced that the existing `Order` model already captured the customer's name, email, and address at checkout — data that had never been surfaced in the seller dashboard — so populating that reference into the Orders API added Customer and Address columns for free, without any new data-capture work.

**After-effect, and a self-correction:** Before extending this further, stopped to research how real e-commerce sellers actually handle delivery. Finding: most small-to-mid online sellers don't run their own delivery staff — they hand off to third-party courier aggregators (Shiprocket, Delhivery, and similar) via API, and the seller dashboard just shows a carrier name and tracking number, which is exactly how Shopify's own fulfillment UI works. The in-house `DeliveryAgent` model built here is a legitimate pattern for hyperlocal/same-city sellers, but not the majority case. Decision made: keep this feature — documented honestly as the hyperlocal-delivery path — and layer a second, more broadly representative feature on top of it next: a real third-party shipping API integration (rate shopping, label purchase, webhook-driven tracking status), matching the pattern already proven with the Stripe payment webhook. Tracked as its own case study once built, rather than treating the first attempt as the final answer.

---

## 18. Integrating a real shipping carrier API — and discovering the demo was geographically incoherent

**Problem:** After building an in-house delivery-agent feature (#17), research showed most real online sellers don't employ delivery staff at all — they hand off to third-party couriers via API, and the seller dashboard shows a carrier name and tracking number. The app had no such capability: an order's entire fulfilment state was one `delivered` boolean.

**How found:** Not a bug — a deliberate follow-up to the research correction documented in #17, chosen specifically because it would be a *second* webhook-driven third-party integration alongside the existing Stripe one, in a different domain.

**Ways to solve it:**
- Integrate an Indian courier aggregator (Shiprocket, Delhivery) — geographically correct for this app's users.
- Integrate a developer-first shipping API (Shippo, EasyPost) — wrong geography, but instantly accessible.
- Skip live integration and model carrier/tracking as plain manually-entered fields.

**Chosen approach:** Shippo, deliberately and with the tradeoff documented. Both Shiprocket and Delhivery gate API access behind business registration and KYC with no self-serve sandbox — Delhivery's staging credentials require emailing client services, and their developer portal assumes an existing client account. Shippo issues a test API key (`shippo_test_`) immediately with no verification. Time-to-first-successful-API-call decided it: the correct-for-India option would have blocked progress indefinitely on a portfolio project.

**After-effect:** Full flow built and working end to end — rate shopping across live carrier options, label purchase returning a real tracking number and printable PDF, and a `track_updated` webhook that updates shipping status and flips `delivered` automatically when a carrier reports delivery. Several things worth recording from the build:

- **Rate-shopping and label-purchase have different validation strictness.** The same address that returned rates fine was rejected at purchase time for a missing `address_from.email`, then again for a missing `phone` — discovered empirically, one failure at a time, because Shippo's required-fields list for transactions isn't documented in one place. Each fix also invalidated previously-fetched rate IDs, since rates are bound to the shipment object built from the incomplete address.
- **Swallowed error detail cost two debugging cycles.** The initial API wrapper assumed failures always arrive as `{ detail }` and fell back to a generic message otherwise, which turned a specific carrier error into "Failed to fetch shipping rates." The same mistake repeated later: the wrapper discarded Shippo's `messages` array, so a shipment that returned zero rates surfaced as a blank "No rates available" with no reason. Both were fixed by propagating the provider's own error text through to the response. Lesson: a thin wrapper around a third-party API must not narrow the error surface, or every failure becomes a guessing game.
- **The demo was geographically incoherent, and testing surfaced it.** Ship-from was a San Francisco warehouse; customers were in Pune. The first working version passed rate validation only because the destination was quietly replaced with a hardcoded US address — meaning every order returned identical rates for a shipment that could never physically happen (USPS Ground Advantage does not deliver to India). Rather than leave that in place, the demo's fictional store was reframed as US-based end to end: seller pickup address, customer delivery addresses, and carrier all in one country. Rates now genuinely vary by destination, which is the entire point of rate shopping. The final failure before it worked — Shippo reporting "shipment origin is out of service area" — was the seller's pickup address still holding real Indian data, which is exactly the kind of error the earlier hardcoding had been hiding.

**The provider abstraction, and why it isn't decorative:** Routes never call Shippo directly. `src/lib/shipping/index.js` exposes `getRates()` and `buyLabel()`; `src/lib/shipping/shippo.js` implements them and normalises Shippo's response fields into the app's own shapes (`rateId`, `trackingNumber`, `labelUrl`) so no route or component depends on a carrier's field names. Swapping providers means adding one file and changing one line. This is a concrete plan, not a hypothetical: if Delhivery grants staging access, that is the exact shape of the migration — which is why the abstraction was built before there was a second provider to justify it.

---

## 19. Seller onboarding and settings — closing a multi-tenancy gap found by accident

**Problem:** The signup form was a single flat column of nine unlabelled inputs, and the Settings page was literally the text "This is settings page." Separately — and more seriously — the shipping integration read its ship-from address from `SHIP_FROM_*` environment variables, meaning every seller on a supposedly multi-tenant platform shipped from the same hardcoded warehouse.

**How found:** The env-var problem surfaced while deciding what Settings should contain, not from a bug report. Signup collected each seller's address at registration and then never used it anywhere — the data was already there, just disconnected from the feature that needed it.

**Ways to solve it:**
- Leave ship-from as an env var (fine for a single-seller demo, wrong for the multi-tenant model the rest of the app already implements).
- Store a pickup address per seller and have rate-shopping read it from the logged-in seller's record.

**Chosen approach:** Per-seller pickup address, managed in Settings, consumed by `/api/shipping/rates`. This also made the Settings page meaningful rather than filler — it's the reason labels can be purchased at all, and the rate endpoint now returns an actionable 422 ("add it under Settings → Pickup address") instead of silently using someone else's warehouse.

**After-effect:** Settings now covers business profile, pickup address, store branding, vacation mode, and password change — the last of which didn't exist anywhere in the app before, meaning users had no way to change their own password. Research into what real seller portals expose (Shopify's store details/notifications/policies, Amazon's vacation mode and login settings) drove the section list; vacation mode came directly from that and is the one feature here with no equivalent anywhere else in the app. Signup was rebuilt as a three-step wizard (account → business → pickup address) with per-step validation, matching how Amazon and Flipkart actually onboard sellers, and with optional GSTIN/business-type fields since research confirmed GST registration is mandatory for Indian marketplace sellers from day one. Bank account and PAN were deliberately **not** collected despite being standard on real platforms — the `User` schema stores fields in plaintext with no encryption-at-rest, and storing regulated financial and identity data that way would be a genuine liability rather than a feature.

**Known gap:** the vacation-mode toggle persists correctly but `ecomm-front` doesn't yet filter products by it, so a paused store's products still appear on the storefront. Recorded here rather than left to be discovered.

---

## 20. Rebuilding the storefront — and the bugs a rewrite surfaces

**Problem:** The customer-facing storefront had barely been touched while the seller portal was rebuilt. It was styled-components with a dated look, and more importantly it had accumulated silent defects nobody had reason to notice.

**How found:** A UI redesign pass, working from a reference storefront design. The bugs weren't the goal — they turned up because rewriting a component forces you to read every line of it.

**What the rewrite surfaced, none of which was reported as a bug:**
- `Header.jsx` began with `"use clinet"` — a misspelled directive, therefore not a directive at all. It worked only because a parent component was already a client component, so the mistake was invisible.
- The header linked to `/catagories` and `/account`. Neither route existed. Two dead links in the primary navigation.
- The homepage's featured product was a hardcoded document ID. Delete that one product and the hero silently renders blank.
- `CartContext` only persisted to `localStorage` when the cart was non-empty (`if (cartProducts?.length > 0)`), so removing the last item never wrote the empty state — the old cart reappeared on refresh. **Customers could not empty their cart.**
- `layout.js` still carried Next's default `"Create Next App"` title and description, on a site about to be deployed.

**Chosen approach:** Rebuild in Tailwind (already installed but unused in that app) rather than extend styled-components, since these were full rewrites rather than tweaks — keeping the old approach would have meant editing around code being wholly replaced. Existing untouched components stay styled-components; the two systems coexist deliberately rather than through a stalled migration.

**After-effect:** Header, homepage, product listing, product detail, cart, and checkout rebuilt. New capability added where the design demanded data the API couldn't provide: the storefront had no categories endpoint and no search or category filtering, so those were built to support the navigation rather than faked.

**The lesson worth keeping:** every one of those defects had been in production-shaped code for months, and none would have been found by testing the happy path. They surfaced because a rewrite forces line-by-line reading. That's an argument for tests, not for rewrites — automated coverage of "cart can be emptied" would have caught the worst one immediately.

---

## 21. Customer accounts — and two auth systems sharing a cookie jar

**Problem:** Order tracking initially required customers to paste a 24-character order ID plus their email. Functional, but poor UX, and there was no way to see more than one order at a time.

**How found:** Direct feedback after using the guest lookup flow that had just been built.

**Ways to solve it:**
- Keep guest lookup and improve the UX around it.
- Add full customer accounts with order history.

**Chosen approach:** Customer accounts, with a deliberate data-model decision: a **separate `Customer` collection**, not a `role` field on the existing `User` collection. `User` holds sellers, with GSTIN, pickup addresses, and vacation mode, and it's what the admin portal authenticates against. A shared collection with a role flag would mean every auth check in both apps has to remember to verify the role — miss one and a customer account can reach the seller portal. Two collections make that failure impossible rather than merely unlikely.

**The bug this created, which is genuinely non-obvious:** after adding NextAuth to the storefront, signing into one app broke the session in the other. **Cookies are scoped by host, not by origin — the port is not part of the scope.** Both apps run on `localhost`, and both NextAuth instances used the same default cookie name, so each sign-in overwrote the other's session token. Since the two apps have different `NEXTAUTH_SECRET` values, the surviving app then couldn't decrypt the token it found and errored. Fixed by namespacing the storefront's cookie names. Worth noting this isn't only a localhost problem: two apps on subdomains of the same registrable domain hit exactly the same collision.

**After-effect:** Customers get accounts (email/password plus Google OAuth), an order history split into in-progress and past orders, a profile page, and a saved address book with labels and a default. Checkout requires an account and pre-selects the default address. Order cancellation with automatic Stripe refunds was built alongside it, gated on nothing having shipped yet — and deliberately sequenced so the refund succeeds *before* the order is marked cancelled, because the reverse order risks a cancelled order with the customer's money still taken.

---

## 22. Charging what the customer was shown — live shipping, tax, and three payment bugs

**Problem:** The cart total was the sum of item prices. No tax, no shipping — while the homepage banner promised "free shipping over $80," a claim nothing in the code honoured.

**How found:** Direct question about whether GST and delivery charges should be calculated, which turned into a scoping conversation about how accurate a shipping quote could realistically be.

**Ways to solve it:**
- Flat tax rate plus threshold-based shipping — hours of work, honest, approximate.
- Live carrier rates quoted at checkout — real numbers, substantially more work.

**Chosen approach:** Live rates, plus committing the demo to a single country. Quoting real shipping before payment meant confronting things the fulfilment-time version could ignore: a cart can hold items from **multiple sellers with different pickup addresses**, so quotes are grouped by seller and the cheapest rate from each is summed; and products had no weight or dimensions, so those were added to the schema and the seller product form rather than continuing to quote a hardcoded box.

Committing to USD then hit a constraint no amount of code could solve: **Stripe blocks India-based accounts from accepting international payments** under India's export regulations, and this applies in test mode because test mode mirrors the account's real capabilities. Resolved by provisioning a second Stripe test account registered in the US. That's the same lesson as the Shiprocket/Delhivery finding in #18 — the API you should use and the API you're permitted to use are different questions.

**Three real payment bugs found while building this, all pre-existing:**
- **Stripe was being told the wrong unit price.** `unit_amount` was set to `quantity * price * 100`, but Stripe multiplies `unit_amount` by `quantity` itself — so ordering two of an item charged four times the price. Invisible at quantity 1, which is presumably why it survived.
- **Seller order records inherited that same wrong number**, because the per-seller aggregate reverse-engineered its price from the Stripe line item instead of the product record. Now built from product and quantity directly.
- **Editing any product threw a 500.** The `PUT` handler referenced an undefined `_id` — it was never destructured from the request body, and Zod strips unknown keys so parsing wouldn't have preserved it either.

**After-effect:** Totals are computed by one shared module used by both the quote endpoint (what the customer sees) and the checkout endpoint (what Stripe charges), so the two cannot drift. Checkout recalculates server-side rather than trusting browser-supplied amounts. Shipping and tax are separate Stripe line items and are persisted on the order. Known simplification, recorded rather than hidden: multi-item parcels sum weights but take the largest single dimension instead of doing real box packing — accurate for one item, reasonable for a few, wrong for a large mixed cart.

---

## 23. Closing the testing gap — and what each layer actually caught

**Problem:** Every entry in this document up to here was verified by hand. The project had zero automated tests, which this section previously named as its biggest gap. Several bugs documented above — the cart that couldn't be emptied, the 4× overcharge — had survived for months precisely because nobody re-checks working features by hand.

**How found:** Deliberately scheduled after the storefront work, not before. Writing tests against code still being redesigned would have meant rewriting the tests alongside it.

**Ways to approach it:**
- Unit tests on pure logic only — fast to write, but misses the rules that protect money.
- Full E2E only — highest confidence, slowest, and gives poor signal on *why* something broke.
- Layer them: pure logic, then API contracts with mocked externals, then a browser-driven flow.

**Chosen approach:** All three layers, using Jest (with `next/jest`, which supplies the SWC transform so no Babel config is needed) plus Playwright. 67 tests total: 55 Jest, 12 Playwright.

The layers were chosen to cover different failure modes rather than to hit a coverage number:
- **Pure logic** (`pricing.js`) — quantity collapsing, tax applying to goods but not shipping, float rounding. No mocking, runs in milliseconds.
- **API handlers** (checkout, cancellation) with Mongoose, Stripe and `auth()` mocked. These encode the *money rules* as executable specifications: a shipped order can't be cancelled, a partially-shipped one counts as shipped, and critically **a failed Stripe refund must not mark the order cancelled** — get that ordering wrong and you have a cancelled order with the customer's money still taken.
- **Browser E2E** (Playwright) — browsing, search, cart, the checkout auth gate.

**What each layer actually caught, which is the interesting part:**

Two Jest tests are explicit regressions for bugs hit during development, with comments naming what they guard: the empty-cart persistence bug, and the effect-ordering bug where clearing the cart before the provider finished hydrating got silently overwritten.

The E2E suite earned its place on its **first real run**. A "Clear cart" button had been silently deleted during the address-picker refactor — a working feature removed by accident, unnoticed by both author and reviewer, because nobody manually re-clicks a button that already worked. Notably, the `CartContext` unit tests still passed: `clearCart` was never broken, it had just become unreachable from the UI. Only a test driving the rendered page could see that. That single failure is the clearest argument for keeping both layers rather than choosing one.

A second E2E failure was instructive in the opposite direction — a test bug, not an app bug. Navigating to `/cart` immediately after clicking "add to cart" outran the cart's `localStorage` write, so the page rendered empty. Fixed by waiting on an observable consequence (the header badge) rather than adding a sleep, which is the difference between an E2E suite that stays fast and one that becomes slow and flaky anyway.

**Deliberate limits, recorded rather than hidden:** E2E stops at the Stripe redirect — driving Stripe's hosted checkout tests Stripe's UI more than this app's, and the mocked route tests already cover what gets sent to it. E2E also runs against the real dev database rather than a seeded fixture; more rigorous isolation was judged not worth the maintenance cost at this size. Coverage is deliberately concentrated on money-handling paths and known-fragile logic, not spread evenly for a percentage.

---

## 24. Deploying to AWS — where local assumptions stop being true

**Problem:** Everything above ran on localhost. A project that has never been deployed hasn't met the class of problem that only appears in production, and "it works on my machine" is not a claim worth making.

**How found:** Deliberate final phase, sequenced after tests so the deployment shipped code with a suite behind it.

**Ways to approach it:**
- A managed platform (Vercel, AWS Amplify) — connect the repo, done in minutes.
- Raw EC2 with nginx and PM2 — more work, but you own every layer.
- Elastic Beanstalk — middle ground, AWS manages the instance from a config file.

**Chosen approach:** A single `t3.micro` EC2 instance running both apps under PM2 behind an nginx reverse proxy, with Let's Encrypt for TLS. Managed platforms would have been faster but hide exactly the parts worth understanding — process supervision, reverse proxying, certificates, firewall rules. The constraint of staying inside AWS's free tier also forced real decisions rather than throwing resources at problems.

**What actually broke, and why none of it could have surfaced locally:**

**1 GB of RAM is not enough to build two Next.js apps.** `next build` routinely exceeds it, and the Linux OOM killer terminates the process with no useful error — the build simply dies. Fixed with a 2 GB swap file. Builds became slow (swap is disk-backed) but completed. Also relevant: `t3` instances default to *unlimited* CPU credit mode, which **bills for sustained CPU above baseline** rather than throttling — and a Next build pegs both vCPUs for minutes. Switching to Standard mode trades slower builds for a guaranteed zero bill.

**Secure cookies keyed off the wrong signal.** The storefront's cookie config used `secure: process.env.NODE_ENV === "production"`. Correct-looking, and correct in most deployments — but the first deploy ran production builds over plain HTTP, so the browser silently discarded every secure-flagged cookie, the CSRF token was never stored, and *every* credential sign-in failed with `MissingCSRF`. The fix was to derive it from the actual URL scheme instead:

```js
const useSecureCookies = (process.env.NEXTAUTH_URL || "").startsWith("https://");
```

This also self-corrects when TLS is added later. Notably this is the **second** bug from the same cookie work — the first was two apps on different localhost ports silently sharing one cookie jar, because cookies are scoped by host and *not* by port. Cookie configuration is unusually good at hiding environment-dependent behaviour.

**Google OAuth forced a DNS decision.** Google rejects raw IP addresses as OAuth redirect URIs entirely — not merely HTTP ones. There is no configuration that makes `http://13.x.x.x` work, so a hostname stopped being a nice-to-have and became a hard prerequisite. Resolved with free DuckDNS subdomains plus a Let's Encrypt certificate via certbot, which also unblocked the Stripe and Shippo webhooks — both require public HTTPS endpoints.

**A route was silently frozen at build time.** The production build output flagged `/api/categories` as `○ (Static)` while every other API route was `ƒ (Dynamic)`. Next had found nothing dynamic in it and prerendered the response, meaning new categories would never appear on the storefront until the next rebuild. Fixed with `export const dynamic = "force-dynamic"`. This is a class of bug that cannot occur in `next dev`, where everything is dynamic by default — it only exists in production builds, and only the build output reveals it.

**After-effect:** Both apps run on one instance behind nginx with hostname-based routing and auto-renewing TLS. Stripe webhooks arrive at a real public endpoint rather than a local CLI tunnel, so orders are marked paid without a developer machine involved. PM2 restarts crashed processes and restores both apps after a reboot.

**What this deployment is honestly not:** a single instance with no load balancer, no health checks, no auto-scaling, and no monitoring — if it goes down, nobody is paged. Deploys are manual (`git pull`, rebuild, restart) rather than a pipeline, and the database allowlist is wider than it should be. Those are the right next steps, not things quietly omitted.

---

## 25. CI/CD and the first steps toward observability

**Problem:** Deploys were manual — SSH in, pull, build twice, restart. The test suite from #23 only ran when someone remembered to run it. And production was unobserved: if the site broke, nobody would know until they happened to open it.

**How found:** The two remaining gaps this document had been naming since #23.

**Chosen approach:** CI/CD first, deliberately — every later change ships through the pipeline instead of by hand, so the work compounds. GitHub Actions runs lint, format check, and a production build of *both* apps, then Jest, then Playwright. Only when all of those pass does a deploy job SSH into EC2 and roll out. Pull requests run the same checks but never deploy.

**What broke, and what each failure taught:**

**Playwright's dev server never came up in CI.** The `webServer` command was `npm run dev`, which binds port 3000 — it only lands on 3001 locally because the seller portal already holds 3000 and Next auto-increments. On a clean runner nothing does, so Playwright waited on an empty port until timeout. Fixed by making the port explicit, and by serving the production build in CI rather than dev — so E2E exercises the same output that gets deployed.

**The second deploy could never succeed.** `npm install` rewrites `package-lock.json` on the server, so the next `git pull` found local modifications and aborted. The deploy target was being treated as a workspace. Fixed with `git fetch` + `git reset --hard origin/main`: the server mirrors origin rather than merging with it, which also makes deploys idempotent regardless of what the previous run left behind.

**Adding Sentry broke the build in a way swap could not fix.** The earlier swap file (#24) solved the *OS* OOM killer. This was different: V8 sizes its own heap ceiling from available RAM — about 460 MB on a 1 GB instance — and refuses to grow past it no matter how much swap exists. Sentry's webpack plugin pushed the build over that line. Fixed by raising `--max-old-space-size` and expanding swap to back it. Two OOM failures, two genuinely different causes, and the second one is invisible if you assume the first fix generalises.

**After-effect:** Push to main now runs four jobs and, if all pass, deploys automatically. Deploys take ~13 minutes, almost all of it paging to disk while building with a 1.5 GB heap on a 1 GB machine — the honest cost of free-tier hardware. Health check endpoints in both apps verify database reachability and return **503, not 200**, when Mongo is unreachable; UptimeRobot polls those rather than the homepage, so a database outage pages you instead of reporting "up" while checkout is broken.

**What this deliberately stops short of, and why:**

Error tracking (Sentry) covers **only the seller portal**. The storefront — the app that handles payments, shipping quotes and checkout, and therefore the one where a silent failure actually costs an order — has no SDK installed. It was skipped because each Sentry-instrumented app makes the already-slow build slower, and this was the point where finishing beat completing. Worth being precise about a related trap: connecting the GitHub repo to Sentry provides source-code linking for errors that were already captured. It does **not** instrument an app. Repo connected ≠ app monitored.

Structured logging was skipped entirely; production diagnosis is still `pm2 logs`. There's no log aggregation, no metrics, and no alerting beyond uptime.

The 13-minute deploy has a known fix that wasn't taken: build on the CI runner (16 GB of RAM) and ship the `.next` output to the server, leaving the instance to do nothing but restart. That would cut deploys to under a minute. It's a restructure of the pipeline rather than a tweak, and was left as the obvious next step rather than rushed.

---

## What this list intentionally leaves out

Being upfront about this matters as much as the fixes above.

**Observability is partial** (see #25). Uptime monitoring and health checks exist for both apps, but error tracking covers only the seller portal — the customer-facing storefront, where payments and checkout live, has no Sentry SDK installed. There is no structured logging, no log aggregation, and no metrics; production diagnosis is still SSH plus `pm2 logs`.

**Test coverage is real but narrow** (see #23). It concentrates on the storefront's money-handling paths; the seller portal has no automated tests of its own, and the shipping integration is covered through mocks rather than against Shippo's sandbox.

**The deployment is a single instance** (see #24) with no load balancer, health checks, or auto-scaling, and deploys are manual rather than a CI/CD pipeline. The MongoDB Atlas allowlist is wider than it should be.

**Some integrations stand in for what production would really use.** Shippo replaces an Indian courier because Shiprocket and Delhivery gate API access behind business KYC; the store was reframed as US-based so shipping, addresses and currency stay internally consistent. Both are documented tradeoffs (#18, #22), not oversights — but they are simplifications.

Presenting this list without these caveats would overstate where the project actually stands.
