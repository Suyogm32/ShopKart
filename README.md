![CI](https://github.com/Suyogm32/ShopKart/actions/workflows/ci.yml/badge.svg)
# Shopkart

A Flipkart/Shopify-style e-commerce platform: sellers manage a store from a dashboard, customers shop a public storefront. Both apps share one MongoDB database.

## Apps

- **`/` (this app, "Shopkart-Seller")** — seller portal. Auth (NextAuth v4, Google + credentials), product/category/order management, image upload to S3.
- **`/ecomm-front`** — customer-facing storefront. Product browsing, cart, Stripe checkout, order confirmation email.

Sellers create products here; the storefront reads only products created by sellers through this app, from the same database.

## Stack

Next.js (App Router), MongoDB + Mongoose, NextAuth, AWS S3 (product images), Stripe (payments), Tailwind CSS.

## Getting started

Each app has its own `package.json`, `.env`, and dev server — run them independently.

```bash
# seller portal (this directory)
npm install
cp .env.example .env   # fill in real values
npm run dev            # http://localhost:3000

# storefront
cd ecomm-front
npm install
cp .env.example .env
npm run dev
```

See `.env.example` in each app for the required environment variables.

## Status

Actively being hardened for production readiness (indexing, pagination, auth/ownership checks, load testing, UI overhaul) in two phases — seller portal first, then storefront. See `PRODUCTION_READINESS_ROADMAP.md` for the full plan.
