import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    "http_req_duration{name:api}": ["p(95)<500"],
    "http_req_duration{name:image}": ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  let products = [];

  group("product listing API", () => {
    const listRes = http.get(`${BASE_URL}/api`, { tags: { name: "api" } });
    check(listRes, { "product list 200": (r) => r.status === 200 });
    try {
      const parsed = JSON.parse(listRes.body);
      products = Array.isArray(parsed) ? parsed : parsed.data || [];
    } catch (e) {
      products = [];
    }
  });

  group("product images", () => {
    const imageUrls = products
      .reduce((acc, p) => acc.concat(p.productImages || []), [])
      .filter(Boolean)
      .slice(0, 5);

    imageUrls.forEach((url) => {
      const optimizedUrl = `${BASE_URL}/_next/image?url=${encodeURIComponent(url)}&w=750&q=75`;
      const imgRes = http.get(optimizedUrl, { tags: { name: "image" } });
      check(imgRes, { "image 200": (r) => r.status === 200 });
    });
  });

  sleep(1);
}
