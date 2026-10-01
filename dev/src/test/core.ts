import { referenceTestSubject } from "../main-libs.ts";
import { pad, countOccurrences } from "../utils.ts";
import type {
  DistanceOptions,
  CompareResultWithEditSequence,
  CompareResult,
  Fn,
  Lib,
  SimpleDistanceFn,
  DistanceTestCase,
  DistanceTests,
  Problem,
  TestRunSummary,
} from "../types";

const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
//const magenta = "\x1b[35m";
//const cyan = "\x1b[36m";
//const white = "\x1b[37m";
const reset = "\x1b[0m";

function isObjectWithEditSequence(
  result: CompareResult<any> | number,
): result is CompareResultWithEditSequence {
  return typeof result === "object" && "editSequence" in result && result.editSequence.length > 0;
}

function editString(
  s1: string,
  s2: string,
  editSequence: string,
  splitStr?: (str: string) => number[],
): string {
  let firstTranspose = null;
  let i = 0,
    j = 0;
  const splitFn = splitStr !== undefined ? splitStr : (str: string) => [...str];
  let editedS1Arr = splitFn(s1);
  let s2Arr = splitFn(s2);
  for (let k = 0; k < editSequence.length; k++) {
    const edit = editSequence[k];
    if (edit === "e") {
      i++;
      j++;
    } else if (edit === "s") editedS1Arr[i++] = s2Arr[j++];
    else if (edit === "d") editedS1Arr.splice(i, 1);
    else if (edit === "i") editedS1Arr.splice(i++, 0, s2Arr[j++].toString());
    else if (edit === "t") {
      if (firstTranspose === null) {
        firstTranspose = i;
        i++;
        j++;
      } else {
        const firstSymbol = editedS1Arr[firstTranspose];
        editedS1Arr[firstTranspose] = editedS1Arr[i];
        editedS1Arr[i] = firstSymbol;
        i++;
        j++;
        firstTranspose = null;
      }
    }
  }
  const isNumberArray = (value: unknown): value is number[] =>
    Array.isArray(value) && typeof value[0] === "number";
  if (isNumberArray(editedS1Arr)) {
    return String.fromCodePoint(...editedS1Arr);
  } else {
    return editedS1Arr.join("");
  }
}

function runDistanceTestCase(
  lib: Lib,
  testCase: DistanceTestCase,
  options?: DistanceOptions,
): true | Problem<SimpleDistanceFn>[] {
  // get expected result
  let expectedDistance = null;
  const errorMsgPrefix = `Test case is of type VariationTestCase, but ${lib.name}`;
  if (!("expected" in testCase)) {
    // expected does not exit in testCase (DistanceGeneratedTestCase)
    expectedDistance = referenceTestSubject.fn(...testCase.args);
  } else if (typeof testCase.expected === "number") {
    // testCase.expected is a number (DistanceRegularTestCase)
    expectedDistance = testCase.expected;
  } else if (lib.variation) {
    // testCase.expected is an object (DistanceVariationTestCase) and lib.variation is a string
    expectedDistance = testCase.expected[lib.variation];
    if (!expectedDistance) {
      const errorMsg =
        `${errorMsgPrefix} has a ${lib.variation} variation,` +
        " which is not one of the expected variations of the test case.";
      throw Error(errorMsg);
    }
  } else {
    // testCase.expected is an object (DistanceVariationTestCase),
    // but lib.variation is null or undefined
    throw Error(errorMsgPrefix + " doesn't have a variation.");
  }

  const cutoffs = [
    undefined,
    expectedDistance,
    expectedDistance + 1,
    expectedDistance * 2,
    expectedDistance - 1,
    expectedDistance - 2,
    (expectedDistance / 2) | 0,
  ];
  let count = options?.cutoff !== undefined ? cutoffs.length : 1;

  const problems: Problem<SimpleDistanceFn>[] = [];
  for (let i = 0; i < count; i++) {
    const cutoff = cutoffs[i];

    let opts: DistanceOptions | undefined = options ? { ...options, cutoff } : undefined;
    let _c: number | undefined;
    if (cutoff === undefined && opts?.cutoff !== undefined) {
      ({ cutoff: _c, ...opts } = opts);
    }

    // get measured result
    const measured = lib.fn(...testCase.args, opts);
    const measuredDistance = typeof measured === "number" ? measured : measured.distance;
    const reflectedArgs = [...testCase.args].reverse() as typeof testCase.args;
    const measuredReflected = lib.fn(...reflectedArgs, opts);
    const measuredReflectedDistance =
      typeof measuredReflected === "number" ? measuredReflected : measuredReflected.distance;
    const measuredSimilarity = typeof measured === "object" ? measured.similarity : undefined;
    const splitFn = options?.splitStr ?? ((str: string) => [...str]);
    let expectedSimilarity =
      typeof measured === "object"
        ? 1 - measuredDistance / Math.max(...testCase.args.map((s) => splitFn(s).length))
        : undefined;
    let measuredSequenceResult: string | undefined;
    let expectedSequenceResult: string | undefined;
    let measuredReflectedSequenceResult: string | undefined;
    let expectedReflectedSequenceResult: string | undefined;
    if (options?.withEditSequence) {
      if (isObjectWithEditSequence(measured)) {
        measuredSequenceResult = editString(
          ...testCase.args,
          measured.editSequence,
          options?.splitStr,
        );
        expectedSequenceResult = testCase.args[1];
      }
      if (isObjectWithEditSequence(measuredReflected)) {
        measuredReflectedSequenceResult = editString(
          ...reflectedArgs,
          measuredReflected.editSequence,
        );
        expectedReflectedSequenceResult = reflectedArgs[1];
      }
    }

    // override expectedDistance based on cutoff
    let expectedDistanceOverride = expectedDistance;
    if (
      options?.cutoff !== undefined &&
      cutoff !== undefined &&
      i >= 4 &&
      !(i === cutoffs.length - 1 && expectedDistance === 0)
    ) {
      expectedDistanceOverride = cutoff + 1;
      expectedSimilarity = 0;
      if (options?.withEditSequence) {
        expectedSequenceResult = testCase.args[0];
        expectedReflectedSequenceResult = reflectedArgs[0];
      }
    }

    // compare measured with expected
    if (measuredDistance !== expectedDistanceOverride) {
      problems.push({
        args: testCase.args,
        options: opts,
        expected: expectedDistanceOverride,
        measured: measuredDistance,
      });
    }
    if (measuredSimilarity !== expectedSimilarity) {
      problems.push({
        args: testCase.args,
        options: opts,
        expected: `a similarity of ${expectedSimilarity}`,
        measured: `a similarity of ${measuredSimilarity}`,
      });
    }
    if (measuredDistance !== measuredReflectedDistance) {
      problems.push({
        args: testCase.args,
        options: opts,
        expected: "symmetric distance",
        measured: "non-symmetric distance",
      });
    }
    if (options?.withEditSequence) {
      const directions = [];
      directions.push({
        args: testCase.args,
        options: opts,
        measured,
        measuredSequenceResult,
        expectedSequenceResult,
      });
      directions.push({
        args: reflectedArgs,
        options: opts,
        measured: measuredReflected,
        measuredSequenceResult: measuredReflectedSequenceResult,
        expectedSequenceResult: expectedReflectedSequenceResult,
      });
      for (const dir of directions) {
        if (isObjectWithEditSequence(dir.measured)) {
          if (dir.measuredSequenceResult !== dir.expectedSequenceResult) {
            problems.push({
              args: dir.args,
              options: opts,
              expected: "an edit sequence that converts `s1` to `s2`",
              measured: `an edit sequence "${dir.measured.editSequence}" that converted \`s1\` to "${dir.measuredSequenceResult}"`,
            });
          }
          if (dir.measured.editSequence !== "") {
            const transpositionsCount = countOccurrences(dir.measured.editSequence, "t");
            if (transpositionsCount % 2 !== 0) {
              problems.push({
                args: dir.args,
                options: opts,
                expected: `an edit sequence that has an even transposition count`,
                measured: `transposition count of ${transpositionsCount}`,
              });
            }
            const editSequenceDistance =
              dir.measured.editSequence.length -
              countOccurrences(dir.measured.editSequence, "e") -
              transpositionsCount / 2;
            if (dir.measured.distance !== editSequenceDistance) {
              problems.push({
                args: dir.args,
                options: opts,
                expected: `an edit sequence that has a distance of ${dir.measured.distance}`,
                measured: `an edit sequence ${dir.measured.editSequence} that has a distance of ${editSequenceDistance}`,
              });
            }
          }
        }
      }
    }
  }

  if (problems.length === 0) return true;
  else return problems;
}

export function runDistanceTestCases(
  lib: Lib,
  tests: DistanceTests,
  options?: DistanceOptions,
): TestRunSummary<SimpleDistanceFn> {
  const problems: Problem<SimpleDistanceFn>[] = [];
  let passedTests = 0;

  const evaluateResult = (result: ReturnType<typeof runDistanceTestCase>) => {
    if (result === true) passedTests++;
    else problems.push(...result);
  };

  if ("pack" in tests) {
    for (const s1 of tests.pack.s1) {
      for (const s2 of tests.pack.s2) {
        evaluateResult(runDistanceTestCase(lib, { args: [s1, s2] }, options));
      }
    }
  } else {
    for (const testCase of tests.cases) {
      evaluateResult(runDistanceTestCase(lib, testCase, options));
    }
  }

  return {
    fnName: lib.name,
    testCasesLabel: tests.label,
    totalTestCases: passedTests + problems.length,
    problems,
  };
}

export function reportTestResult<T extends Fn>(
  summary: TestRunSummary<T>,
  options?: { skipPassed?: boolean; skipFnName?: boolean },
): boolean {
  const failedCasesCount = summary.problems.length;
  const allPassed = failedCasesCount < 1;

  if (options?.skipPassed && allPassed) return true;

  if (!options?.skipFnName) {
    console.log(`${pad(summary.fnName, 80, "=", yellow)}`);
  }
  let indent = "\t";

  if (summary.testCasesLabel) {
    console.log(`${indent}${blue}${summary.testCasesLabel}:${reset}`);
    indent += "\t";
  }

  if (allPassed) {
    console.log(
      `${indent}${green}All Tests Passed: [${summary.totalTestCases}/${summary.totalTestCases}]${reset}`,
    );
  } else {
    const passedCasesCount = summary.totalTestCases - failedCasesCount;

    console.log(
      `${indent}${red}${failedCasesCount} tests failed${reset} | ${green}${passedCasesCount} tests passed${reset}`,
    );
    console.log(`${indent}${red}Failed Tests:${reset}`);
    indent += "\t";

    summary.problems.forEach((p, i) => {
      let reportString = `${indent}${i + 1}. (${JSON.stringify(p.args).slice(1, -1)}${Object.keys(p.options ?? {}).length ? ", " + JSON.stringify(p.options) : ""}):`;
      if (p.reports?.length) {
        const tempIndent = "\t" + indent;
        reportString += `\n${tempIndent}- ` + p.reports.join(`\n${tempIndent}- `);
      } else {
        reportString += ` ${green}should return ${p.expected instanceof Set ? "{" + [...p.expected].sort((a, b) => a - b) + "}" : p.expected}.${reset}`;
        reportString += ` ${red}Got ${p.measured instanceof Set ? "{" + [...p.measured].sort((a, b) => a - b) + "}" : p.measured}.${reset}`;
      }
      console.log(reportString);
    });
  }
  return allPassed;
}
