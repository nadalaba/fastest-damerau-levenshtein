import { readdir } from "node:fs/promises";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";

async function importTests(dir: URL) {
  let total = 0;
  let failed = 0;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryUrl = new URL(entry.name, dir);

    if (entry.isDirectory()) {
      const result = await importTests(new URL(`${entry.name}/`, dir));
      total += result.total;
      failed += result.failed;
    } else if (/\.test\.[jt]s$/.test(entry.name)) {
      const { run } = await import(entryUrl.href);

      const result = run();
      total += result.total;
      failed += result.failed;
    }
  }

  return { total, failed };
}

function logTestsResult({ total, failed }: { total: number; failed: number }): void {
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

logTestsResult(await importTests(new URL(".", import.meta.url)));
