import {
  WORD_WIDTH,
  WORD_WIDTH_SHIFT,
  WORD_MASK,
  DIRECT_LOOKUP_LIMIT,
  preparedPattern,
  preparePattern,
  zeroPreparedPattern,
} from "./pattern.ts";
import * as Util from "./util.ts";

const alphabetSize = 0x110000;
const peq = new Uint32Array(alphabetSize);

const EMPTY_U32 = new Uint32Array(0);
let previousWordPattern: Uint32Array = EMPTY_U32;
let previousPattern: Uint32Array = EMPTY_U32;

let mat: number[][] = [];

type AlgOptions = { cutoff?: number; withEditSequence?: boolean };
type InternalAlgOptions = AlgOptions & { debug?: boolean };
type AlgResult = { distance: number; edits?: Uint32Array };

function algWord(text: Uint32Array, options?: AlgOptions): AlgResult {
  const internalOptions = options as InternalAlgOptions | undefined;
  let j = 0; // for debug and edits only
  const m = previousWordPattern.length;
  const hMask = 1 << (m - 1);
  let vp = -1 | 0;
  let vm = 0 | 0;
  let eq_1 = 0 | 0;
  let tt = 0 | 0;
  let tit = 0 | 0;
  const result: AlgResult = { distance: m, edits: undefined };
  if (internalOptions?.debug) {
    mat[0] = [0];
    for (let i = 0; i < m; i++) {
      mat[i + 1] ??= [];
      mat[i + 1][0] = mat[i][0] + (vp & (1 << i) ? 1 : vm & (1 << i) ? -1 : 0);
    }
  }
  for (const textCharCodePoint of text) {
    const eq = peq[textCharCodePoint];
    const tdt = eq_1 & (((eq & ~tt) << 1) + (vp & ~(eq | eq_1)));
    tt = tdt | (tit & (eq << 1));
    const d0 = (((eq & vp) + vp) ^ vp) | eq | vm | tt;
    let hp = vm | ~(d0 | vp);
    const hm = vp & d0;
    tit = (eq & ~(tt << 1)) | (tit & (hp << 1));
    if ((hp & hMask) !== 0) result.distance++;
    else if ((hm & hMask) !== 0) result.distance--;
    const hpOld = hp;
    hp = (hp << 1) | 1;
    vp = (hm << 1) | ~(d0 | hp);
    vm = hp & d0;
    eq_1 = eq;
    if (options?.withEditSequence) {
      result.edits ??= new Uint32Array(text.length * 3);
      /**
       * 000 tit
       * 001 tdt
       * 010 s
       * 011 e
       * 1x0 i
       * 1x1 d
       */
      const baseIndex = j * 3;
      result.edits[baseIndex] = (~hpOld & (tdt | eq)) | vp;
      result.edits[baseIndex + 1] = ~tt | eq;
      result.edits[baseIndex + 2] = hpOld | vp;
    }
    if (internalOptions?.debug) {
      mat[0][j + 1] = j + 1;
      for (let i = 0; i < m; i++) {
        mat[i + 1][j + 1] = mat[i][j + 1] + (vp & (1 << i) ? 1 : vm & (1 << i) ? -1 : 0);
      }
    }
    j++;
  }
  return result;
}

function algX(text: Uint32Array, options?: AlgOptions): AlgResult {
  const internalOptions = options as InternalAlgOptions | undefined;
  const m = preparedPattern.length;
  const words = preparedPattern.words;
  const lastTableRow = words << WORD_WIDTH_SHIFT;
  let vCutoff = options?.cutoff ?? lastTableRow;
  let b = ((vCutoff - 1) >>> WORD_WIDTH_SHIFT) + 1;
  if (b > words) b = words;
  let isDistanceCalculated = b >= words - 1;
  let j = 0; // for debug and editSequence only
  const result: AlgResult = { distance: m, edits: undefined };
  const blockScore: Uint32Array = new Uint32Array(words);
  const vpBlocks: Uint32Array = new Uint32Array(words);
  const vmBlocks: Uint32Array = new Uint32Array(words);
  const eqBlocks: Uint32Array = new Uint32Array(words);
  const ttBlocks: Uint32Array = new Uint32Array(words);
  const titBlocks: Uint32Array = new Uint32Array(words);
  for (let r = 0; r < b; r++) {
    blockScore[r] = (r + 1) * WORD_WIDTH;
    vpBlocks[r] = -1;
  }
  const lastPatternBitMask = 1 << ((m - 1) & WORD_MASK);
  if (internalOptions?.debug) {
    mat[0] = new Array(text.length + 1).fill(0).map((_, j) => j);
    for (let i = 0; i < lastTableRow; i++) mat[i + 1] ??= [];
    for (let i = 0; i < m; i++) {
      const b = (i / WORD_WIDTH) | 0;
      mat[i + 1][0] = mat[i][0] + (vpBlocks[b] & (1 << i) ? 1 : vmBlocks[b] & (1 << i) ? -1 : 0);
    }
  }
  for (const textSymbol of text) {
    let hIn = 1;
    let ttCarry = 0;
    let tdtCarry = 0;
    let eqCarry = 0;

    let base = -1;
    if (textSymbol < DIRECT_LOOKUP_LIMIT) {
      base = textSymbol * words;
    } else {
      const shifted = textSymbol - preparedPattern.highBase;
      base =
        shifted >= 0 && shifted < preparedPattern.highCount
          ? preparedPattern.highStart + shifted * words
          : (preparedPattern.wideOffsets?.get(textSymbol) ?? -1);
    }

    let checkForLesserB = false;
    if (b < words && blockScore[b - 1] === vCutoff) {
      blockScore[b] = blockScore[b - 1] + WORD_WIDTH;
      vpBlocks[b] = -1;
      b++;
    } else if (options?.cutoff !== undefined) {
      checkForLesserB = true;
    }

    isDistanceCalculated &&= b === words;

    for (let r = 0; r < b; r++) {
      let vp = vpBlocks[r];
      let vm = vmBlocks[r];
      let eq_1 = eqBlocks[r];
      let tt = ttBlocks[r];
      let tit = titBlocks[r];

      const eq = base < 0 ? 0 : preparedPattern.masks[base + r];

      const tdtEq = eq & ~tt;
      const tdtEqSh = (tdtEq << 1) | tdtCarry;
      const tdtVP = vp & ~(eq | eq_1);
      let tdt = (tdtEqSh + tdtVP) | 0;
      tdtCarry = ((tdtEq | ((tdtEqSh & tdtVP) | ((tdtEqSh | tdtVP) & ~tdt))) >>> WORD_MASK) & 1;
      tdt &= eq_1;

      const titEligible = tit & ((eq << 1) | eqCarry);
      tt = tdt | titEligible;

      let eq_x = eq;
      if (hIn === -1) eq_x = eq | 1;
      const d0 = (((eq_x & vp) + vp) ^ vp) | eq_x | vm | tt;

      let hp = vm | ~(d0 | vp);
      let hm = vp & d0;

      if (isDistanceCalculated && r === words - 1) {
        if ((hp & lastPatternBitMask) !== 0) result.distance++;
        else if ((hm & lastPatternBitMask) !== 0) result.distance--;
      }
      let hOut = 0;
      if (hp >>> WORD_MASK !== 0) hOut = 1;
      else if (hm >>> WORD_MASK !== 0) hOut = -1;

      const hpOld = hp;

      hp = hp << 1;
      hm = hm << 1;
      if (hIn === 1) hp |= 1;
      else if (hIn === -1) hm |= 1;

      tit = (eq & ~((tt << 1) | ttCarry)) | (tit & hp);

      vp = hm | ~(d0 | hp);
      vm = hp & d0;

      vpBlocks[r] = vp;
      vmBlocks[r] = vm;
      blockScore[r] += hOut;
      eqBlocks[r] = eq;
      ttBlocks[r] = tt;
      titBlocks[r] = tit;
      eqCarry = eq >>> WORD_MASK;
      ttCarry = tt >>> WORD_MASK;
      hIn = hOut;

      if (options?.withEditSequence) {
        result.edits ??= new Uint32Array(words * text.length * 3);
        /**
         * 000 tit
         * 001 tdt
         * 010 s
         * 011 e
         * 1x0 i
         * 1x1 d
         */
        const baseIndex = (j * words + r) * 3;
        result.edits[baseIndex] = (~hpOld & (tdt | eq)) | vp;
        result.edits[baseIndex + 1] = ~tt | eq;
        result.edits[baseIndex + 2] = hpOld | vp;
      }

      if (internalOptions?.debug) {
        for (let i = 0; i < WORD_WIDTH; i++) {
          const row = r * WORD_WIDTH + i;
          mat[row + 1][j + 1] =
            mat[row][j + 1] + (vpBlocks[r] & (1 << i) ? 1 : vmBlocks[r] & (1 << i) ? -1 : 0);
        }
      }
    }

    if (checkForLesserB) {
      while (blockScore[b - 1] > vCutoff + WORD_WIDTH) b--;
    }
    j++;
  }

  if (!isDistanceCalculated) {
    result.distance = blockScore[b - 1];
    if (b === words) {
      for (let i = 0; i < lastTableRow - m; i++) {
        if (vpBlocks[b - 1] & (1 << (WORD_MASK - i))) result.distance--;
        else if (vmBlocks[b - 1] & (1 << (WORD_MASK - i))) result.distance++;
      }
    }
  }

  return result;
}

type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type BaseDistanceOptions = {
  noTrimEnd?: boolean;
  splitStr?: (str: string) => Uint32Array;
};
export type DistanceOptions = AlgOptions & BaseDistanceOptions;
type InternalDistanceOptions = InternalAlgOptions &
  BaseDistanceOptions & {
    noSwap?: boolean;
    noTrim?: boolean;
  };

type CompareResultNumeric = { distance: number; similarity: number };
export type CompareResultWithEditSequence = CompareResultNumeric & {
  editSequence: string;
};
export type CompareResult<O extends DistanceOptions> = O extends { withEditSequence: true }
  ? CompareResultWithEditSequence
  : CompareResultNumeric;

export function compare<O extends DistanceOptions>(
  patternStr: string,
  textStr: string,
  options?: O,
): CompareResult<O> {
  const internalOptions = options as InternalDistanceOptions | undefined;
  const splitStr = options?.splitStr ?? Util.toCodePoints;
  let pattern = splitStr(patternStr);

  // early return (same string & cutoff < 1)
  let ret: MakeOptional<CompareResultWithEditSequence, "editSequence"> = options?.withEditSequence
    ? { distance: 0, similarity: 1, editSequence: "" }
    : { distance: 0, similarity: 1 };
  if (patternStr === textStr) {
    if (options?.withEditSequence) ret.editSequence = "e".repeat(pattern.length);
    return ret as CompareResult<O>;
  }
  if (options?.cutoff !== undefined && options?.cutoff < 1) {
    ret.distance = options?.cutoff + 1;
    ret.similarity = 0;
    if (options?.withEditSequence) ret.editSequence = "";
    return ret as CompareResult<O>;
  }

  // swap
  let text = splitStr(textStr);
  let patternShorter = pattern.length <= text.length;
  if (!internalOptions?.noSwap && !options?.withEditSequence && !patternShorter) {
    [pattern, text] = [text, pattern];
    patternShorter = true;
  }

  // don't trim if pattern is cached
  let originalPatternSameAsPrevious = false;
  let calculate;
  if (pattern.length > WORD_WIDTH) {
    originalPatternSameAsPrevious = Util.compareArrayElements(pattern, previousPattern);
    calculate = algX;
  } else {
    originalPatternSameAsPrevious = Util.compareArrayElements(pattern, previousWordPattern);
    calculate = algWord;
  }

  // trim
  let trimmed = false;
  let prefixLen = 0;
  let suffixLen = 0;
  if (!internalOptions?.noTrim && !originalPatternSameAsPrevious) {
    const shorterString = patternShorter ? pattern.length : text.length;

    prefixLen = Util.commonPrefix(pattern, text, shorterString);
    if (!options?.noTrimEnd) {
      suffixLen = Util.commonSuffix(pattern, text, shorterString - prefixLen);
    }
    pattern = pattern.subarray(prefixLen, pattern.length - suffixLen);
    text = text.subarray(prefixLen, text.length - suffixLen);

    // return if trimmed string's length became zero
    if (pattern.length === 0 || text.length === 0) {
      ret.distance = pattern.length + text.length;
      ret.similarity = 1 - ret.distance / (ret.distance + prefixLen + suffixLen);
      if (options?.withEditSequence) {
        ret.editSequence =
          "e".repeat(prefixLen) +
          (pattern.length === 0 ? "i" : "d").repeat(ret.distance) +
          "e".repeat(suffixLen);
      }
      if (options?.cutoff !== undefined && ret.distance > options?.cutoff) {
        ret.distance = options.cutoff + 1;
        ret.similarity = 0;
        if (options?.withEditSequence) ret.editSequence = "";
      }
      return ret as CompareResult<O>;
    }

    if (prefixLen > 0 || suffixLen > 0) trimmed = true;
  }

  // prepare pattern
  if (trimmed || !originalPatternSameAsPrevious) {
    if (pattern.length > WORD_WIDTH) {
      if (!trimmed || !Util.compareArrayElements(pattern, previousPattern)) {
        if (previousPattern.length !== 0) zeroPreparedPattern(previousPattern);
        preparePattern(pattern);
        previousPattern = pattern;
      }
      calculate = algX;
    } else {
      if (!trimmed || !Util.compareArrayElements(pattern, previousWordPattern)) {
        if (previousWordPattern.length !== 0) for (const cp of previousWordPattern) peq[cp] = 0;
        for (const [i, cp] of pattern.entries()) peq[cp] |= 1 << i;
        previousWordPattern = pattern;
      }
      calculate = algWord;
    }
  }

  // calculate
  const { distance, edits } = calculate(text, options);
  //if (internalOptions?.debug) console.log(toString(pattern, text, mat));

  // check cutoff
  if (options?.cutoff !== undefined && distance > options?.cutoff) {
    ret.distance = options.cutoff! + 1;
    ret.similarity = 0;
    if (options?.withEditSequence) ret.editSequence = "";
  } else {
    ret.distance = distance;
    ret.similarity =
      1 - ret.distance / ((patternShorter ? text.length : pattern.length) + prefixLen + suffixLen);

    // create edit sequence if requested
    if (options?.withEditSequence) {
      ret.editSequence =
        "e".repeat(prefixLen) +
        createEditSequenceFromEdits(pattern, text, edits!) +
        "e".repeat(suffixLen);
    }
  }

  return ret as CompareResult<O>;
}

type ClosestResult<O extends DistanceOptions> = O extends { cutoff: number }
  ? CompareResult<O> & { text: string | null; index: number }
  : CompareResult<O> & { text: string; index: number };

export function closest<O extends DistanceOptions>(
  pattern: string,
  list: string[],
  options?: O,
): ClosestResult<O> {
  let text: string | null = null;
  let index: number = -1;
  let cutoff = options?.cutoff ?? Infinity;
  let minResult: CompareResultNumeric | CompareResultWithEditSequence = {
    distance: cutoff + 1,
    similarity: 0,
  };
  for (const [i, candidate] of list.entries()) {
    const result = compare(pattern, candidate, { ...options, noSwap: true, cutoff });
    if (result.distance <= cutoff) {
      minResult = result;
      text = candidate;
      index = i;
      cutoff = result.distance - 1;
    }
  }
  return { ...minResult, text, index } as ClosestResult<O>;
}

function createEditSequenceFromEdits(
  pattern: Uint32Array,
  text: Uint32Array,
  edits: Uint32Array,
): string {
  const sequence = [];
  /**
   * 000 tit
   * 001 tdt
   * 010 s
   * 011 e
   * 1x0 i
   * 1x1 d
   */
  const words = pattern.length > WORD_WIDTH ? preparedPattern.words : 1;
  let i = (pattern.length - 1) & WORD_MASK;
  let j = text.length - 1;
  let r = words - 1;
  const decrementI = () => {
    if (--i < 0) {
      i = 31;
      r--;
    }
  };
  let push = true;
  while (r >= 0 && j >= 0) {
    let baseIndex = (j * words + r) * 3;
    let a = edits[baseIndex];
    let b = edits[baseIndex + 1];
    let c = edits[baseIndex + 2];
    if (((c >> i) & 1) !== 0) {
      if (((a >> i) & 1) !== 0) {
        if (push) sequence.push("d");
        decrementI();
      } else {
        if (push) sequence.push("i");
        j--;
      }
      if (!push) push = true;
    } else {
      if (((b >> i) & 1) !== 0) {
        if (((a >> i) & 1) !== 0 && push) sequence.push("e");
        else if (push) sequence.push("s");
        decrementI();
        j--;
        if (!push) push = true;
      } else {
        if (((a >> i) & 1) !== 0) {
          sequence.push("T");
          decrementI();
          const textChar = text[j];
          while (pattern[r * WORD_WIDTH + i] !== textChar) {
            sequence.push("d");
            decrementI();
          }
          j--;
          sequence.push("t");
        } else {
          sequence.push("T");
          j--;
          const patternChar = pattern[r * WORD_WIDTH + i];
          while (patternChar !== text[j]) {
            sequence.push("i");
            j--;
          }
          decrementI();
          sequence.push("t");
        }
        push = false;
      }
    }
  }
  while (j-- > -1) sequence.push("i");
  while (r > -1) {
    sequence.push("d");
    decrementI();
  }

  return sequence.reverse().join("");
}
