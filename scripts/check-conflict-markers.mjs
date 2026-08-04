import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const rootsToCheck = ["src", "supabase"];
const textExtensions = new Set([".css", ".js", ".json", ".md", ".mjs", ".sql", ".ts", ".tsx"]);
const conflictMarker = /^(<<<<<<<|=======|>>>>>>>)(?:\s|$)/m;
const failures = [];

async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await checkDirectory(path);
      continue;
    }
    if (!entry.isFile() || !textExtensions.has(extname(entry.name))) continue;

    const contents = await readFile(path, "utf8");
    const lines = contents.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (conflictMarker.test(line)) {
        failures.push(`${relative(root, path)}:${index + 1}: ${line}`);
      }
    });
  }
}

for (const directory of rootsToCheck) {
  await checkDirectory(join(root, directory));
}

if (failures.length > 0) {
  console.error("Unresolved Git merge conflict markers found:\n");
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("No unresolved Git merge conflict markers found.");
}
