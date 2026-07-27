import "@testing-library/jest-dom";

// localStorage isn't implemented in jsdom's default environment in a way that
// resets between tests, so give each test a clean in-memory implementation.
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

beforeEach(() => {
  // This setup file runs for every suite, including API route tests that use
  // the node environment where `window` doesn't exist.
  if (typeof window === "undefined") return;

  Object.defineProperty(window, "localStorage", {
    value: new LocalStorageMock(),
    writable: true,
  });
});
