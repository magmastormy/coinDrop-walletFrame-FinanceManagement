const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const s = fs.statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

function resolveFile(spec, fromFile) {
  const fromDir = path.dirname(fromFile);
  let candidate = path.resolve(fromDir, spec);
  const exts = ['', '.js', '.jsx', '.mjs'];
  for (const e of exts) {
    const p = candidate + e;
    try { if (fs.existsSync(p) && fs.statSync(p).isFile()) return p; } catch (_) {}
  }
  try {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      for (const e of ['/index.js', '/index.jsx', '/index.mjs']) {
        const p = candidate + e;
        if (fs.existsSync(p)) return p;
      }
    }
  } catch (_) {}
  return null;
}

function exactCase(resolved, root) {
  // Only check segments at or under the project root. Anything above (C:\Users...)
  // is outside source control and can't cause Vercel build failures.
  const rootNorm = path.resolve(root);
  const rel = path.relative(rootNorm, resolved);
  if (rel.startsWith('..')) return { ok: true };
  const parts = rel.split(path.sep);
  let cur = rootNorm;
  for (const part of parts) {
    try {
      const entries = fs.readdirSync(cur);
      const match = entries.find(e => e === part);
      if (!match) {
        const ci = entries.find(e => e.toLowerCase() === part.toLowerCase());
        return { ok: false, expected: ci || part, got: part, under: cur };
      }
      cur = path.join(cur, match);
    } catch (e) {
      return { ok: false, under: cur, got: part, err: String(e) };
    }
  }
  return { ok: true };
}

const SRC = path.resolve(process.cwd(), 'src');
const files = walk(SRC);
const re = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;
let bad = 0;
const seen = new Set();
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(content)) !== null) {
    const spec = m[1];
    const r = resolveFile(spec, f);
    const key = f + '::' + spec;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!r) {
      console.log('MISSING:', path.relative(process.cwd(), f), '->', spec);
      bad++;
      continue;
    }
    const c = exactCase(r, process.cwd());
    if (!c.ok) {
      console.log('CASE:', path.relative(process.cwd(), f), '->', spec, '(resolved', path.relative(process.cwd(), r), ') expected dir name:', c.expected, 'under:', c.at);
      bad++;
    }
  }
}
console.log('issues:', bad);
process.exit(bad ? 1 : 0);
