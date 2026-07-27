const nextJest = require("next/jest");

// next/jest wires up SWC for transforms, handles CSS/image imports, and picks
// up the path aliases from jsconfig.json — so no Babel config is needed.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // jsdom by default so React component tests work. API route tests opt into
  // the node environment with a @jest-environment docblock at the top of the file.
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Playwright specs live in e2e/ and must not be picked up by Jest — its
  // default testMatch would otherwise grab *.spec.js files.
  testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "src/lib/**/*.{js,jsx}",
    "src/app/api/**/*.js",
    "src/app/components/CartContext.jsx",
  ],
};

module.exports = createJestConfig(config);
