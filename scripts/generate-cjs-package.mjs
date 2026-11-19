import { writeFile } from "node:fs/promises";

await writeFile("dist/cjs/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
