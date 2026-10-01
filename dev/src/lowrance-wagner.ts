//import { toString } from "fastest-damerau-levenshtein";

export function distance(s1: string, s2: string): number {
  const s1Arr = [...s1];
  const s2Arr = [...s2];
  const m = s1Arr.length;
  const n = s2Arr.length;
  const dp = new Uint32Array(0x110000);
  const h: number[][] = [];
  const getH = (i: number, j: number) => {
    if (i < 0 || j < 0) return Infinity;
    else if (i === 0) return j;
    else if (j === 0) return i;
    else return h[i][j];
  };
  for (let i = 0; i <= m; i++) h[i] = [];
  for (let i = 1; i <= m; i++) {
    let dt = 0;
    for (let j = 1; j <= n; j++) {
      const i1 = dp[s2Arr[j - 1].codePointAt(0)!];
      const j1 = dt;
      let d = 1;
      if (s1Arr[i - 1] === s2Arr[j - 1]) {
        d = 0;
        dt = j;
      }
      h[i][j] = Math.min(
        getH(i - 1, j - 1) + d,
        getH(i, j - 1) + 1,
        getH(i - 1, j) + 1,
        getH(i1 - 1, j1 - 1) + (i - i1 - 1) + 1 + (j - j1 - 1),
      );
    }
    dp[s1Arr[i - 1].codePointAt(0)!] = i;
  }
  //console.log(toString([...s1], [...s2], getH));
  return h[m][n];
}
