// Small helpers shared by the db-*.mjs scripts. Not used by the website itself.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Loads .env.local / .env exactly like Next.js does (the package ships with Next.js). */
export async function loadEnv() {
  try {
    const mod = await import("@next/env");
    const loadEnvConfig = (mod.default ?? mod).loadEnvConfig;
    loadEnvConfig(root, process.env.NODE_ENV !== "production");
    return;
  } catch {
    // fall back to a tiny reader below
  }
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const value = m[2].replace(/^(["'])(.*)\1$/, "$2");
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  }
}

/** host:port/database only. The password is never printed. */
export function describeTarget() {
  try {
    const u = new URL(process.env.DATABASE_URL);
    return `${u.hostname}${u.port ? ":" + u.port : ""}/${u.pathname.replace(/^\//, "")}`;
  } catch {
    return "(DATABASE_URL could not be read)";
  }
}

export async function connect() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  let pg;
  try {
    pg = (await import("pg")).default;
  } catch {
    console.error('The "pg" package is not installed. Run:  npm.cmd install pg@8');
    process.exit(1);
  }
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
  });
  try {
    await client.connect();
  } catch (err) {
    console.error(`Could not connect to the database (${err.code || err.name}).`);
    console.error("Check DATABASE_URL in .env.local, and that PostgreSQL is running.");
    process.exit(1);
  }
  return client;
}

/**
 * Converts some TypeScript files from src/ into plain JavaScript inside node_modules/.cache,
 * so the scripts can run the REAL project code (using the project's own `typescript`).
 */
export async function transpile(files, folderName) {
  const ts = (await import("typescript")).default;
  const outDir = path.join(root, "node_modules", ".cache", folderName);
  fs.mkdirSync(outDir, { recursive: true });
  for (const rel of files) {
    const source = fs.readFileSync(path.join(root, rel), "utf8");
    let js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    js = js.replace(/from\s+(["'])\.\/([\w-]+)\1/g, 'from "./$2.mjs"');
    // plain Node cannot always read a named export from the CommonJS "pg" package; Next.js can.
    js = js.replace(/import\s*\{\s*Pool\s*\}\s*from\s*["']pg["'];?/, 'import pg from "pg"; const { Pool } = pg;');
    fs.writeFileSync(path.join(outDir, path.basename(rel).replace(/\.ts$/, ".mjs")), js);
  }
  return outDir;
}
