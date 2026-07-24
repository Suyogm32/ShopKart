import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // ramp up to 20 concurrent users
    { duration: "1m", target: 20 }, // hold
    { duration: "30s", target: 50 }, // ramp up to 50
    { duration: "1m", target: 50 }, // hold
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be under 500ms
    http_req_failed: ["rate<0.01"], // less than 1% error rate
  },
};

export function setup() {
  const jar = http.cookieJar();

  // Step 1: NextAuth requires a CSRF token before it'll accept a login
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`);
  const csrfToken = JSON.parse(csrfRes.body).csrfToken;

  // Step 2: log in via the credentials provider
  const loginRes = http.post(`${BASE_URL}/api/auth/callback/credentials`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    csrfToken,
    json: "true",
  });

  check(loginRes, {
    "login succeeded": (r) => r.status === 200 || r.status === 302,
  });

  // Step 3: pull the session cookie the jar collected, so every VU can send it explicitly
  const cookies = jar.cookiesForURL(BASE_URL);
  const cookieHeader = Object.entries(cookies)
    .map(([name, values]) => `${name}=${values[0]}`)
    .join("; ");

  return { cookieHeader };
}

export default function (data) {
  const headers = { Cookie: data.cookieHeader };

  const products = http.get(`${BASE_URL}/api/products?page=1&limit=20`, { headers });
  check(products, { "products 200": (r) => r.status === 200 });

  const orders = http.get(`${BASE_URL}/api/orders?page=1&limit=20`, { headers });
  check(orders, { "orders 200": (r) => r.status === 200 });

  const categories = http.get(`${BASE_URL}/api/catagories?page=1`, { headers });
  check(categories, { "categories 200": (r) => r.status === 200 });

  sleep(1);
}
