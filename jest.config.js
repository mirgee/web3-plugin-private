module.exports = {
  testEnvironment: "node",
  fakeTimers: {
    enableGlobally: false,
  },
  testTimeout: 1000 * 60 * 15,
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
