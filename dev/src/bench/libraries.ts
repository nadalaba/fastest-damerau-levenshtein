import TadLipsyDamerauLevenshtein from "damerau-levenshtein";
import FabvalaaahDamerauLevenshteinJS from "damerau-levenshtein-js";
import WeightedDamerauLevenshtein from "weighted-damerau-levenshtein";
import Skodld from "levenshtein-damerau";
import AlordashDamerauLevenshtein from "@alordash/damerau-levenshtein";
import { damerauLevenshtein as guswpm_damerau_levenshtein } from "@guswpm/damerau-levenshtein";
import { DamerauLevenshteinDistance as haggholm_damerau_levenshtein } from "@haggholm/damerau-levenshtein";
import { DamerauLevenshtein as crob_damerau_levenshtein } from "@crob/damerau-levenshtein";
import RealDamerauLevenshtein from "real-damerau-levenshtein";
import { damerauLevenshtein as mukundakatta_dl_mcp } from "@mukundakatta/lev-mcp";
import { calculateStringDistance } from "damerau-levenshtein-distance";
import * as ClientsideSearch from "clientside-search";
import * as RapidfuzzDL from "rapidfuzz-js/damerau-levenshtein";
import * as RapidfuzzOSA from "rapidfuzz-js/osa";
import * as NlpTools from "@nlptools/distance";
import * as NlpToolsWASM from "@nlptools/distance-wasm";
import * as Hermetrics from "hermetrics";
import * as StringMetric from "string-metric";
import * as Fuzzykit from "fuzzykit";
import * as LibLevenshtein from "@a-s8h/liblevenshtein";
import * as Nodeve from "@nodeve/text/damerau-levenshtein";
import StringComparisons from "string-comparisons";
import * as RapidFuzzy from "rapid-fuzzy";
import TextSimilarityNode from "text-similarity-node";
import * as MarkovNamegen from "markov-namegen-js";
import * as Cmpstr from "cmpstr";
import * as OptimizedRestricted from "./optimized-restricted.ts";

import type { Lib } from "../types";

export const libs: Lib[] = [
  {
    name: "tad-lispy/node-damerau-levenshtein",
    fn: (s1: string, s2: string) => TadLipsyDamerauLevenshtein(s1, s2).steps,
  },
  {
    name: "fabvalaaah/damerau-levenshtein-js",
    fn: FabvalaaahDamerauLevenshteinJS.distance,
  },
  {
    name: "mrshu/node-weighted-damerau-levenshtein",
    fn: WeightedDamerauLevenshtein,
  },
  {
    name: "tony-o/skodld",
    fn: Skodld,
  },
  {
    name: "alordash/damerau-levenshtein",
    fn: AlordashDamerauLevenshtein.distance,
  },
  {
    name: "@guswpm/damerau-levenshtein",
    fn: guswpm_damerau_levenshtein,
  },
  {
    // natural C++ unrestricted
    name: "owldotco/damerau-levenshtein",
    fn: haggholm_damerau_levenshtein,
  },
  {
    // natural C++ restricted
    name: "owldotco/damerau-levenshtein",
    fn: (s1: string, s2: string) => haggholm_damerau_levenshtein(s1, s2, { restricted: true }),
  },
  {
    name: "@crob/damerau-levenshtein",
    fn: (s1: string, s2: string) => {
      const dl = new crob_damerau_levenshtein();
      return dl.distance(s1, s2);
    },
  },
  {
    name: "nake89/real-damerau-levenshtein",
    fn: (s1: string, s2: string) => RealDamerauLevenshtein(s1, s2).steps,
  },
  {
    name: "@mukundakatta/lev-mcp",
    fn: mukundakatta_dl_mcp,
  },
  {
    name: "kodmax/damerau-levenshtein-distance",
    fn: calculateStringDistance,
  },
  {
    name: "kyr0/clientside-search",
    fn: (s1: string, s2: string) => {
      const distanceCache: ClientsideSearch.DistanceCache = new Map();
      return ClientsideSearch.damerauLevenshteinDistance(s1, s2, distanceCache);
    },
  },
  {
    name: "sarunast/rapidfuzz-js/DL",
    fn: RapidfuzzDL.distance,
  },
  {
    name: "sarunast/rapidfuzz-js/OSA",
    fn: RapidfuzzOSA.distance,
  },
  {
    name: "@nlptools/distance",
    fn: NlpTools.damerauLevenshtein,
  },
  {
    name: "@nlptools/distance-wasm",
    fn: NlpToolsWASM.damerau_levenshtein,
  },
  {
    name: "weylermaldonado/hermetricsjsDL",
    fn: (s1: string, s2: string) => new Hermetrics.DamerauLevenshtein().distance(s1, s2),
  },
  {
    name: "weylermaldonado/hermetricsjsOSA",
    fn: (s1: string, s2: string) => new Hermetrics.OSA().distance(s1, s2),
  },
  {
    name: "hellojayjay/string-metricDL",
    fn: (s1: string, s2: string) => new StringMetric.Damerau().distance(s1, s2),
  },
  {
    name: "hellojayjay/string-metricOSA",
    fn: (s1: string, s2: string) => new StringMetric.OptimalStringAlignment().distance(s1, s2),
  },
  {
    name: "trananhtung/fuzzykit",
    fn: Fuzzykit.damerauLevenshtein,
  },
  {
    name: "@a-s8h/liblevenshtein",
    fn: LibLevenshtein.distance("transposition"),
  },
  {
    name: "nodeve-com/nodeve",
    fn: (s1: string, s2: string) => Nodeve.damerauLevenshtein(s1, s2).steps,
  },
  {
    name: "sumn2u/string-comparisons",
    fn: (s1: string, s2: string) => {
      return StringComparisons.DamerauLevenshtein.distance(s1, s2);
    },
  },
  {
    name: "derodero24/rapid-fuzzy",
    fn: RapidFuzzy.damerauLevenshtein,
  },
  {
    name: "piotrmaciejbednarski/text-similarity-node",
    fn: TextSimilarityNode.distance.damerauLevenshtein,
  },
  {
    name: "denizkose/markov-chain",
    fn: MarkovNamegen.damerauLevenshteinDistance,
  },
  {
    name: "komed3/cmpstr",
    fn: (s1: string, s2: string) => {
      const cmp = Cmpstr.CmpStr.create({ metric: "damerau", raw: true });
      const res = cmp.test(s1, s2);
      return res?.raw?.dist ?? 0;
    },
  },
  {
    name: "optimized-C#-implementation",
    fn: OptimizedRestricted.damlev,
  },
];
