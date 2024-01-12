module.exports = {
  "clearMocks": true,
  "collectCoverage": true,
  "collectCoverageFrom": [
    "./src/data/**/*.js",
    "./src/utilities/**/*.js",
    "./src/services/**/*.js",
    "./src/tasks/**/*.js",
    "./src/migration/*.js",
    "./components/*.js",
    "./components/approvals/*.js",
    "./components/charts/*.js",
    "./components/datasets/*.js",
    "./components/datasets/*/*.js",
    "conf.js"
  ],
  "coverageReporters": ["text", "html", "cobertura"],
  "coverageThreshold": {
    "./src/": {
      "lines": 80
    }
  },
  "moduleNameMapper": {
    "\\.(css|less|scss|sss|styl)$": "<rootDir>/node_modules/jest-css-modules"
  },
  "setupFiles": ["jest-localstorage-mock"],
  "setupFilesAfterEnv": ['<rootDir>setupTests.js'],
  "testEnvironment": "jsdom"
};
