declare module "damerau-levenshtein-js" {
  export function distance(s1: string, s2: string): number;
  function distanceProm(s1: string, s2: string): Promise<number>;
  function minDistanceProm(s1: string, list: string[]): Promise<number>;
}

declare module "@alordash/damerau-levenshtein" {
  export class DamerauLevenshtein {
    constructor(str1: string, str2: string);
    set strings(strings: [string, string]);
    get matrix(): number[][];
    distance: number;
    valueOf(): number;
    toString(): string;
    calculate(): void;
    Matrix(i: number, j: number): number;
    D(i: number, j: number): number;
  }

  export function distance(str1: string, str2: string): number;

  export function closest(
    original_string: string,
    target_strings: string[],
  ): {
    closest_string: string;
    distance: number;
  };
}

declare module "levenshtein-damerau" {
  export default function ld(
    src: string,
    tgt: string,
    debug?: boolean | ((score: number[][]) => void),
  ): number;
}

declare module "@mukundakatta/lev-mcp" {
  export function levenshtein(a: string, b: string): number;
  export function damerauLevenshtein(a: string, b: string): number;
  export function jaro(a: string, b: string): number;
  export function jaroWinkler(a: string, b: string, p?: number): number;
  export function similarity(a: string, b: string): number;
  export function allMetrics(
    a: string,
    b: string,
  ): {
    a: string;
    b: string;
    levenshtein: number;
    damerau_levenshtein: number;
    jaro: number;
    jaro_winkler: number;
    similarity: number;
  };
}

declare module "@a-s8h/liblevenshtein" {
  export function distance(
    algorithm?: "standard" | "transposition" | "merge_and_split",
  ): (v: string, w: string) => number;
}

declare module "string-comparisons" {
  export class DamerauLevenshtein {
    static distance(str1: string, str2: string): number;
    static similarity(str1: string, str2: string): number;
  }
}

declare module "markov-namegen-js" {
  export function damerauLevenshteinDistance(a: string, b: string): number;

  export function sortBySimilarity(
    targetName: string,
    names: string[],
    ascending?: boolean,
  ): { name: string; distance: number }[];
}
