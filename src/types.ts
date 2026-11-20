export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type AlgOptions = { cutoff?: number; withEditSequence?: boolean };
export type InternalAlgOptions = AlgOptions & { debug?: boolean };
export type AlgResult = { distance: number; edits?: Uint32Array };

type BaseDistanceOptions = {
  noTrimEnd?: boolean;
  splitStr?: (str: string) => Uint32Array;
};
export type DistanceOptions = AlgOptions & BaseDistanceOptions;
export type InternalDistanceOptions = InternalAlgOptions &
  BaseDistanceOptions & {
    noSwap?: boolean;
    noTrim?: boolean;
  };

export type GetDistanceResult = AlgResult & {
  pattern: Uint32Array;
  text: Uint32Array;
  prefixLen: number;
  suffixLen: number;
};

type CompareResultNumeric = { distance: number; similarity: number };
export type CompareResultWithEditSequence = CompareResultNumeric & {
  editSequence: string;
};
export type CompareResult<O extends DistanceOptions> = O extends { withEditSequence: true }
  ? CompareResultWithEditSequence
  : CompareResultNumeric;

export type ClosestResult<O extends DistanceOptions> = O extends { cutoff: number }
  ? CompareResult<O> & { text: string | null; index: number }
  : CompareResult<O> & { text: string; index: number };
