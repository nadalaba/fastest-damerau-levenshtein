export const WORD_WIDTH = 32;
export const WORD_WIDTH_SHIFT = 5;
export const WORD_MASK = WORD_WIDTH - 1;
const WINDOW_SPAN_LIMIT = 2048;
const WINDOW_CELL_LIMIT = 16384;
export const DIRECT_LOOKUP_LIMIT = 128;

type WideOffsets = Map<number, number>;
export type PreparedPattern = {
  length: number;
  words: number;
  masks: Int32Array;
  highBase: number;
  highCount: number;
  highStart: number;
  wideOffsets: WideOffsets | null;
};

export const preparedPattern: PreparedPattern = {
  length: 0,
  words: 1,
  masks: new Int32Array(DIRECT_LOOKUP_LIMIT),
  highBase: 0,
  highCount: 0,
  highStart: 0,
  wideOffsets: null,
};

export function preparePattern(patternArr: number[]): void {
  preparedPattern.length = patternArr.length;
  const words = ((preparedPattern.length - 1) >>> WORD_WIDTH_SHIFT) + 1;
  preparedPattern.words = words;
  preparedPattern.highStart = DIRECT_LOOKUP_LIMIT * preparedPattern.words;

  if (preparedPattern.highStart > preparedPattern.masks.length) {
    const grown = new Int32Array(preparedPattern.highStart);
    grown.set(preparedPattern.masks);
    preparedPattern.masks = grown;
  }

  let low = 0x100000000;
  let high = -1;
  let highs: { at: number[]; of: number[] } | null = null;
  for (const [i, symbol] of patternArr.entries()) {
    if (symbol < DIRECT_LOOKUP_LIMIT) {
      preparedPattern.masks[symbol * words + (i >>> WORD_WIDTH_SHIFT)] |= 1 << (i & WORD_MASK);
    } else if (symbol <= 0xffffffff) {
      highs ??= { at: [], of: [] };
      highs.at.push(i);
      highs.of.push(symbol);
      if (symbol < low) low = symbol;
      if (symbol > high) high = symbol;
    }
  }

  if (highs === null) return;

  const span = high < 0 ? 0 : high - low + 1;
  const windowed = span > 0 && span <= WINDOW_SPAN_LIMIT && span * words <= WINDOW_CELL_LIMIT;
  preparedPattern.highBase = windowed ? low : 0;
  preparedPattern.highCount = windowed ? span : 0;
  const strayedHighsCount = !windowed ? new Set(highs.of).size : 0;
  const neededCells =
    preparedPattern.highStart + (preparedPattern.highCount + strayedHighsCount) * words;
  if (neededCells > preparedPattern.masks.length) {
    const grown = new Int32Array(neededCells);
    grown.set(preparedPattern.masks);
    preparedPattern.masks = grown;
  }

  if (windowed) {
    for (let d = 0; d < highs.at.length; d++) {
      const i = highs.at[d];
      const base = preparedPattern.highStart + (highs.of[d] - preparedPattern.highBase) * words;
      preparedPattern.masks[base + (i >>> WORD_WIDTH_SHIFT)] |= 1 << (i & WORD_MASK);
    }
  } else {
    preparedPattern.wideOffsets = new Map();
    for (let d = 0; d < highs.at.length; d++) {
      const i = highs.at[d];
      const codePoint = highs.of[d];

      let slot = preparedPattern.wideOffsets.get(codePoint);
      if (slot === undefined) {
        slot = preparedPattern.wideOffsets.size;
        preparedPattern.wideOffsets.set(codePoint, slot);
      }
      const base = preparedPattern.highStart + slot * words;
      preparedPattern.masks[base + (i >>> WORD_WIDTH_SHIFT)] |= 1 << (i & WORD_MASK);
    }
    for (const [symbol, slot] of preparedPattern.wideOffsets)
      preparedPattern.wideOffsets.set(symbol, preparedPattern.highStart + slot * words);
  }
}

export function zeroPreparedPattern(patternArr: number[]): void {
  const words = preparedPattern.words;
  for (const [i, symbol] of patternArr.entries()) {
    const word = i >>> WORD_WIDTH_SHIFT;

    if (symbol < DIRECT_LOOKUP_LIMIT) {
      preparedPattern.masks[symbol * words + word] = 0;
    } else if (symbol <= 0xffffffff && preparedPattern.highCount > 0) {
      const shifted = symbol - preparedPattern.highBase;
      preparedPattern.masks[preparedPattern.highStart + shifted * words + word] = 0;
    }
  }
  if (preparedPattern.wideOffsets !== null) {
    for (const [symbol] of preparedPattern.wideOffsets) {
      for (let word = 0; word < preparedPattern.words; word++) {
        const slot = preparedPattern.wideOffsets?.get(symbol);
        if (slot !== undefined) preparedPattern.masks[slot + word] = 0;
      }
    }
  }
  preparedPattern.length = 0;
  preparedPattern.words = 1;
  preparedPattern.highBase = 0;
  preparedPattern.highCount = 0;
  preparedPattern.highStart = 0;
  preparedPattern.wideOffsets = null;
}
