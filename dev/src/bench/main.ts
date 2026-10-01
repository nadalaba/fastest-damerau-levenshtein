import { bench, run, summary, type k_state } from "mitata";
import { preparedLibs } from "./libs-manager.ts";
import { getGeneratedTests } from "../test/distance-cases.ts";

const seed = 51;

let iters = 1000;
let strLengths = [4, 16, 64, 256, 1024, 4096];
const charsetClusters = [
  { min: 0x61, max: 0x63 }, // latin
  { min: 0x0621, max: 0x0623 }, // arabic
  { min: 0x0f21, max: 0x0f23 }, // tibetan
  { min: 0x1f601, max: 0x1f603, weight: 0.1 }, // emoji
  { sequence: ["👁️‍🗨️", "👨🏼‍🦱", "👩🏾‍💻"], weight: 0.1 }, // emoji ZWJ sequence
];

let generatedStrings = getGeneratedTests(iters, strLengths, strLengths, charsetClusters, seed);

console.log("\n" + "=".repeat(80));
console.log(`generated ${iters * strLengths.length} test case`);
console.log("=".repeat(80) + "\n");

summary(() => {
  for (const lib of preparedLibs) {
    if (lib.variation === "restricted") continue;
    let argIndex = -1;
    let previousArg = 0;
    bench(`${lib.name}($strLength)`, function* (state: k_state) {
      const strLength = state.get("strLength");
      if (strLength !== previousArg) {
        argIndex = (argIndex + 1) % strLengths.length;
        previousArg = strLength;
      }
      let base = argIndex * iters;
      let i = -1;
      yield {
        [0]() {
          i = (i + 1) % iters;
          return generatedStrings.pack.s1[base + i];
        },
        [1]() {
          return generatedStrings.pack.s2[base + i];
        },
        bench(s1: string, s2: string) {
          lib.fn(s1, s2);
        },
      };
    }).args("strLength", strLengths);
    //.gc("inner");
  }
});

await run();

// all libraries with strings length less than 100
iters = 10000;
strLengths = [4, 8, 16, 32, 64, 96];
generatedStrings = getGeneratedTests(iters, strLengths, strLengths, charsetClusters, seed, true);

console.log("\n" + "=".repeat(80));
console.log(`generated ${iters * strLengths.length} test case`);
console.log("=".repeat(80) + "\n");

summary(() => {
  for (const lib of preparedLibs) {
    let argIndex = -1;
    let previousArg = 0;
    bench(`${lib.name}($strLength)`, function* (state: k_state) {
      const strLength = state.get("strLength");
      if (strLength !== previousArg) {
        argIndex = (argIndex + 1) % strLengths.length;
        previousArg = strLength;
      }
      let base = argIndex * iters;
      let i = -1;
      yield {
        [0]() {
          i = (i + 1) % iters;
          return generatedStrings.pack.s1[base + i];
        },
        [1]() {
          return generatedStrings.pack.s2[base + i];
        },
        bench(s1: string, s2: string) {
          lib.fn(s1, s2);
        },
      };
    }).args("strLength", strLengths);
    //.gc("inner");
  }
});

await run({ format: "markdown" });
//await run();
