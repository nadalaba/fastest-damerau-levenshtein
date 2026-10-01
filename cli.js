#!/usr/bin/env node

import { compare, closest } from "./dist/esm/main.js";

const args = process.argv.slice(2);

const possiblePrintFlags = new Set(["distance", "similarity", "editSequence", "text", "index"]);
const possibleOtherFlags = new Set(["debug"]);
const possibleOptionsWithValue = new Set(["cutoff"]);
const printFlags = {};
const otherFlags = {};
const optionsWithValue = {};
const strings = [];
for (let i = 0; i < args.length; i++) {
  let arg = args[i];
  if (arg.startsWith("--")) {
    arg = arg.slice(2);
    const equalsIndex = arg.indexOf("=");
    const option = equalsIndex > -1 ? arg.slice(0, equalsIndex) : arg;
    if (possibleOptionsWithValue.has(option)) {
      const optionValue = equalsIndex > -1 ? arg.slice(equalsIndex + 1) : args[i + 1];
      if (optionValue === undefined || optionValue === "") {
        console.log(`ERROR: Option '--${option}' has no specified value.\n`);
        printUsage();
        process.exit(1);
      }
      optionsWithValue[option] = optionValue;
      if (equalsIndex === -1) i++;
    } else if (possiblePrintFlags.has(option)) {
      printFlags[option] = true;
    } else if (possibleOtherFlags.has(option)) {
      otherFlags[option] = true;
    } else {
      console.log(`ERROR: Unknown option '--${option}'.\n`);
      printUsage();
      process.exit(1);
    }
  } else if (arg.startsWith("-")) {
    const optionsCluster = arg.slice(1);
    for (let j = 0; j < optionsCluster.length; j++) {
      let parsedFlag = false;
      const option = optionsCluster[j];
      for (const pO of possibleOptionsWithValue) {
        if (option === pO.slice(0, 1)) {
          let optionValue;
          if (j < optionsCluster.length - 1) {
            optionValue = optionsCluster.slice(j + 1);
            const equalsIndex = optionValue.indexOf("=");
            if (equalsIndex > -1) optionValue = optionValue.slice(equalsIndex + 1);
          } else {
            optionValue = args[i + 1];
            i++;
          }
          if (optionValue === undefined || optionValue === "") {
            console.log(`ERROR: Option '-${option}' has no specified value.\n`);
            printUsage();
            process.exit(1);
          }
          optionsWithValue[pO] = optionValue;
          parsedFlag = true;
          break;
        }
      }
      if (parsedFlag) break;
      for (const pF of possiblePrintFlags) {
        if (option === pF.slice(0, 1)) {
          printFlags[pF] = true;
          parsedFlag = true;
          break;
        }
      }
      if (parsedFlag) continue;
      for (const oF of possibleOtherFlags) {
        if (option === oF.slice(0, 1)) {
          otherFlags[oF] = true;
          parsedFlag = true;
          break;
        }
      }
      if (parsedFlag) continue;
      console.log(`ERROR: Unknown option '-${option}'.\n`);
      printUsage();
      process.exit(1);
    }
  } else {
    strings.push(arg);
  }
}

const printFlagsCount = Object.values(printFlags).filter((pf) => pf).length;

const options = {};
if (printFlags?.editSequence !== undefined) options.withEditSequence = printFlags.editSequence;
if (optionsWithValue?.cutoff !== undefined) {
  if (!/^\d+$/.test(optionsWithValue.cutoff)) {
    console.log(
      `ERROR: cutoff value should be a number. '${optionsWithValue.cutoff}' is not a number.\n`,
    );
    printUsage();
    process.exit(1);
  }
  options.cutoff = parseFloat(optionsWithValue.cutoff);
}
if (otherFlags?.debug !== undefined) options.debug = otherFlags.debug;

let result;
if (strings.length < 2) {
  console.log("ERROR: Specify at least 2 strings for comparison.\n");
  printUsage();
  process.exit(1);
} else if (strings.length > 2 || printFlags.text || printFlags.index) {
  result = closest(strings[0], strings.slice(1), options);
  if (printFlagsCount < 1) printFlags.text = true;
} else {
  result = compare(strings[0], strings[1], options);
  if (printFlagsCount < 1) printFlags.distance = true;
}

const printName = printFlagsCount > 1;
for (const key of possiblePrintFlags) {
  if (printFlags[key]) {
    if (printName) console.log(formatKeyName(key), result[key]);
    else console.log(result[key]);
  }
}

function formatKeyName(key) {
  let name = key.replaceAll(/(?<![A-Z]|\s)[A-Z]/g, " $&");
  name = name.slice(0, 1).toUpperCase() + name.slice(1);
  return `${name.padEnd(16, " ")}:`;
}

function printUsage() {
  let usage = "Usage: compare [<options>] <s1> <s2>\n";
  usage += "\n";
  usage += "Calculate the unrestricted damerau-levenshtein distance between <s1> and <s2>.\n";
  usage += "\n";
  usage += "By default, the distance between <s1> and <s2> is printed if <s2> was a single\n";
  usage += "string, and the string in <s2> that is closest to <s1> is printed if <s2> was a\n";
  usage += "list of strings.\n";
  usage += "\n";
  usage += "\n";
  usage += "Options:\n";
  usage += " ".repeat(4) + "-h, --help".padEnd(24, " ") + "print usage\n";
  usage +=
    " ".repeat(4) +
    "-c, --cutoff=<number>".padEnd(24, " ") +
    "specify a cutoff for the distance calculation function\n";
  usage +=
    " ".repeat(4) +
    "-d, --distance".padEnd(24, " ") +
    "print the distance between the compared strings, this is on by\n";
  usage += " ".repeat(28) + "default if <s2> was a single string and no other flags were used\n";
  usage +=
    " ".repeat(4) +
    "-s, --similarity".padEnd(24, " ") +
    "print the similarity between the compared strings\n";
  usage +=
    " ".repeat(4) +
    "-e, --edit-sequence".padEnd(24, " ") +
    "print the edit sequence that reconstructs <s2> from <s1>\n";
  usage +=
    " ".repeat(4) +
    "-t, --text".padEnd(24, " ") +
    "print the text of the closest string in <s2> to <s1>, this is on by\n";
  usage += " ".repeat(28) + "default if <s2> was a list of strings and no other flags were used\n";
  usage +=
    " ".repeat(4) +
    "-i, --index".padEnd(24, " ") +
    "print the index of the closest string in <s2> to <s1>\n";

  console.log(usage);
}
