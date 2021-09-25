module.exports = {
    "testEnvironment": "node",
    "transform": {
        ".(ts|tsx)": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js"
    ],
    "coveragePathIgnorePatterns": [
        "/node_modules/",
        "/test/"
    ],
    "coverageThreshold": {
        "global": {
            "branches": 40,
            "functions": 55,
            "lines": 55,
            "statements": 55
        }
    },
    setupFiles: ["<rootDir>/test/setup.ts"],
    "testPathIgnorePatterns": [
        "/dist/"
    ],
    "collectCoverageFrom": [
        "src/**/*.{js,ts}"
    ]
}
