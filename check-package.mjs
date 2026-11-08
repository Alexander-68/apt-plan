// Packaging check for the OmniGate bundle and the Cloudflare asset allow-list.
//
// The expected file set is derived from the app's own sources, not from the
// build script's $bundleFiles array. That keeps this a requirement check rather
// than a change-detector: if a runtime file is added, removed or renamed, the
// derivation and the archive have to agree.
//
// The only explicitly restated files are the two deployment metadata files that
// are not referenced by the app at runtime: omnigate.json (the OmniGate
// manifest) and README.md (the human-facing copy). OmniGate's archive includes
// both; Cloudflare's .assetsignore intentionally excludes both.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const buildScript = join(repoRoot, 'build-omnigate.ps1');
const zipPath = join(repoRoot, 'apt.zip');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function readRepoFile(rel) {
  return readFileSync(join(repoRoot, rel), 'utf8');
}

function isExternal(spec) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(spec);
}

// Normalise a repo-relative path without ever letting it escape the repo.
// Returns null for the root, a directory, or an escaping path.
function normalizePath(rel) {
  let p = String(rel).trim().replace(/\\/g, '/');
  if (!p) return null;
  if (p.startsWith('/')) p = p.slice(1);
  p = p.split('#')[0].split('?')[0];
  if (!p) return null;
  const parts = [];
  for (const part of p.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) return null;
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/') || null;
}

const runtime = new Set();
const parsed = new Set();

function addRuntime(rel) {
  if (!rel || parsed.has(rel)) return;
  parsed.add(rel);
  runtime.add(rel);
  if (/\.(?:js|mjs)$/i.test(rel)) parseModule(rel);
  else if (/\.html$/i.test(rel)) parseHtml(rel);
  else if (/\.css$/i.test(rel)) parseCss(rel);
}

// Local assets are referenced with ordinary relative paths (href, src, url()).
function addAssetRef(spec, fromRel) {
  if (!spec) return;
  const s = String(spec).trim();
  if (!s || s.startsWith('#') || isExternal(s)) return;
  if (s.endsWith('/') || s === '.' || s === './') return;
  const p = normalizePath(`${posix.dirname(fromRel)}/${s}`);
  if (p) addRuntime(p);
}

// Module imports are relative only; bare specifiers are CDN modules.
function addModuleRef(spec, fromRel) {
  if (!spec) return;
  const s = String(spec).trim();
  if (!s || s.startsWith('#') || isExternal(s)) return;
  if (!/^(?:\.{1,2}\/|\/)/.test(s)) return;
  const p = normalizePath(`${posix.dirname(fromRel)}/${s}`);
  if (p) addRuntime(p);
}

function parseHtml(rel) {
  const src = readRepoFile(rel);
  for (const m of src.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) addAssetRef(m[1], rel);
  for (const m of src.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) addAssetRef(m[1], rel);
  for (const m of src.matchAll(/<(?:img|source|video|audio|track)\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) addAssetRef(m[1], rel);
  for (const m of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const im of m[1].matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) addModuleRef(im[1], rel);
  }
}

function parseCss(rel) {
  const src = readRepoFile(rel);
  for (const m of src.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) addAssetRef(m[2], rel);
}

function parseModule(rel) {
  const src = readRepoFile(rel);
  for (const m of src.matchAll(/\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g)) addModuleRef(m[1], rel);
  for (const m of src.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) addModuleRef(m[1], rel);
  for (const m of src.matchAll(/\b(?:loader|textureLoader)\.load\(\s*['"]([^'"]+)['"]/g)) addAssetRef(m[1], rel);
  for (const m of src.matchAll(/\b(?:loader|textureLoader)\.load\(\s*`([^`]+)`/g)) {
    if (!m[1].includes('${')) addAssetRef(m[1], rel);
  }
  for (const m of src.matchAll(/\bnew\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g)) addAssetRef(m[1], rel);
  for (const m of src.matchAll(/\bnew\s+URL\(\s*`([^`]+)`\s*,\s*import\.meta\.url\s*\)/g)) {
    if (!m[1].includes('${')) addAssetRef(m[1], rel);
  }

  // app.js: photo('whiteoak') -> loader.load(`assets/tex-${name}.jpg`).
  const photoTemplate = /`(assets\/tex-\$\{[^}]+\}\.jpg)`/.exec(src);
  if (photoTemplate) {
    for (const m of src.matchAll(/\bphoto\(\s*['"]([^'"]+)['"]/g)) {
      addAssetRef(photoTemplate[1].replace(/\$\{[^}]+\}/g, m[1]), rel);
    }
  }

  // stool.js: load('top') -> new URL(`./assets/stool-${name}.jpg`, import.meta.url).
  const stoolTemplate = /`(\.\/assets\/stool-\$\{[^}]+\}\.jpg)`/.exec(src);
  if (stoolTemplate) {
    for (const m of src.matchAll(/\bload\(\s*['"]([^'"]+)['"]/g)) {
      addAssetRef(stoolTemplate[1].replace(/\$\{[^}]+\}/g, m[1]), rel);
    }
  }
}

// The app's own entry point. Everything else follows from this walk.
addRuntime('index.html');

assert.ok(runtime.size > 0, 'the app sources referenced no runtime files');
for (const required of ['index.html', 'style.css', 'app.js', 'plan.js', 'wall-edges.js', 'stool.js', 'stool2.js', 'favicon.svg']) {
  assert.ok(runtime.has(required), `the app sources did not reference ${required}`);
}

const expectedBundle = new Set([...runtime, 'omnigate.json', 'README.md']);
const expectedAssets = new Set(runtime);

function walkFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) files.push(relative(root, full).replace(/\\/g, '/'));
    }
  }
  return files.sort();
}

let tempDir = null;
let server = null;
let browser = null;
let exitCode = 0;

try {
  const build = spawnSync('pwsh', ['-NoProfile', '-File', 'build-omnigate.ps1'], { cwd: repoRoot, encoding: 'utf8' });
  if (build.error) throw build.error;
  if (build.status !== 0) {
    throw new Error(`build-omnigate.ps1 failed (exit ${build.status}).\n${build.stdout || ''}${build.stderr || ''}`);
  }
  if (build.stdout.trim()) console.log(build.stdout.trim());

  tempDir = mkdtempSync(join(tmpdir(), 'apt-package-'));
  const extractDir = join(tempDir, 'bundle');
  mkdirSync(extractDir, { recursive: true });

  const expand = spawnSync('pwsh', ['-NoProfile', '-Command',
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`],
    { encoding: 'utf8' });
  if (expand.error) throw expand.error;
  if (expand.status !== 0) {
    throw new Error(`Expand-Archive failed (exit ${expand.status}).\n${expand.stdout || ''}${expand.stderr || ''}`);
  }

  const actual = new Set(walkFiles(extractDir));
  const missing = [...expectedBundle].filter((file) => !actual.has(file)).sort();
  const extra = [...actual].filter((file) => !expectedBundle.has(file)).sort();
  if (missing.length || extra.length) {
    const lines = [];
    if (missing.length) lines.push(`Missing from apt.zip (${missing.length}): ${missing.join(', ')}`);
    if (extra.length) lines.push(`Unexpected in apt.zip (${extra.length}): ${extra.join(', ')}`);
    throw new Error(`apt.zip does not match the app's runtime file set.\n${lines.join('\n')}`);
  }

  // .assetsignore uses gitignore syntax. An empty temporary index makes every
  // working-tree file "untracked", so git's own exclude matcher applies the
  // .assetsignore rules to the whole tree without touching the repository index.
  const gitIndex = join(tempDir, 'assetsignore.index');
  const gitEnv = { ...process.env, GIT_INDEX_FILE: gitIndex };
  const readTree = spawnSync('git', ['read-tree', '--empty'], { cwd: repoRoot, env: gitEnv, encoding: 'utf8' });
  if (readTree.error) throw readTree.error;
  if (readTree.status !== 0) {
    throw new Error(`git read-tree --empty failed (exit ${readTree.status}).\n${readTree.stdout || ''}${readTree.stderr || ''}`);
  }
  const list = spawnSync('git', ['ls-files', '--others', '--exclude-from=.assetsignore', '--exclude-standard'], {
    cwd: repoRoot, env: gitEnv, encoding: 'utf8',
  });
  if (list.error) throw list.error;
  if (list.status !== 0) {
    throw new Error(`git ls-files failed (exit ${list.status}).\n${list.stdout || ''}${list.stderr || ''}`);
  }
  const ignoredFiles = new Set(list.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  const assetsMissing = [...expectedAssets].filter((file) => !ignoredFiles.has(file)).sort();
  const assetsExtra = [...ignoredFiles].filter((file) => !expectedAssets.has(file)).sort();
  if (assetsMissing.length || assetsExtra.length) {
    const lines = [];
    if (assetsMissing.length) lines.push(`Missing from .assetsignore (${assetsMissing.length}): ${assetsMissing.join(', ')}`);
    if (assetsExtra.length) lines.push(`Unexpected in .assetsignore (${assetsExtra.length}): ${assetsExtra.join(', ')}`);
    throw new Error(`.assetsignore does not un-ignore exactly the app's runtime file set.\n${lines.join('\n')}`);
  }

  const localResponses = [];
  const localRequests = [];
  const localFailures = [];
  const pageErrors = [];
  const allResponses = [];

  server = createServer((req, res) => {
    const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = requestUrl.pathname;
    localRequests.push({ method: req.method, path: pathname });
    const fail = (status) => {
      res.statusCode = status;
      res.removeHeader('Content-Length');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(status === 404 ? 'Not Found' : status === 405 ? 'Method Not Allowed' : 'Internal Server Error');
      localResponses.push({ method: req.method, path: pathname, status });
    };
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        fail(405);
        return;
      }
      let relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      relPath = posix.normalize(decodeURIComponent(relPath));
      if (!relPath || relPath === '.' || relPath.startsWith('../') || relPath.startsWith('/')) {
        fail(404);
        return;
      }
      const filePath = resolve(extractDir, relPath);
      const within = relative(extractDir, filePath);
      if (!within || within.startsWith('..') || isAbsolute(within)) {
        fail(404);
        return;
      }
      let info;
      try {
        info = statSync(filePath);
      } catch {
        info = null;
      }
      if (!info || !info.isFile()) {
        fail(404);
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream');
      res.setHeader('Content-Length', info.size);
      res.setHeader('Cache-Control', 'no-store');
      if (req.method === 'HEAD') res.end();
      else res.end(readFileSync(filePath));
      localResponses.push({ method: req.method, path: pathname, status: 200 });
    } catch {
      fail(500);
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;
  const isLocal = (url) => url === origin || url.startsWith(`${origin}/`);

  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => allResponses.push({ url: response.url(), status: response.status() }));
  page.on('requestfailed', (request) => {
    if (isLocal(request.url())) localFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' });
  });

  await page.goto(`${origin}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.apartment, { timeout: 60000 });
  await page.waitForFunction(() => window.apartment && window.apartment.revision === '187' && window.apartment.meshes > 100, { timeout: 30000 });
  await page.waitForTimeout(1000);

  const boot = await page.evaluate(() => ({ revision: window.apartment.revision, meshes: window.apartment.meshes }));
  assert.equal(boot.revision, '187', 'apartment.revision should be 187');
  assert.ok(boot.meshes > 100, `apartment.meshes should be > 100 (got ${boot.meshes})`);
  assert.deepEqual(pageErrors, [], `uncaught page errors: ${pageErrors.join('; ')}`);

  const badStatus = localResponses.filter((response) => response.status < 200 || response.status >= 300);
  assert.deepEqual(badStatus, [], `local server returned non-2xx: ${JSON.stringify(badStatus)}`);
  assert.deepEqual(localFailures, [], `local requests failed: ${JSON.stringify(localFailures)}`);

  const localMissing = [...new Set(localRequests.map((request) => request.path))].filter((path) => {
    const rel = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
    return !actual.has(rel);
  });
  assert.deepEqual(localMissing, [], `local requests missing from the bundle: ${localMissing.join(', ')}`);

  console.log(`Derived runtime files (${runtime.size}): ${[...runtime].sort().join(', ')}`);
  console.log(`PASS: apt.zip has ${actual.size} entries; .assetsignore un-ignores ${ignoredFiles.size} runtime files; ` +
    `local server answered ${localResponses.length} requests (all 2xx); app booted with revision ${boot.revision} and ${boot.meshes} meshes; ` +
    `${allResponses.length} total responses recorded.`);
} catch (error) {
  exitCode = 1;
  console.error(`FAIL: ${error?.message ?? error}`);
} finally {
  if (browser) {
    try { await browser.close(); } catch { /* ignore cleanup failure */ }
  }
  if (server) {
    try { server.closeAllConnections?.(); } catch { /* ignore */ }
    try { await new Promise((resolveClose) => server.close(resolveClose)); } catch { /* ignore */ }
  }
  if (tempDir) {
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore cleanup failure */ }
  }
}

process.exitCode = exitCode;
