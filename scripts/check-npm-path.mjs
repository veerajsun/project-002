
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

console.log("=== NPM LOCATION CHECK ===");

console.log("Current directory:", process.cwd());
console.log("Node executable:", process.execPath);

for (const command of ["npm root", "npm prefix", "npm config get prefix"]) {
  try {
    console.log(command + ":", execSync(command, {
      encoding: "utf8"
    }).trim());
  } catch (error) {
    console.log(command + " ERROR:", error.message);
  }
}

const localModules = path.join(process.cwd(), "node_modules");
console.log("Local node_modules exists:", fs.existsSync(localModules));

try {
  const require = createRequire(import.meta.url);
  console.log("TypeScript location:", require.resolve("typescript"));
} catch (error) {
  console.log("TypeScript NOT FOUND:", error.code);
}
