import { readdir } from "fs/promises";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";

async function importTests(dir: string) {
  let total = 0;
  let failed = 0;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await importTests(fullPath);
    } else if (/\.test\.[jt]s$/.test(entry.name)) {
      const relPath = "./" + relative(__dirname, fullPath);
      const { run } = await import(relPath);
      const { total: t, failed: f } = run();
      total += t;
      failed += f;
    }
  }

  if (failed === 0) {
    console.log(`\n\n${green}${"=".repeat(80)}`);
    console.log(`All Tests Passed [ ${total} / ${total} ]`);
    console.log(`${"=".repeat(80)}${reset}\n`);
  } else {
    console.log(`\n\n${red}${"=".repeat(80)}${reset}`);
    console.log(
      `${red}Failed Tests: [ ${failed} / ${total} ].${reset}`,
      `${green}Passed Tests: [ ${total - failed} / ${total} ].${reset}`,
    );
    console.log(`${red}${"=".repeat(80)}${reset}\n`);
    process.exit(1);
  }
}

await importTests(__dirname);
