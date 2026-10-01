import { mainTestSubject, referenceTestSubject } from "../main-libs.ts";
import type { DistanceOptions, Lib } from "../types.ts";
import { runDistanceTestCases, reportTestResult } from "./core.ts";
import { basicTests, variationTests, getGeneratedTests } from "./distance-cases.ts";

const fnVariants: { nameSuffix: string; options: DistanceOptions }[] = [
  { nameSuffix: "(noSwap)", options: { noSwap: true, withEditSequence: true } },
  { nameSuffix: "(noTrim)", options: { noTrim: true } },
  {
    nameSuffix: "(noSwap/noTrim)",
    options: { noSwap: true, noTrim: true, withEditSequence: true },
  },
];

type LibWithOptions = Lib & { options?: DistanceOptions };

const libs: LibWithOptions[] = [referenceTestSubject, mainTestSubject];
for (const variant of fnVariants) {
  const name = `${mainTestSubject.name} ${variant.nameSuffix}`;
  libs.push({ ...mainTestSubject, name, options: variant.options });
}

const seed = Date.now();
const iterations = 100;
const ms = new Array(5).fill(0).map((_, i) => 8 * 4 ** i);
const ns = new Array(5).fill(0).map((_, i) => 8 * 4 ** i);
const charsetClusters = [
  { min: 0x61, max: 0x62 }, // latin
  { min: 0x0621, max: 0x0622 }, // arabic
  { min: 0x0f21, max: 0x0f22 }, // tibetan
  { min: 0x1f601, max: 0x1f602, weight: 0.1 }, // emoji
  { sequence: ["👁️‍🗨️", "👨🏼‍🦱", "👩🏾‍💻"], weight: 0.1 }, // emoji ZWJ sequence
];
const generatedTests = getGeneratedTests(Math.sqrt(iterations), ms, ns, charsetClusters, seed);

console.log("\n" + "=".repeat(80));
console.log(`generated ${iterations * ms.length * ns.length} test case`);
console.log("=".repeat(80) + "\n");

export function run() {
  let total = 0;
  let failed = 0;
  for (const lib of libs) {
    const opts = lib.name.startsWith(mainTestSubject.name)
      ? { ...lib.options, cutoff: 1 }
      : undefined;
    const basicTestsSummary = runDistanceTestCases(lib, basicTests, opts);
    total += basicTestsSummary.totalTestCases;
    failed += basicTestsSummary.problems.length;
    reportTestResult(basicTestsSummary);

    const variationTestsSummary = runDistanceTestCases(lib, variationTests, lib.options);
    total += variationTestsSummary.totalTestCases;
    failed += variationTestsSummary.problems.length;
    reportTestResult(variationTestsSummary, { skipFnName: true });
  }

  for (const lib of libs) {
    if (lib === referenceTestSubject) continue;
    const generatedTestsSummary = runDistanceTestCases(lib, generatedTests);
    total += generatedTestsSummary.totalTestCases;
    failed += generatedTestsSummary.problems.length;
    reportTestResult(generatedTestsSummary);
  }

  console.log("\n" + "=".repeat(80));
  console.log({ seed });
  console.log("=".repeat(80) + "\n");

  return { total, failed };
}
