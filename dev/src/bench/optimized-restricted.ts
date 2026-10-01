// https://blog.softwx.net/2015/01/optimizing-damerau-levenshtein_15.html

export function damlev(str1: string, str2: string) {
  if (str1 === "") return str2.length;
  if (str2 === "") return str1.length;

  const str1Chars = [...str1];
  const str2Chars = [...str2];
  // if strings of different lengths, ensure shorter string is in s. This can result in a little
  // faster speed by spending more time spinning just the inner loop during the main processing.
  let str1Len = str1Chars.length; // this is also the minimun length of the two strings
  let str2Len = str2Chars.length;
  let s: string[], t: string[];
  let sLen: number, tLen: number;
  if (str1Len > str2Len) {
    s = str2Chars;
    sLen = str2Len;
    t = str1Chars;
    tLen = str1Len;
  } else {
    s = str1Chars;
    sLen = str1Len;
    t = str2Chars;
    tLen = str2Len;
  }

  // suffix common to both strings can be ignored
  while (sLen > 0 && s[sLen - 1] == t[tLen - 1]) {
    sLen--;
    tLen--;
  }

  let start = 0;
  if (s[0] == t[0] || sLen == 0) {
    // if there's a shared prefix, or all s matches t's suffix
    // prefix common to both strings can be ignored
    while (start < sLen && s[start] == t[start]) start++;
    sLen -= start; // length of the part excluding common prefix and suffix
    tLen -= start;

    // if all of shorter string matches prefix and/or suffix of longer string, then
    // edit distance is just the delete of additional characters present in longer string
    if (sLen == 0) return tLen;

    t = t.slice(start, start + tLen); // faster than t[start+j] in inner loop below
  }

  const v0 = new Array(tLen);
  const v2 = new Array(tLen).fill(0); // stores one level further back (offset by +1 position)
  for (let j = 0; j < tLen; j++) v0[j] = j + 1;

  let prevsChar,
    prevtChar,
    tChar,
    sChar = s[0];
  let thisTransCost,
    nextTransCost,
    above,
    left,
    current = 0;
  for (let i = 0; i < sLen; i++) {
    prevsChar = sChar;
    sChar = s[start + i];
    tChar = t[0];
    left = i;
    current = i + 1;
    nextTransCost = 0;
    for (let j = 0; j < tLen; j++) {
      above = current;
      thisTransCost = nextTransCost;
      nextTransCost = v2[j];
      v2[j] = current = left; // cost of diagonal (substitution)
      left = v0[j]; // left now equals current cost (which will be diagonal at next iteration)
      prevtChar = tChar;
      tChar = t[j];
      if (sChar != tChar) {
        if (left < current) current = left; // insertion
        if (above < current) current = above; // deletion
        current++;
        if (i != 0 && j != 0 && sChar == prevtChar && prevsChar == tChar) {
          thisTransCost++;
          if (thisTransCost < current) current = thisTransCost; // transposition
        }
      }
      v0[j] = current;
    }
  }
  return current;
}
