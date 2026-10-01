import { distance } from "./lowrance-wagner.ts";
import { compare, DistanceOptions } from "fastest-damerau-levenshtein";
export type {
  DistanceOptions,
  CompareResultWithEditSequence,
  CompareResult,
} from "fastest-damerau-levenshtein";

export type SimpleDistanceFn = typeof distance;
export type FullDistanceFn = typeof compare;
type DistanceFn = SimpleDistanceFn | FullDistanceFn;

export type Lib = {
  name: string;
  fn: DistanceFn;
  variation?: string | null;
};

export type Fn = (...args: any) => any;

export type DistanceRegularTestCase = {
  args: Parameters<SimpleDistanceFn>;
  expected: ReturnType<SimpleDistanceFn>;
};
export type DistanceRegularTests = {
  cases: DistanceRegularTestCase[];
  label: string;
};
export type DistanceVariationTestCase = {
  args: Parameters<SimpleDistanceFn>;
  expected: Partial<Record<string, ReturnType<SimpleDistanceFn>>>;
};
export type DistanceVariationTests = {
  cases: DistanceVariationTestCase[];
  label: string;
};
export type DistanceGeneratedTestCase = { args: Parameters<SimpleDistanceFn> };
export type DistanceGeneratedTestPack = {
  s1: Parameters<SimpleDistanceFn>[0][];
  s2: Parameters<SimpleDistanceFn>[1][];
};

export type DistanceGeneratedTests = {
  pack: DistanceGeneratedTestPack;
  label: string;
};
export type DistanceTestCase =
  | DistanceRegularTestCase
  | DistanceVariationTestCase
  | DistanceGeneratedTestCase;
export type DistanceTests = DistanceRegularTests | DistanceVariationTests | DistanceGeneratedTests;

export type TestCase<T extends Fn> = {
  args: Parameters<T>;
  expected: ReturnType<T> | Set<ReturnType<T>> | Table<ReturnType<T>>;
};

export type Table<T> = Map<Set<T>, number>;
export type Problem<T extends Fn> = {
  args: Parameters<T>;
  options?: DistanceOptions;
  measured: ReturnType<T> | Set<ReturnType<T>> | string;
  expected: ReturnType<T> | Set<ReturnType<T>> | string;
  reports?: string[];
};
export type TestRunSummary<T extends Fn> = {
  fnName: string;
  testCasesLabel?: string;
  totalTestCases: number;
  problems: Problem<T>[];
};
