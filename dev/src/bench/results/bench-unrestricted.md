| benchmark                                          | N=4         | N=16        | N=64        | N=256       | N=1024      | N=4096      |
| -------------------------------------------------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| fastest-damerau-levenshtein (unrestricted)         | `380.04 ns` | `892.35 ns` | ` 12.87 µs` | ` 79.63 µs` | `801.52 µs` | ` 10.82 ms` |
| lowrance-wagner (unrestricted)                     | ` 95.81 µs` | `107.25 µs` | `331.66 µs` | `  2.93 ms` | ` 41.28 ms` | `780.25 ms` |
| tony-o/skodld (unrestricted)                       | `  3.47 µs` | ` 37.94 µs` | `529.00 µs` | `  8.61 ms` | `130.59 ms` | ` 2.17 s`   |
| owldotco/damerau-levenshtein (unrestricted)        | `  5.13 µs` | ` 44.60 µs` | `777.92 µs` | ` 13.80 ms` | `261.67 ms` | ` 4.40 s`   |
| nake89/real-damerau-levenshtein (unrestricted)     | `184.38 µs` | `183.39 µs` | `330.93 µs` | `  1.71 ms` | ` 18.06 ms` | `437.58 ms` |
| kodmax/damerau-levenshtein-distance (unrestricted) | `  6.70 µs` | ` 10.89 µs` | ` 78.72 µs` | `  1.03 ms` | ` 18.17 ms` | `424.41 ms` |
| sarunast/rapidfuzz-js/DL (unrestricted)            | `925.71 ns` | `  5.94 µs` | ` 56.09 µs` | `770.70 µs` | ` 12.03 ms` | `197.56 ms` |
| @nlptools/distance (unrestricted)                  | `  1.49 µs` | `  5.01 µs` | ` 59.55 µs` | `905.55 µs` | ` 15.92 ms` | `274.29 ms` |
| @nlptools/distance-wasm (unrestricted)             | `  1.13 µs` | `  8.62 µs` | `129.20 µs` | `  2.09 ms` | ` 35.54 ms` | `597.80 ms` |
| weylermaldonado/hermetricsjsDL (unrestricted)      | `  2.89 µs` | ` 31.32 µs` | `467.24 µs` | `  7.68 ms` | `119.56 ms` | ` 2.01 s`   |
| hellojayjay/string-metricDL (unrestricted)         | `  4.52 µs` | ` 42.84 µs` | `611.18 µs` | `  9.90 ms` | `159.23 ms` | ` 2.59 s`   |
| nodeve-com/nodeve (unrestricted)                   | `  4.15 µs` | ` 41.58 µs` | `556.61 µs` | `  8.74 ms` | `139.32 ms` | ` 2.31 s`   |
| derodero24/rapid-fuzzy (unrestricted)              | `  1.35 µs` | `  6.85 µs` | ` 72.59 µs` | `  1.02 ms` | ` 17.36 ms` | `296.14 ms` |
| denizkose/markov-chain (unrestricted)              | `  3.65 µs` | ` 48.89 µs` | `611.64 µs` | `  8.85 ms` | `138.90 ms` | ` 2.23 s`   |

summary

- fastest-damerau-levenshtein (unrestricted)
  - +18.26…+2.44x faster than sarunast/rapidfuzz-js/DL (unrestricted)
  - +25.35…+3.92x faster than @nlptools/distance (unrestricted)
  - +27.37…+3.56x faster than derodero24/rapid-fuzzy (unrestricted)
  - +39.22…+17.63x faster than kodmax/damerau-levenshtein-distance (unrestricted)
  - +40.44…+482.54x faster than nake89/real-damerau-levenshtein (unrestricted)
  - +55.24…+2.96x faster than @nlptools/distance-wasm (unrestricted)
  - +72.1…+252.09x faster than lowrance-wagner (unrestricted)
  - +186.14…+7.61x faster than weylermaldonado/hermetricsjsDL (unrestricted)
  - +200.54…+9.13x faster than tony-o/skodld (unrestricted)
  - +206.22…+9.61x faster than denizkose/markov-chain (unrestricted)
  - +213.42…+10.93x faster than nodeve-com/nodeve (unrestricted)
  - +239.61…+11.9x faster than hellojayjay/string-metricDL (unrestricted)
  - +407.07…+13.5x faster than owldotco/damerau-levenshtein (unrestricted)
