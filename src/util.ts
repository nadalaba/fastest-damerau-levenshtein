export function commonPrefix(s1: Uint32Array, s2: Uint32Array, shorterLen: number): number {
  let prefixLen = 0;
  while (prefixLen < shorterLen && s1[prefixLen] === s2[prefixLen]) prefixLen++;
  return prefixLen;
}

export function commonSuffix(s1: Uint32Array, s2: Uint32Array, shorterLen: number): number {
  const s1End = s1.length - 1;
  const s2End = s2.length - 1;
  let suffixLen = 0;
  while (suffixLen < shorterLen && s1[s1End - suffixLen] === s2[s2End - suffixLen]) suffixLen++;
  return suffixLen;
}

export function toCodePoints(str: string): Uint32Array {
  const length = str.length;
  const output = new Uint32Array(length);
  let size = 0;
  for (let index = 0; index < length; index++) {
    const high = str.charCodeAt(index);
    if (high >= 0xd800 && high <= 0xdbff && index + 1 < length) {
      const low = str.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        output[size++] = (high - 0xd800) * 1024 + (low - 0xdc00) + 0x10000;
        index++;
      }
    } else {
      output[size++] = high;
    }
  }
  return output.subarray(0, size);
}

export function compareArrayElements(arr1: Uint32Array, arr2: Uint32Array): boolean {
  const arr1Len = arr1.length;
  if (arr1Len !== arr2.length) return false;
  for (let i = 0; i < arr1Len; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}
