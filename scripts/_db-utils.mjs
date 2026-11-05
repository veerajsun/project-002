
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  if (dbPath === ":memory:") return "SQLite in-memory database";

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
 * Transpiles TypeScript files into a temporary ESM folder
 * so Node scripts can import the actual application code.
 */
export async function transpile(files, folderName = "db-tools") {
  const ts = await import("typescript");

  const outputDir = path.join(
    root,
    "node_modules",
    ".cache",
    folderName
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const compilerOptions = {
    target: ts.default.ScriptTarget.ES2022,
    module: ts.default.ModuleKind.ES2022,
    moduleResolution: ts.default.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
    skipLibCheck: true,
  };

  const written = [];

  for (const relativeFile of files) {
    const absoluteFile = path.join(root, relativeFile);
    const source = fs.readFileSync(absoluteFile, "utf8");

    const result = ts.default.transpileModule(source, {
      compilerOptions,
      fileName: absoluteFile,
      reportDiagnostics: true,
    });

    const errors = (result.diagnostics ?? []).filter(
      (diagnostic) =>
        diagnostic.category === ts.default.DiagnosticCategory.Error
    );

    if (errors.length) {
      throw new Error(
        errors
          .map((diagnostic) =>
            ts.default.flattenDiagnosticMessageText(
              diagnostic.messageText,
              "\n"
            )
          )
          .join("\n")
      );
    }

    const outputName =
      path.basename(relativeFile).replace(/\.tsx?$/, ".mjs");

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
