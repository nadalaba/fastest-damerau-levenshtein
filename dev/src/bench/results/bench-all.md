| benchmark                                          | N=4         | N=8         | N=16        | N=32        | N=64        | N=96        |
| -------------------------------------------------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| fastest-damerau-levenshtein (unrestricted)         | `348.82 ns` | `513.86 ns` | `804.43 ns` | `  1.46 µs` | ` 12.02 µs` | ` 18.90 µs` |
| lowrance-wagner (unrestricted)                     | ` 77.89 µs` | ` 84.58 µs` | ` 96.00 µs` | `168.12 µs` | `339.92 µs` | `627.67 µs` |
| tad-lispy/node-damerau-levenshtein                 | `  1.06 µs` | `  2.63 µs` | `  7.50 µs` | ` 25.48 µs` | ` 91.93 µs` | `197.01 µs` |
| fabvalaaah/damerau-levenshtein-js                  | `432.72 ns` | `  1.49 µs` | `  5.72 µs` | ` 21.93 µs` | ` 86.01 µs` | `199.50 µs` |
| mrshu/node-weighted-damerau-levenshtein            | `  1.22 µs` | `  2.64 µs` | `  7.33 µs` | ` 24.14 µs` | ` 87.35 µs` | `197.71 µs` |
| tony-o/skodld (unrestricted)                       | `  3.49 µs` | ` 11.33 µs` | ` 39.72 µs` | `153.37 µs` | `533.64 µs` | `  1.14 ms` |
| alordash/damerau-levenshtein                       | `  3.30 µs` | ` 10.89 µs` | ` 38.75 µs` | `149.81 µs` | `570.05 µs` | `  1.22 ms` |
| @guswpm/damerau-levenshtein                        | `  1.61 µs` | `  3.05 µs` | `  7.29 µs` | ` 21.17 µs` | ` 71.48 µs` | `150.55 µs` |
| owldotco/damerau-levenshtein (unrestricted)        | `  5.02 µs` | ` 12.21 µs` | ` 43.35 µs` | `178.54 µs` | `750.99 µs` | `  1.79 ms` |
| owldotco/damerau-levenshtein                       | `  4.55 µs` | ` 10.87 µs` | ` 36.85 µs` | `131.39 µs` | `450.07 µs` | `  1.01 ms` |
| @crob/damerau-levenshtein                          | `932.18 ns` | `  2.54 µs` | `  8.19 µs` | ` 30.54 µs` | `122.98 µs` | `263.64 µs` |
| nake89/real-damerau-levenshtein (unrestricted)     | `105.63 µs` | ` 84.94 µs` | ` 96.12 µs` | ` 99.22 µs` | `135.34 µs` | `222.11 µs` |
| @mukundakatta/lev-mcp                              | `  1.63 µs` | `  3.36 µs` | `  7.95 µs` | ` 23.44 µs` | ` 77.01 µs` | `165.81 µs` |
| kodmax/damerau-levenshtein-distance (unrestricted) | `  6.09 µs` | `  6.86 µs` | `  9.97 µs` | ` 22.50 µs` | ` 72.40 µs` | `156.23 µs` |
| kyr0/clientside-search                             | `  1.40 µs` | `  3.18 µs` | `  9.14 µs` | ` 31.79 µs` | `117.70 µs` | `264.38 µs` |
| sarunast/rapidfuzz-js/DL (unrestricted)            | `  1.00 µs` | `  2.16 µs` | `  5.82 µs` | ` 17.00 µs` | ` 55.65 µs` | `117.21 µs` |
| sarunast/rapidfuzz-js/OSA                          | `728.09 ns` | `  1.46 µs` | `  2.61 µs` | `  4.25 µs` | ` 13.44 µs` | ` 19.47 µs` |
| @nlptools/distance (unrestricted)                  | `  1.61 µs` | `  2.32 µs` | `  5.04 µs` | ` 15.83 µs` | ` 58.11 µs` | `129.72 µs` |
| @nlptools/distance-wasm (unrestricted)             | `  1.17 µs` | `  2.79 µs` | `  8.73 µs` | ` 32.22 µs` | `125.82 µs` | `279.44 µs` |
| weylermaldonado/hermetricsjsDL (unrestricted)      | `  2.87 µs` | `  9.06 µs` | ` 30.12 µs` | `115.52 µs` | `454.20 µs` | `  1.01 ms` |
| weylermaldonado/hermetricsjsOSA                    | `922.33 ns` | `  2.04 µs` | `  5.88 µs` | ` 19.26 µs` | ` 68.99 µs` | `151.17 µs` |
| hellojayjay/string-metricDL (unrestricted)         | `  3.83 µs` | ` 12.44 µs` | ` 43.04 µs` | `163.12 µs` | `619.84 µs` | `  1.40 ms` |
| hellojayjay/string-metricOSA                       | `437.16 ns` | `  1.38 µs` | `  5.22 µs` | ` 20.79 µs` | ` 83.22 µs` | `179.70 µs` |
| trananhtung/fuzzykit                               | `  4.27 µs` | ` 10.78 µs` | ` 33.77 µs` | `117.17 µs` | `430.21 µs` | `965.98 µs` |
| @a-s8h/liblevenshtein                              | `660.59 ns` | `140.99 µs` | `636.41 µs` | `  2.79 ms` | ` 13.96 ms` | ` 32.80 ms` |
| nodeve-com/nodeve (unrestricted)                   | `  4.24 µs` | ` 11.84 µs` | ` 38.97 µs` | `138.80 µs` | `526.64 µs` | `  1.16 ms` |
| sumn2u/string-comparisons                          | `499.88 ns` | `  1.35 µs` | `  5.13 µs` | ` 20.51 µs` | ` 82.09 µs` | `190.69 µs` |
| derodero24/rapid-fuzzy (unrestricted)              | `  1.44 µs` | `  2.67 µs` | `  6.78 µs` | ` 20.98 µs` | ` 70.81 µs` | `150.05 µs` |
| piotrmaciejbednarski/text-similarity-node          | ` 18.96 µs` | ` 20.03 µs` | ` 22.70 µs` | ` 34.17 µs` | ` 76.25 µs` | `144.43 µs` |
| denizkose/markov-chain (unrestricted)              | `  3.93 µs` | ` 11.34 µs` | ` 47.39 µs` | `157.32 µs` | `605.66 µs` | `  1.30 ms` |
| komed3/cmpstr                                      | `  2.79 µs` | `  3.11 µs` | `  3.22 µs` | `  4.00 µs` | ` 15.89 µs` | `136.70 µs` |
| optimized-C#-implementation                        | `706.40 ns` | `  2.15 µs` | `  7.70 µs` | ` 29.58 µs` | `116.21 µs` | `259.27 µs` |

summary

- fastest-damerau-levenshtein (unrestricted)
  - +1.03…+2.09x faster than sarunast/rapidfuzz-js/OSA
  - +7.23…+8x faster than komed3/cmpstr
  - +6.2…+2.87x faster than sarunast/rapidfuzz-js/DL (unrestricted)
  - +6.86…+4.63x faster than @nlptools/distance (unrestricted)
  - +8…+2.64x faster than weylermaldonado/hermetricsjsOSA
  - +7.94…+4.12x faster than derodero24/rapid-fuzzy (unrestricted)
  - +7.97…+4.62x faster than @guswpm/damerau-levenshtein
  - +8.27…+17.45x faster than kodmax/damerau-levenshtein-distance (unrestricted)
  - +8.77…+4.68x faster than @mukundakatta/lev-mcp
  - +9.51…+1.25x faster than hellojayjay/string-metricOSA
  - +10.09…+1.43x faster than sumn2u/string-comparisons
  - +10.56…+1.24x faster than fabvalaaah/damerau-levenshtein-js
  - +7.64…+54.35x faster than piotrmaciejbednarski/text-similarity-node
  - +10.46…+3.5x faster than mrshu/node-weighted-damerau-levenshtein
  - +10.43…+3.05x faster than tad-lispy/node-damerau-levenshtein
  - +13.72…+2.03x faster than optimized-C#-implementation
  - +13.99…+4.02x faster than kyr0/clientside-search
  - +13.95…+2.67x faster than @crob/damerau-levenshtein
  - +14.79…+3.35x faster than @nlptools/distance-wasm (unrestricted)
  - +11.75…+243.5x faster than nake89/real-damerau-levenshtein (unrestricted)
  - +33.21…+223.3x faster than lowrance-wagner (unrestricted)
  - +51.12…+12.25x faster than trananhtung/fuzzykit
  - +53.28…+8.24x faster than weylermaldonado/hermetricsjsDL (unrestricted)
  - +53.41…+13.04x faster than owldotco/damerau-levenshtein
  - +61.19…+12.16x faster than nodeve-com/nodeve (unrestricted)
  - +60.16…+9.99x faster than tony-o/skodld (unrestricted)
  - +64.63…+9.46x faster than alordash/damerau-levenshtein
  - +68.67…+11.26x faster than denizkose/markov-chain (unrestricted)
  - +73.9…+10.99x faster than hellojayjay/string-metricDL (unrestricted)
  - +94.71…+14.41x faster than owldotco/damerau-levenshtein (unrestricted)
  - +1735.52…+1.89x faster than @a-s8h/liblevenshtein
