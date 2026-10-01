import { getRandomString, splitmix32, type CharsetCluster } from "../utils.ts";
import type {
  DistanceRegularTests,
  DistanceVariationTests,
  DistanceGeneratedTests,
} from "../types";

export const basicTests: DistanceRegularTests = {
  label: "Basic Tests",
  cases: [
    // insertions / deletions
    { args: ["x", "xx"], expected: 1 },
    { args: ["xy", "xyy"], expected: 1 },
    { args: ["foo", "foobar"], expected: 3 },
    { args: ["foo", "foobarbaz"], expected: 6 },
    { args: ["foo", "barfoo"], expected: 3 },
    { args: ["foo", "bazbarfoo"], expected: 6 },
    { args: ["foobaz", "foobarbaz"], expected: 3 },
    { args: ["foobaz", "foobarbarbaz"], expected: 6 },

    // substitutions
    { args: ["foofoo", "foobar"], expected: 3 },
    { args: ["foofoofoo", "foobarbaz"], expected: 6 },
    { args: ["foofoo", "barfoo"], expected: 3 },
    { args: ["foofoofoo", "bazbarfoo"], expected: 6 },
    { args: ["foofoofoo", "foobarfoo"], expected: 3 },
    { args: ["foofoofoofoo", "foobarbazfoo"], expected: 6 },

    // transpositions
    { args: ["ab", "ba"], expected: 1 },
    { args: ["xab", "xba"], expected: 1 },
    { args: ["aby", "bay"], expected: 1 },
    { args: ["xaby", "xbay"], expected: 1 },
    { args: ["abcd", "badc"], expected: 2 },
    { args: ["xabcd", "xbadc"], expected: 2 },
    { args: ["abycd", "baydc"], expected: 2 },
    { args: ["abcdz", "badcz"], expected: 2 },
    { args: ["xabycd", "xbaydc"], expected: 2 },
    { args: ["xabcdz", "xbadcz"], expected: 2 },
    { args: ["abycdz", "baydcz"], expected: 2 },
    { args: ["xabycdz", "xbaydcz"], expected: 2 },

    // edge cases
    { args: ["ab", "bbaa"], expected: 3 },
    { args: ["ab", "bbxaa"], expected: 4 },
    { args: ["axb", "bbaa"], expected: 4 },
    { args: ["axb", "bbxaa"], expected: 4 },
    { args: ["axb", "bbyaa"], expected: 5 },

    { args: ["xyx", "yxy"], expected: 2 },
    { args: ["xyx", "yaxy"], expected: 3 },
    { args: ["xyx", "yxby"], expected: 3 },
    { args: ["xyx", "yaxby"], expected: 4 },
    { args: ["xryx", "yaxy"], expected: 3 },
    { args: ["xysx", "yxby"], expected: 3 },
    { args: ["xrysx", "yaxby"], expected: 5 },

    { args: ["aab", "cba"], expected: 2 },
    { args: ["abc", "caa"], expected: 3 },

    { args: ["qXYbZaZwZXeZw12345bbbqca12345eYwq", "eqcqeaqY"], expected: 29 },
    {
      args: ["acbabacbabbaababbcccbbacbbacbcbbacbbaaaaccacccbbbbcbbabaccaccccaa", "cccaaabcaacb"],
      expected: 54,
    },
  ],
};

export const variationTests: DistanceVariationTests = {
  label: "Variation Tests",
  cases: [
    // deletions then transposition
    { args: ["axb", "ba"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["axyb", "ba"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["axyzb", "ba"], expected: { restricted: 5, unrestricted: 4 } },
    { args: ["raxb", "rba"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["raxyb", "rba"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["raxyzb", "rba"], expected: { restricted: 5, unrestricted: 4 } },
    { args: ["axbs", "bas"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["axybs", "bas"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["axyzbs", "bas"], expected: { restricted: 5, unrestricted: 4 } },
    { args: ["raxbs", "rbas"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["raxybs", "rbas"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["raxyzbs", "rbas"], expected: { restricted: 5, unrestricted: 4 } },

    // transposition then insertions
    { args: ["ab", "bxa"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["ab", "bxya"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["ab", "bxyza"], expected: { restricted: 5, unrestricted: 4 } },
    { args: ["rab", "rbxa"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["rab", "rbxya"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["rab", "rbxyza"], expected: { restricted: 5, unrestricted: 4 } },
    { args: ["abs", "bxas"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["abs", "bxyas"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["abs", "bxyzas"], expected: { restricted: 5, unrestricted: 4 } },
    { args: ["rabs", "rbxas"], expected: { restricted: 3, unrestricted: 2 } },
    { args: ["rabs", "rbxyas"], expected: { restricted: 4, unrestricted: 3 } },
    { args: ["rabs", "rbxyzas"], expected: { restricted: 5, unrestricted: 4 } },

    // edge cases
    {
      args: ["eyacbceceqbbbqcaycbqxcqqeeweqhgweaxz", "qqqgawx"],
      expected: { restricted: 31, unrestricted: 30 },
    },
  ],
};

let generatedTests: DistanceGeneratedTests = {
  label: "Generated Tests",
  pack: { s1: [], s2: [] },
};

export function getGeneratedTests(
  iterations: number,
  ms?: number[],
  ns?: number[],
  charsetClusters?: CharsetCluster[],
  seed: number = Date.now(),
  update?: boolean,
): DistanceGeneratedTests {
  if (generatedTests.pack.s1.length === 0 || update) {
    const rnd = splitmix32(seed);

    if (ns === undefined) {
      ns = [2];
      for (let n = 4; n <= 32; n += 4) ns.push(n);
      ns.push(64, 100, 1000);
    }
    ms ??= new Array(8).fill(0).map((_, i) => 4 + 4 * i);

    const s1: string[] = [];
    const s2: string[] = [];
    if (iterations < 1) iterations = 1;
    for (const m of ms)
      for (let i = 0; i < iterations; i++) s1.push(getRandomString(m, charsetClusters, rnd));
    for (const n of ns)
      for (let i = 0; i < iterations; i++) s2.push(getRandomString(n, charsetClusters, rnd));
    generatedTests.pack = { s1, s2 };
  }
  return generatedTests;
}
