// Dev convenience: launch a plain node HTTP server that serves the
// project root. Intentionally NOT vite / not postcss. Keeps the dev
// loop honest with what the deployment target runs.
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const port = Number(process.env.PORT) || 5173;

const MIME = {
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.jsx': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.map': 'application/json; charset=utf-8',
};

/**
 * Safely resolves a relative path against the root directory.
 * Returns absolute path if within root, null otherwise.
 * Uses path.sep for cross-platform compatibility.
 */
function safe(rel) {
    // Normalize the relative path
    const normalized = rel.replace(/^\/+/, '').replace(/\.\.+/g, '');
    
    // Resolve absolute path
    const abs = resolve(root, normalized);
    
    // Ensure the resolved path is within root
    // Use path.relative to check - if it starts with '..' or is absolute, it's outside
    const relative = resolve(root, abs);
    if (relative.startsWith('..') || relative.startsWith(sep) || relative.startsWith('/')) {
        return null;
    }
    
    // Additional check: abs must start with root
    if (!abs.startsWith(root + sep) && abs !== root) {
        return null;
    }
    
    return abs;
}

createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let rel = url === '/' ? '/index.html' : url;

    let target = safe(rel);
    if (!target) { res.writeHead(403); res.end('forbidden'); return; }
    if (!existsSync(target) || !statSync(target).isFile()) {
        // SPA fallback
        target = safe('/index.html');
    }

    try {
        const body = readFileSync(target);
        res.writeHead(200, {
            'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
            'Content-Length': body.length,
        });
        res.end(body);
    } catch (e) {
        res.writeHead(500); res.end(`server error: ${e.message}`);
    }
}).listen(port, () => {
    console.log(`[dev] serving ${root} on http://localhost:${port} (no-vite, no-postcss)`);
});
