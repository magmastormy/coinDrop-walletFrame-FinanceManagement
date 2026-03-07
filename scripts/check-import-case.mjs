import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const AUTH_CONTEXT_FILE = path.resolve(SRC_DIR, 'contexts', 'authContext.js');
const DISALLOWED_IMPORT = "contexts/AuthContext";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listDir(dir) {
  try {
    return await fs.readdir(dir);
  } catch {
    return null;
  }
}

async function resolveWithExtensions(basePath) {
  if (await exists(basePath)) return basePath;

  const candidates = [
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.mjs')
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }

  return null;
}

async function ensureExactCasing(resolvedPath) {
  const parsed = path.parse(resolvedPath);
  const parts = parsed.dir.split(path.sep).filter(Boolean);

  if (process.platform === 'win32' && parts.length > 0) {
    const driveFromRoot = parsed.root.replace(/\\+$/, '').toLowerCase();
    if (parts[0].toLowerCase() === driveFromRoot) {
      parts.shift();
    }
  }

  let current = parsed.root;
  for (const part of parts) {
    const entries = await listDir(current);
    if (!entries) {
      return { ok: false, message: `Missing directory: ${current}` };
    }

    const match = entries.find((e) => e.toLowerCase() === part.toLowerCase());
    if (!match) {
      return { ok: false, message: `Missing path segment "${part}" under ${current}` };
    }

    if (match !== part) {
      return { ok: false, message: `Casing mismatch: expected "${match}", got "${part}" under ${current}` };
    }

    current = path.join(current, match);
  }

  const finalDir = current;
  const finalEntries = await listDir(finalDir);
  if (!finalEntries) {
    return { ok: false, message: `Missing directory: ${finalDir}` };
  }

  const fileMatch = finalEntries.find((e) => e.toLowerCase() === parsed.base.toLowerCase());
  if (!fileMatch) {
    return { ok: false, message: `Missing file: ${resolvedPath}` };
  }

  if (fileMatch !== parsed.base) {
    return { ok: false, message: `Casing mismatch: expected "${fileMatch}", got "${parsed.base}" in ${finalDir}` };
  }

  return { ok: true };
}

function extractImportSpecifiers(content) {
  const results = [];

  const importFrom = /\bfrom\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = importFrom.exec(content)) !== null) {
    results.push(m[1]);
  }

  const dynamicImport = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynamicImport.exec(content)) !== null) {
    results.push(m[1]);
  }

  return results;
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(fullPath);
      }
      if (/\.(js|jsx|mjs)$/.test(entry.name)) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

async function main() {
  const violations = [];

  try {
    await fs.access(AUTH_CONTEXT_FILE);
  } catch {
    console.error(`[check-import-case] Missing required file: ${AUTH_CONTEXT_FILE}`);
    process.exit(1);
  }

  const files = await collectFiles(SRC_DIR);
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    if (content.includes(DISALLOWED_IMPORT)) {
      violations.push(file);
    }

    const imports = extractImportSpecifiers(content);
    for (const specifier of imports) {
      if (!specifier.startsWith('.')) continue;
      const fromDir = path.dirname(file);
      const joined = path.resolve(fromDir, specifier);
      const resolved = await resolveWithExtensions(joined);
      if (!resolved) {
        violations.push(`${file} -> missing: ${specifier}`);
        continue;
      }

      const casing = await ensureExactCasing(resolved);
      if (!casing.ok) {
        violations.push(`${file} -> ${specifier} (${casing.message})`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('[check-import-case] Import path casing/resolve errors found.');
    console.error('[check-import-case] Fix them so builds work on Linux (Vercel).');
    console.error('[check-import-case] Also ensure auth context is imported as "contexts/authContext".');
    violations.forEach((v) => console.error(` - ${v}`));
    process.exit(1);
  }

  console.log('[check-import-case] Passed');
}

main().catch((error) => {
  console.error('[check-import-case] Failed:', error.message);
  process.exit(1);
});
