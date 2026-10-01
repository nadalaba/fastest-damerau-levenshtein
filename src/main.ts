import {
  WORD_WIDTH,
  WORD_WIDTH_SHIFT,
  WORD_MASK,
  DIRECT_LOOKUP_LIMIT,
  preparedPattern,
  preparePattern,
  zeroPreparedPattern,
} from "./pattern.ts";
import { toString } from "./utils.ts";
export { toString } from "./utils.ts";

let mat: number[][] = [];

const alphabetSize = 0x110000;
const peq = new Uint32Array(alphabetSize);
let previousWordPattern: number[] = [];
let previousPattern: number[] | string[] = [];

type AlgOptions = { debug?: boolean; cutoff?: number; withEditSequence?: boolean };
type AlgResult = { distance: number; edits?: Uint32Array };

function algWord(text: number[], options?: AlgOptions): AlgResult {
  let j = 0; // for debug and edits only
  const m = previousWordPattern.length;
  const hMask = 1 << (m - 1);
  let vp = -1 | 0;
  let vm = 0 | 0;
  let eq_1 = 0 | 0;
  let tt = 0 | 0;
  let tit = 0 | 0;
  const result: AlgResult = { distance: m, edits: undefined };
  if (options?.debug) {
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
    if (options?.debug) {
      mat[0][j + 1] = j + 1;
      for (let i = 0; i < m; i++) {
        mat[i + 1][j + 1] = mat[i][j + 1] + (vp & (1 << i) ? 1 : vm & (1 << i) ? -1 : 0);
      }
    }
    j++;
  }
  return result;
}

function algX(text: number[] | string[], options?: AlgOptions): AlgResult {
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
  if (options?.debug) {
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
    if (typeof textSymbol === "number" && textSymbol >= 0 && (textSymbol | 0) === textSymbol) {
      if (textSymbol < DIRECT_LOOKUP_LIMIT) {
        base = textSymbol * words;
      } else {
        const shifted = textSymbol - preparedPattern.highBase;
        base =
          shifted >= 0 && shifted < preparedPattern.highCount
            ? preparedPattern.highStart + shifted * words
            : (preparedPattern.wideOffsets?.get(textSymbol) ?? -1);
      }
    } else {
      base = preparedPattern.wideOffsets?.get(textSymbol) ?? -1;
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

      if (options?.debug) {
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

  if (options?.cutoff && result.distance > options.cutoff) result.distance = options.cutoff + 1;
  return result;
}

export type DistanceOptions = AlgOptions & {
  noSwap?: boolean;
  noTrim?: boolean;
  splitStr?: (str: string) => number[];
};

export type CompareResultWithEditSequence = {
  distance: number;
  similarity: number;
  editSequence: string;
};
type CompareResultNumeric = { distance: number; similarity: number };

export type CompareResult<O extends DistanceOptions> = O extends { withEditSequence: true }
  ? CompareResultWithEditSequence
  : CompareResultNumeric;

export function compare<O extends DistanceOptions>(
  patternStr: string,
  textStr: string,
  options?: O,
): CompareResult<O> {
  const splitStr = options?.splitStr ?? toCodePoints;
  let pattern = splitStr(patternStr);
  let origPatternLen = pattern.length;
  let patternLen = origPatternLen;
  let ret: CompareResultNumeric | CompareResultWithEditSequence = options?.withEditSequence
    ? { distance: 0, similarity: 1, editSequence: "e".repeat(origPatternLen) }
    : { distance: 0, similarity: 1 };
  if (patternStr === textStr) return ret as CompareResult<O>;
  if (options?.cutoff !== undefined && options?.cutoff < 1) {
    ret.distance = options?.cutoff + 1;
    ret.similarity = 0;
    if (options?.withEditSequence && "editSequence" in ret) ret.editSequence = "";
    return ret as CompareResult<O>;
  }
  let text = splitStr(textStr);
  let origTextLen = text.length;
  let textLen = origTextLen;
  let patternShoter = patternLen <= textLen;
  if (options?.withEditSequence) options.noSwap = true;
  if (!options?.noSwap && !patternShoter) {
    [pattern, text] = [text, pattern];
    [patternLen, textLen] = [textLen, patternLen];
    [origPatternLen, origTextLen] = [origTextLen, origPatternLen];
    patternShoter = true;
  }
  let originalPatternSameAsPrevious = false;
  let calculate;
  if (patternLen > WORD_WIDTH) {
    originalPatternSameAsPrevious = compareArrayElements(pattern, previousPattern);
    calculate = algX;
  } else {
    originalPatternSameAsPrevious = compareArrayElements(pattern, previousWordPattern);
    calculate = algWord;
  }
  let trimmed = false;
  let prefixLen = 0;
  let suffixLen = 0;
  if (!options?.noTrim && !originalPatternSameAsPrevious) {
    ({ prefixLen, suffixLen } = commonAffix(
      pattern,
      patternLen,
      text,
      textLen,
      patternShoter ? patternLen : textLen,
    ));
    patternLen -= prefixLen + suffixLen;
    textLen -= prefixLen + suffixLen;
    pattern = pattern.slice(prefixLen, patternLen + prefixLen);
    text = text.slice(prefixLen, textLen + prefixLen);
    if (prefixLen > 0 || suffixLen > 0) trimmed = true;
  }
  if (patternLen === 0) {
    ret.distance = textLen;
    ret.similarity = 1 - ret.distance / (patternShoter ? origTextLen : origPatternLen);
    if (options?.withEditSequence && "editSequence" in ret) {
      ret.editSequence = "e".repeat(prefixLen) + "i".repeat(textLen) + "e".repeat(suffixLen);
    }
    if (options?.cutoff !== undefined && ret.distance > options?.cutoff) {
      ret.distance = options.cutoff + 1;
      ret.similarity = 0;
      if (options?.withEditSequence && "editSequence" in ret) {
        ret.editSequence = "";
      }
    }
    return ret as CompareResult<O>;
  }
  if (textLen === 0) {
    ret.distance = patternLen;
    ret.similarity = 1 - ret.distance / (patternShoter ? origTextLen : origPatternLen);
    if (options?.withEditSequence && "editSequence" in ret) {
      ret.editSequence = "e".repeat(prefixLen) + "d".repeat(patternLen) + "e".repeat(suffixLen);
    }
    if (options?.cutoff !== undefined && ret.distance > options?.cutoff) {
      ret.distance = options.cutoff + 1;
      ret.similarity = 0;
      if (options?.withEditSequence && "editSequence" in ret) {
        ret.editSequence = "";
      }
    }
    return ret as CompareResult<O>;
  }

  if (trimmed || !originalPatternSameAsPrevious) {
    if (patternLen > WORD_WIDTH) {
      if (!trimmed || !compareArrayElements(pattern, previousPattern)) {
        if (previousPattern.length !== 0) zeroPreparedPattern(previousPattern);
        preparePattern(pattern);
        previousPattern = pattern;
      }
      calculate = algX;
    } else {
      if (!trimmed || !compareArrayElements(pattern, previousWordPattern)) {
        if (previousWordPattern.length !== 0) for (const cp of previousWordPattern) peq[cp] = 0;
        for (const [i, cp] of pattern.entries()) peq[cp] |= 1 << i;
        previousWordPattern = pattern;
      }
      calculate = algWord;
    }
  }

  const { distance, edits } = calculate(text, options);
  ret.distance = distance;
  ret.similarity = 1 - ret.distance / (patternShoter ? origTextLen : origPatternLen);
  if (options?.debug) console.log(toString(pattern, text, mat));
  if (options?.withEditSequence && "editSequence" in ret) {
    const sequence = [];
    /**
     * 000 tit
     * 001 tdt
     * 010 s
     * 011 e
     * 1x0 i
     * 1x1 d
     */
    const words = patternLen > WORD_WIDTH ? preparedPattern.words : 1;
    let i = (patternLen - 1) & WORD_MASK,
      j = textLen - 1,
      r = words - 1;
    const decrementI = () => {
      if (--i < 0) {
        i = 31;
        r--;
      }
    };
    let push = true;
    while (r >= 0 && j >= 0) {
      let baseIndex = (j * words + r) * 3;
      let a = edits?.[baseIndex] ?? 0;
      let b = edits?.[baseIndex + 1] ?? 0;
      let c = edits?.[baseIndex + 2] ?? 0;
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
            sequence.push("t");
            decrementI();
            const textChar = text[j];
            while (pattern[r * WORD_WIDTH + i] !== textChar) {
              sequence.push("d");
              decrementI();
            }
            j--;
            sequence.push("t");
          } else {
            sequence.push("t");
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
    const editSequence =
      "e".repeat(prefixLen) + sequence.reverse().join("") + "e".repeat(suffixLen);
    ret.editSequence = editSequence;
  }
  if (options?.cutoff !== undefined && ret.distance > options?.cutoff) {
    ret.distance = options.cutoff + 1;
    ret.similarity = 0;
    if (options?.withEditSequence && "editSequence" in ret) {
      ret.editSequence = "";
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

function commonAffix(
  s1: string[] | number[],
  s1Len: number,
  s2: string[] | number[],
  s2Len: number,
  shorterLen: number,
): { prefixLen: number; suffixLen: number } {
  const s1End = s1Len - 1;
  const s2End = s2Len - 1;
  let prefixLen = 0;
  let suffixLen = 0;
  while (prefixLen < shorterLen && s1[prefixLen] === s2[prefixLen]) prefixLen++;
  while (suffixLen < shorterLen - prefixLen && s1[s1End - suffixLen] === s2[s2End - suffixLen])
    suffixLen++;
  return { prefixLen, suffixLen };
}

function toCodePoints(str: string) {
  const length = str.length;
  const output: number[] = [];
  let size = 0;
  for (let index = 0; index < length; index++) {
    const high = str.charCodeAt(index);
    if (high >= 0xd800 && high <= 0xdbff && index + 1 < length) {
      const low = str.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        output[size++] = (high - 0xd800) * 1024 + (low - 0xdc00) + 0x10000;
        index++;
        continue;
      }
    }
    output[size++] = high;
  }
  return output;
}

function compareArrayElements(arr1: string[] | number[], arr2: string[] | number[]): boolean {
  const arr1Len = arr1.length;
  if (arr1Len !== arr2.length) return false;
  for (let i = 0; i < arr1Len; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}
