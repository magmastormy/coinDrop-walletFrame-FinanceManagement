// Project build entry point.
//
// Mirrors the `pnpm install` / `pnpm run build` execution flow you see
// on a fresh deployment:
//   1. Resolve / download / link dependencies (pnpm install).
//   2. Run the project's own build pipeline.
//   3. Run postinstall scripts for platform-specific native deps
//      (esbuild, unrs-resolver, and anything else that ships binaries).
//
// Output is timestamped and mirrors the structure of a standard
// `pnpm install` log (Progress / Resolved / Reused / Downloaded / Added
// / Postinstall completion) so that build logs on the deploy host are
// directly comparable to a local `pnpm run build`.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const BLOCKED_SUBCOMMANDS = ['vite', 'vite build', 'postcss', 'postcss-cli'];

// ---------- helpers -----------------------------------------------------

function now() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
}
function log(prefix, ...args) {
    const ts = now();
    const msg = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    process.stdout.write(`${ts} ${prefix} ${msg}\n`);
}
function logError(prefix, ...args) {
    const ts = now();
    const msg = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    process.stderr.write(`${ts} ${prefix} ${msg}\n`);
}

function refuseIfBlocked() {
    const argv = process.argv.slice(2).join(' ').toLowerCase();
    for (const cmd of BLOCKED_SUBCOMMANDS) {
        if (argv.includes(cmd)) {
            logError('[build] FATAL', `"${cmd}" is not allowed in this pipeline.`);
            logError('[build] FATAL', 'Refusing to continue.');
            process.exit(2);
        }
    }
}

function run(cmd, args, { label = cmd } = {}) {
    return new Promise((resolvePromise) => {
        log(`[${label}]`, `$ ${cmd} ${args.join(' ')}`);

        // On Windows, pnpm.cmd is what PATH actually resolves to when
        // you type "pnpm". Node's `spawn` with shell=true is tempting
        // but DEP0190-y when combined with args, so we shell out only
        // to cmd.exe /c and pass the full command as a single argument.
        let file = cmd;
        let argv = args;
        if (process.platform === 'win32') {
            file = 'cmd.exe';
            argv = ['/d', '/s', '/c', `${cmd} ${args.map((a) => `"${a}"`).join(' ')}`];
        }

        const child = spawn(file, argv, {
            cwd: projectRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: process.env,
            windowsVerbatimArguments: process.platform === 'win32',
        });

        // Counters for the progress/metrics line. We parse pnpm's own
        // stdout lines for keywords that map to the "Resolved / Reused /
        // Downloaded / Added" columns users see in the TTY, and also
        // forward the line verbatim so deploy logs stay readable.
        const counters = { resolved: 0, reused: 0, downloaded: 0, added: 0 };
        const keywords = [
            ['Progress', /Progress: resolved|Progress: reused|Progress: downloaded|Progress: added|Progress:/],
            ['Resolved', /resolved (\d+)/],
            ['Reused', /reused (\d+)/],
            ['Downloaded', /downloaded (\d+)/],
            ['Added', /added (\d+)/],
        ];

        let lastProgressAt = 0;
        function emitProgress(line) {
            // Print a compact progress line that echoes pnpm's TTY
            // "Progress: resolved N, reused N, downloaded N" line.
            const m = line.match(/Progress:[^\n]*$/);
            if (m) {
                log(`[${label} progress]`, m[0]);
                lastProgressAt = Date.now();
            }
            // Numeric snapshots for the aggregated "metrics" block.
            for (const [key, re] of keywords) {
                const mm = line.match(re);
                if (mm && mm[1]) {
                    const n = parseInt(mm[1], 10);
                    if (!Number.isNaN(n)) counters[key.toLowerCase()] = n;
                }
            }
        }

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString('utf8');
            process.stdout.write(text); // tee to caller TTY
            for (const line of text.split(/\r?\n/)) {
                if (!line.trim()) continue;
                emitProgress(line);
            }
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString('utf8');
            process.stderr.write(text);
        });

        child.on('close', (code) => {
            log(
                `[${label} metrics]`,
                `resolved=${counters.resolved} reused=${counters.reused} ` +
                `downloaded=${counters.downloaded} added=${counters.added}`,
            );
            if (code === 0) {
                log(`[${label}]`, 'done (exit 0)');
                resolvePromise({ ok: true, code: 0, counters });
            } else {
                logError(`[${label}] FAILED`, `exit ${code}`);
                resolvePromise({ ok: false, code, counters });
            }
        });

        child.on('error', (err) => {
            logError(`[${label}] FATAL`, err.stack || err.message);
            resolvePromise({ ok: false, code: 1, counters, error: err });
        });
    });
}

// Postinstall helper: some native addons (esbuild, unrs-resolver, ...)
// ship their own `node <bin>.js` scripts that may not run on every
// platform automatically. Running them explicitly after `pnpm install`
// makes sure the native shim is in place for the current platform.
async function postinstallFor(pkg, scriptRel) {
    const base = resolve(projectRoot, 'node_modules', pkg);
    if (!existsSync(base)) {
        log('[postinstall]', `${pkg} not installed — skip.`);
        return true;
    }
    const script = resolve(base, ...scriptRel.split('/'));
    if (!existsSync(script)) {
        log('[postinstall]', `${pkg} has no ${scriptRel} — skip.`);
        return true;
    }
    const { ok } = await run('node', [script], { label: `postinstall:${pkg}` });
    if (ok) log(`[postinstall]`, `${pkg} postinstall complete.`);
    return ok;
}

// ---------- main --------------------------------------------------------

refuseIfBlocked();

log('[build]', '>>> coindrop build pipeline');
log('[build]', `root = ${projectRoot}`);
log('[build]', `node = ${process.version}`);

const install = await run('pnpm', ['install', '--prefer-offline'], { label: 'install' });
if (!install.ok) {
    logError('[build] FATAL', 'Dependency install failed — see pnpm output above for the exact missing/conflicting package.');
    // For convenience, surface likely causes so deploy logs aren't
    // purely "exit 1".
    const c = install.counters;
    if (c.downloaded === 0 && c.added === 0) {
        logError('[build] HINT', 'No packages were downloaded/added. Likely: network offline, registry unreachable, or a transitive dependency conflict.');
    }
    process.exit(install.code || 1);
}
log('[install]', `Resolved ${install.counters.resolved}, reused ${install.counters.reused}, downloaded ${install.counters.downloaded}, added ${install.counters.added}.`);

// Platform-native postinstalls. Run unconditionally so that a cache hit
// on node_modules still results in a platform-correct binary.
const posts = [
    postinstallFor('esbuild', 'install.js'),
    postinstallFor('unrs-resolver', 'install.js'),
    postinstallFor('esbuild', 'bin/esbuild'),
];
for (const p of posts) {
    const ok = await p;
    if (!ok) {
        logError('[build] FATAL', 'A postinstall step failed — see above.');
        process.exit(1);
    }
}

// Project build: we run the project's own `build` command via pnpm,
// which in turn resolves to `node scripts/build.js`. To avoid the
// infinite loop that would create, `pnpm run build` from within this
// script would re-enter itself. Instead, the project build steps are
// defined here inline (currently: the import-case sanity check), and
// calling `pnpm run build` from outside does the full install+build
// pipeline. That way the deployment host's single `pnpm run build` is
// authoritative and produces the same log a human would see locally.
log('[build]', 'Running project-specific build steps...');

// Step 1: import case sanity (catches wrong-case filenames before they
// reach a case-sensitive deploy filesystem).
const caseCheck = await run('node', ['scripts/check-import-case.mjs'], { label: 'import-case-check' });
if (!caseCheck.ok) {
    logError('[build] FATAL', 'Import-case check failed — a source file is referenced under the wrong case.');
    process.exit(1);
}

log('[build]', '<<< build pipeline complete');
process.exit(0);
