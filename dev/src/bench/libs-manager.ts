import { libs } from "./libraries.ts";
import { mainTestSubject, referenceTestSubject } from "../main-libs.ts";
import { basicTests, variationTests } from "../test/distance-cases.ts";
import { runDistanceTestCases, reportTestResult } from "../test/core.ts";
import type { Lib, DistanceVariationTestCase } from "../types";

function setLibVariation(lib: Lib, firstCase: DistanceVariationTestCase): Lib {
  let typedLib: Lib | null = null;

  const measured = lib.fn(...firstCase.args);
  const measuredDistance = typeof measured === "number" ? measured : measured.distance;
  for (const key in firstCase.expected) {
    if (measuredDistance === firstCase.expected[key]) {
      typedLib = { ...lib, variation: key };
    }
  }

  if (typedLib === null) typedLib = { ...lib, variation: null };
  return typedLib;
}

function prepareLibs(): Lib[] {
  libs.unshift(mainTestSubject, referenceTestSubject);
  for (const [i, lib] of libs.entries()) {
    libs[i] = setLibVariation(lib, variationTests.cases[0]);

    if (libs[i].variation === null) {
      throw Error(
        `Could not set variation for lib ${lib.name}.\nActual measured` +
          " calculation does not match any of the expected variations.",
      );
    }

    if (libs[i].variation === "unrestricted") {
      libs[i].name += libs[i].variation ? ` \x1b[35m(${libs[i].variation})\x1b[0m` : "";
    }
    reportTestResult(runDistanceTestCases(libs[i], basicTests), {
      skipPassed: true,
    });
    reportTestResult(runDistanceTestCases(libs[i], variationTests), {
      skipPassed: true,
      skipFnName: true,
    });
  }
  return libs;
}

export const preparedLibs = prepareLibs();
