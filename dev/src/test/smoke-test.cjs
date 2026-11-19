const { compare } = require("fastest-damerau-levenshtein");

if (compare("fast", "faster").distance !== 2) throw new Error("CJS Smoke test failed");
