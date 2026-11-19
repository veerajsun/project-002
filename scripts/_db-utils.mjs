
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export async function loadEnv() {
  try {
    const mod = await import("@next/env");
    const loadEnvConfig = (mod.default ?? mod).loadEnvConfig;
    loadEnvConfig(root, process.env.NODE_ENV !== "production");
  } catch {
    for (const file of [".env.local", ".env"]) {
      const fullPath = path.join(root, file);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, "utf8");

      for (const line of content.split(/\r?\n/)) {
        const match = line.match(
          /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/
        );

        if (!match || process.env[match[1]] !== undefined) continue;

        let value = match[2].trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        process.env[match[1]] = value;
      }
    }
  }
}

export function getSqliteDbPath() {
  const configured = process.env.SQLITE_DB_PATH;

  if (!configured?.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SQLITE_DB_PATH is not configured.");
    }

    return path.join(root, "data", "sabaland.db");
  }

  return configured.trim();
}

export function describeTarget() {
  const dbPath = getSqliteDbPath();

  if (dbPath === ":memory:") {
    return "SQLite in-memory database";
  }

  return `SQLite database: ${path.basename(dbPath)}`;
}

export async function connect() {
  await loadEnv();

  const Database = (await import("better-sqlite3")).default;
  const configuredPath = getSqliteDbPath();

  const dbPath =
    configuredPath === ":memory:"
      ? configuredPath
      : path.resolve(root, configuredPath);

  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);

  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  return db;
}

/**
 * Loads TypeScript from the local project installation
 * or from the HostKarle CloudLinux Node.js virtual environment.
 */
async function loadTypeScript() {
  try {
    const mod = await import("typescript");
    return mod.default ?? mod;
  } catch (localError) {
    const home = process.env.HOME || path.dirname(root);
    const nodeMajor = process.versions.node.split(".")[0];

    const globalTsPath = path.join(
      home,
      "nodevenv",
      path.basename(root),
      nodeMajor,
      "lib",
      "node_modules",
      "typescript",
      "lib",
      "typescript.js"
    );

    if (!fs.existsSync(globalTsPath)) {
      throw new Error(
        `TypeScript not found locally or at ${globalTsPath}. ` +
        `Original error: ${localError.message}`
      );
    }

    const mod = await import(pathToFileURL(globalTsPath).href);
    return mod.default ?? mod;
  }
}

/**
 * Transpiles TypeScript files into a temporary ESM folder
 * so Node scripts can import the actual application code.
 */
export async function transpile(files, folderName = "db-tools") {
  const ts = await loadTypeScript();

  const outputDir = path.join(
    root,
    "node_modules",
    ".cache",
    folderName
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
    skipLibCheck: true
  };

  const written = [];

  for (const relativeFile of files) {
    const absoluteFile = path.join(root, relativeFile);
    const source = fs.readFileSync(absoluteFile, "utf8");

    const result = ts.transpileModule(source, {
      compilerOptions,
      fileName: absoluteFile,
      reportDiagnostics: true
    });

    const errors = (result.diagnostics ?? []).filter(
      (diagnostic) =>
        diagnostic.category === ts.DiagnosticCategory.Error
    );

    if (errors.length) {
      throw new Error(
        errors
          .map((diagnostic) =>
            ts.flattenDiagnosticMessageText(
              diagnostic.messageText,
              "\n"
            )
          )
          .join("\n")
      );
    }

    const outputName = path.basename(relativeFile).replace(
      /\.tsx?$/,
      ".mjs"
    );

    const outputPath = path.join(outputDir, outputName);

    const code = result.outputText.replace(
      /(\bfrom\s+["'])(\.{1,2}\/[^"']+)(["'])/g,
      (_match, before, specifier, after) =>
        `${before}${specifier.replace(/\.tsx?$/, ".mjs")}${after}`
    );

    fs.writeFileSync(outputPath, code, "utf8");
    written.push(outputPath);
  }

  return outputDir;
}
