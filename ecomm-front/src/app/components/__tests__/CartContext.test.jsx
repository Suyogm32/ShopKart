import React, { useContext } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CartContextProvider, { CartContext } from "../CartContext";

// A minimal consumer that exposes the context through the DOM, so tests drive
// the provider the same way the real app does rather than calling internals.
const Harness = () => {
  const { cartProducts, addToCart, removeFromCart, removeAllOfProduct, clearCart, loaded } =
    useContext(CartContext);

  return (
    <div>
      <span data-testid="cart">{JSON.stringify(cartProducts)}</span>
      <span data-testid="count">{cartProducts.length}</span>
      <span data-testid="loaded">{String(loaded)}</span>
      <button onClick={() => addToCart("a")}>add-a</button>
      <button onClick={() => addToCart("b")}>add-b</button>
      <button onClick={() => removeFromCart("a")}>remove-one-a</button>
      <button onClick={() => removeAllOfProduct("a")}>remove-all-a</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
};

const renderCart = () =>
  render(
    <CartContextProvider>
      <Harness />
    </CartContextProvider>
  );

const cart = () => JSON.parse(screen.getByTestId("cart").textContent);

describe("CartContext", () => {
  it("starts empty when localStorage has nothing", () => {
    renderCart();
    expect(cart()).toEqual([]);
  });

  it("hydrates from localStorage on mount", () => {
    window.localStorage.setItem("cart", JSON.stringify(["a", "a", "b"]));
    renderCart();
    expect(cart()).toEqual(["a", "a", "b"]);
  });

  it("adds an item", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    expect(cart()).toEqual(["a"]);
  });

  it("adds the same item twice as two entries (quantity 2)", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("add-a"));
    expect(cart()).toEqual(["a", "a"]);
  });

  it("removeFromCart removes only one unit", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("remove-one-a"));
    expect(cart()).toEqual(["a"]);
  });

  it("removeAllOfProduct removes every unit of that product only", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("add-b"));
    await userEvent.click(screen.getByText("remove-all-a"));
    expect(cart()).toEqual(["b"]);
  });

  it("removing a product that isn't in the cart is a no-op", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-b"));
    await userEvent.click(screen.getByText("remove-one-a"));
    expect(cart()).toEqual(["b"]);
  });

  it("persists additions to localStorage", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    expect(JSON.parse(window.localStorage.getItem("cart"))).toEqual(["a"]);
  });

  // Regression test. The original implementation only wrote to localStorage
  // when the cart was non-empty, so removing the last item left the old cart
  // on disk and it reappeared on refresh — customers could not empty the cart.
  it("persists an EMPTY cart, so clearing survives a reload", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("remove-one-a"));

    expect(cart()).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem("cart"))).toEqual([]);
  });

  it("clearCart empties the cart and localStorage", async () => {
    renderCart();
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("add-b"));
    await userEvent.click(screen.getByText("clear"));

    expect(cart()).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem("cart"))).toEqual([]);
  });

  // Guards the ordering bug hit on the order-success page: clearing before the
  // provider finished hydrating got overwritten by the load effect.
  it("does not overwrite stored cart before hydration completes", () => {
    window.localStorage.setItem("cart", JSON.stringify(["a", "b"]));
    renderCart();

    expect(screen.getByTestId("loaded").textContent).toBe("true");
    expect(JSON.parse(window.localStorage.getItem("cart"))).toEqual(["a", "b"]);
  });

  it("a cleared cart stays cleared across a remount", async () => {
    const { unmount } = renderCart();
    await userEvent.click(screen.getByText("add-a"));
    await userEvent.click(screen.getByText("clear"));
    unmount();

    renderCart();
    expect(cart()).toEqual([]);
  });
});
