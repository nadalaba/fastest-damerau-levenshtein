import * as lowrance_wagner from "./lowrance-wagner.ts";
import { compare } from "fastest-damerau-levenshtein";
import type { DistanceOptions, FullDistanceFn, Lib } from "./types";
// const opts = { noSwap: true, noTrim: true };
const opts = {};

export const referenceTestSubject = {
  name: "lowrance-wagner",
  fn: lowrance_wagner.distance,
  variation: "unrestricted",
};

export const mainTestSubject: Lib = {
  name: "fastest-damerau-levenshtein",
  fn: ((s1: string, s2: string, options?: DistanceOptions) =>
    compare(s1, s2, { ...options, ...opts })) as FullDistanceFn,
  variation: "unrestricted",
};
