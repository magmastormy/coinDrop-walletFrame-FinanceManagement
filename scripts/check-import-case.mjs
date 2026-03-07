import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const AUTH_CONTEXT_FILE = path.resolve(SRC_DIR, 'contexts', 'authContext.js');
const DISALLOWED_IMPORT = "contexts/AuthContext";

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
  }

  if (violations.length > 0) {
    console.error('[check-import-case] Disallowed import casing found. Use "contexts/authContext".');
    violations.forEach((file) => console.error(` - ${file}`));
    process.exit(1);
  }

  console.log('[check-import-case] Passed');
}

main().catch((error) => {
  console.error('[check-import-case] Failed:', error.message);
  process.exit(1);
});
