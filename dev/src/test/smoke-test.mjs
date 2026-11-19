import { compare } from "fastest-damerau-levenshtein";

if (compare("fast", "faster").distance !== 2) throw new Error("ESM Smoke test failed");
