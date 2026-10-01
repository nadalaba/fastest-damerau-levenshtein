import { reportTestResult } from "./core.ts";
import {
  countOccurrences,
  getRandomIntegerInRangeInclusive,
  getRandomString,
  splitmix32,
} from "../utils.ts";
import type { TestCase, Table, Problem } from "../types";

const rnd = splitmix32(Date.now());

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";

const randomIntcases: TestCase<typeof getRandomIntegerInRangeInclusive>[] = [
  { args: [{ possibleIntsCount: 2 }], expected: new Set([0, 1]) }, // default min is 0
  { args: [{}], expected: new Set([0]) }, // default min is 0, default possibleIntsCount is 1
  { args: [{ max: 10, possibleIntsCount: 2 }], expected: new Set([0, 1]) }, // possibleIntsCount overrides max
  { args: [{ min: 5, max: 8 }], expected: new Set([5, 6, 7, 8]) }, // min and max are included
  { args: [{ min: 8, max: 5 }], expected: new Set([5, 6, 7, 8]) }, // if max < min, they're swapped
  { args: [{ min: 3.2, max: 5.9 }], expected: new Set([4, 5]) }, // min is ceilinged, max is floored
  { args: [{ min: 5.9, max: 3.2 }], expected: new Set([4, 5]) }, // swap (if needed) happens before flooring/ceilinging
  { args: [{ min: -5.9, max: -3.2 }], expected: new Set([-5, -4]) }, // flooring/ceilinging is mathematical (floor moves to smaller numbers / ceiling moves to larger numbers)
  { args: [{ min: 1.6, possibleIntsCount: 2.5 }], expected: new Set([2, 3]) }, // possibleIntsCount is floored
  { args: [{ min: 2, possibleIntsCount: -1 }], expected: new Set([2]) }, // if possibleIntsCount < 1, it falls back to 1 if there is no max
  {
    args: [{ min: 2, possibleIntsCount: -1, max: 5 }],
    expected: new Set([2, 3, 4, 5]),
  }, // if possibleIntsCount < 1, it is considered undefined if max is defined, and calculated from max
];

const randomstringCases: TestCase<typeof getRandomString>[] = [
  {
    args: [10000, [{ min: 0x61, max: 0x6f }]],
    expected: new Map([[new Set("abcdefghijklmno".split("")), 0.0667]]),
  },
  {
    args: [
      10000,
      [
        { min: 0x61, max: 0x65 },
        { min: 0x0627, max: 0x0629, weight: 3 },
      ],
    ],
    expected: new Map([
      [new Set("abcde".split("")), 0.05],
      [new Set("ابة".split("")), 0.25],
    ]),
  },
  {
    args: [
      10000,
      [
        { min: 0x61, max: 0x67, weight: 5 },
        { min: 0x0627, max: 0x0629, weight: 3 },
        { min: 0xabc1, max: 0xabc3, weight: 4 },
      ],
    ],
    expected: new Map([
      [new Set("abcdefg".split("")), 0.0595],
      [new Set("ابة".split("")), 0.0833],
      [new Set("ꯁꯂꯃ".split("")), 0.1111],
    ]),
  },
  {
    args: [
      10000,
      [
        { min: 0x61, max: 0x67, weight: 5 },
        { min: 0x0627, max: 0x0629, weight: 3 },
        { min: 0xabc1, max: 0xabc3, weight: 4 },
        { min: 0x1f601, max: 0x1f603 },
      ],
    ],
    expected: new Map([
      [new Set("abcdefg".split("")), 0.0549],
      [new Set("ابة".split("")), 0.0769],
      [new Set("ꯁꯂꯃ".split("")), 0.1026],
      [new Set("😁😂😃"), 0.0256],
    ]),
  },
  {
    args: [
      10000,
      [
        { min: 0x61, max: 0x66, weight: 5 },
        { min: 0x0627, max: 0x0629, weight: 3 },
        { min: 0xabc1, max: 0xabc3, weight: 4 },
        { min: 0x1f601, max: 0x1f603 },
        { sequence: ["👁️‍🗨️", "👨🏼‍🦱", "👩🏾‍💻"], weight: 0.5 },
      ],
    ],
    expected: new Map([
      [new Set("abcdef".split("")), 0.0617],
      [new Set("ابة".split("")), 0.0741],
      [new Set("ꯁꯂꯃ".split("")), 0.0988],
      [new Set("😁😂😃"), 0.0247],
      [new Set(["👁️‍🗨️", "👨🏼‍🦱", "👩🏾‍💻"]), 0.0123],
    ]),
  },
];

export function run() {
  let total = 0;
  let failed = 0;

  // getRandomIntegerInRangeInclusive
  const iterations = 10000;
  const randIntproblems: Problem<typeof getRandomIntegerInRangeInclusive>[] = [];
  for (const { args, expected } of randomIntcases) {
    if (!args[0].rnd) args[0].rnd = rnd;
    const measured = new Set<number>();
    for (let i = 0; i < iterations; i++) {
      measured.add(getRandomIntegerInRangeInclusive(...args));
    }
    if (expected instanceof Set && !AreSetsEqual(measured, expected)) {
      randIntproblems.push({ args, measured, expected });
    }
  }

  total += randomIntcases.length;
  failed += randIntproblems.length;

  reportTestResult({
    fnName: "getRandomIntegerInRangeInclusive",
    totalTestCases: randomIntcases.length,
    problems: randIntproblems,
  });

  // getRandomString
  const randomStringProblems: Problem<typeof getRandomString>[] = [];
  for (const { args, expected } of randomstringCases) {
    if (args.length < 2) args.push(undefined);
    if (args.length < 3) args.push(rnd);
    const str = getRandomString(...args);
    if ([...str].length > args[0]) {
      randomStringProblems.push({
        args,
        expected: `string length less than or equal to ${args[0]}`,
        measured: `a longer string(${[...str].length})`,
      });
    }
    if (expected instanceof Map) {
      const miniProblems = getStringConformancyWithTable(str, expected);
      let reports: string[] = [];
      if (miniProblems.length > 0) {
        for (const { symbol, expected, measured } of miniProblems) {
          reports.push(
            `Symbol ${symbol} is expected to occurr around ${green}${expected}${reset} times. It occurred ${red}${measured}${reset} times.`,
          );
        }
        randomStringProblems.push({
          args,
          reports,
          expected: JSON.stringify(expected),
          measured: str,
        });
      }
    }
  }

  total += randomstringCases.length;
  failed += randomStringProblems.length;

  reportTestResult({
    fnName: "getRandomString",
    totalTestCases: randomstringCases.length,
    problems: randomStringProblems,
  });

  return { total, failed };
}

function AreSetsEqual<T>(s1: Set<T>, s2: Set<T>): boolean {
  if (s1.size !== s2.size) return false;
  for (const value of s1.values()) if (!s2.has(value)) return false;
  return true;
}

type MiniProblem = { symbol: string; expected: number; measured: number };

function getStringConformancyWithTable(str: string, table: Table<string>): MiniProblem[] {
  let allSymbols = new Set<string>();
  for (const key of table.keys()) allSymbols = new Set([...allSymbols, ...key]);

  let strLen = 0;
  const miniProblems: { symbol: string; expected: number; measured: number }[] = [];
  for (const symbol of [...allSymbols].sort((a, b) => [...b].length - [...a].length)) {
    const measured = countOccurrences(str, symbol);
    strLen += measured;
    str = str.replaceAll(symbol, "");
    let expected = 0;
    for (const [key, prob] of table.entries()) {
      if (key.has(symbol)) expected = prob;
    }
    miniProblems.push({ symbol, expected, measured });
  }
  const remainingStrArray = [...str];
  const remainingStrLength = remainingStrArray.length;
  if (remainingStrLength > 0) {
    strLen += remainingStrLength;
    const remaining = new Set<string>(remainingStrArray);
    for (const symbol of remaining) {
      miniProblems.push({
        symbol,
        expected: 0,
        measured: countOccurrences(str, symbol),
      });
    }
  }
  miniProblems.forEach((mp) => (mp.expected *= strLen));
  return miniProblems.filter((mp) => Math.abs(mp.measured - mp.expected) > 0.015 * strLen);
}
