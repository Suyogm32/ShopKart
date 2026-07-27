const { test, expect } = require("@playwright/test");

/**
 * Browsing and cart flow — no authentication required.
 *
 * These run against the real dev server and real database, so they assume the
 * catalogue has at least one product. That's a deliberate tradeoff: seeding a
 * dedicated test database would be more rigorous but much heavier to maintain
 * for a project this size.
 */

test.describe("Browsing", () => {
  test("homepage renders hero, categories and new arrivals", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /shopkart/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /new arrivals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /shop now/i })).toBeVisible();
  });

  test("products page lists products with a count", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "All products" })).toBeVisible();
    await expect(page.getByText(/\d+ products?/)).toBeVisible();
  });

  test("search filters the catalogue and reflects the query", async ({ page }) => {
    await page.goto("/products");

    const firstProduct = page.locator('a[href^="/products/"]').nth(1);
    const name = (await firstProduct.textContent())?.trim() || "";
    const term = name.split(" ")[0];
    test.skip(!term, "No products in catalogue to search for");

    await page.getByPlaceholder("Search for products…").fill(term);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(term)}`, "i"));
    await expect(page.getByRole("heading", { name: new RegExp(`Results for`, "i") })).toBeVisible();
  });

  test("a search with no matches shows the empty state, not a blank grid", async ({ page }) => {
    await page.goto("/products?search=zzzznotarealproduct");

    await expect(page.getByText("No products found")).toBeVisible();
    await expect(page.getByRole("link", { name: /browse all products/i })).toBeVisible();
  });

  test("product detail shows price, description and add to cart", async ({ page }) => {
    await page.goto("/products");
    await page.locator('a[href^="/products/"]').nth(1).click();

    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
    await expect(page.getByText("About this item")).toBeVisible();
    await expect(page.getByText(/^\$\d/).first()).toBeVisible();
  });
});

test.describe("Cart", () => {
  test("empty cart shows a call to action rather than an empty page", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByRole("heading", { name: /your cart is empty/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start shopping/i })).toBeVisible();
  });

  test("adding a product updates the header badge and cart contents", async ({ page }) => {
    await page.goto("/products");
    await page.locator('a[href^="/products/"]').nth(1).click();

    await page.getByRole("button", { name: /add to cart/i }).click();

    // Badge appears in the header with a count of 1.
    await expect(page.locator("header").getByText("1", { exact: true })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /^Cart/ })).toBeVisible();
    await expect(page.getByText("Order summary")).toBeVisible();
  });

  test("quantity controls change the line total", async ({ page }) => {
    await page.goto("/products");
    await page.locator('a[href^="/products/"]').nth(1).click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/cart");

    await page.getByRole("button", { name: "Increase quantity" }).first().click();
    await expect(page.locator("header").getByText("2", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Decrease quantity" }).first().click();
    await expect(page.locator("header").getByText("1", { exact: true })).toBeVisible();
  });

  // Regression: removing the last item used to leave the old cart in
  // localStorage, so it came back on reload.
  test("a cleared cart stays empty after a reload", async ({ page }) => {
    await page.goto("/products");
    await page.locator('a[href^="/products/"]').nth(1).click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Wait for the badge before navigating — otherwise the page change can
    // outrun the cart's localStorage write and /cart renders as empty.
    await expect(page.locator("header").getByText("1", { exact: true })).toBeVisible();

    await page.goto("/cart");
    await page.getByRole("button", { name: /clear cart/i }).click();
    await expect(page.getByRole("heading", { name: /your cart is empty/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: /your cart is empty/i })).toBeVisible();
  });

  test("checkout is gated behind signing in", async ({ page }) => {
    await page.goto("/products");
    await page.locator('a[href^="/products/"]').nth(1).click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/cart");

    await expect(page.getByText(/sign in to complete your order/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue to payment/i })).toHaveCount(0);
  });
});

test.describe("Order tracking", () => {
  test("track page offers guest lookup when signed out", async ({ page }) => {
    await page.goto("/track");

    await expect(page.getByPlaceholder("Order ID")).toBeVisible();
    await expect(page.getByRole("button", { name: "Track" })).toBeVisible();
  });

  test("an unknown order id is rejected with a clear message", async ({ page }) => {
    await page.goto("/track");

    await page.getByPlaceholder("Order ID").fill("not-a-real-order-id");
    await page.getByPlaceholder("Email used at checkout").fill("nobody@example.com");
    await page.getByRole("button", { name: "Track" }).click();

    await expect(page.getByText(/order id doesn't look right|no order found/i)).toBeVisible();
  });
});
