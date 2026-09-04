#!/usr/bin/env node
// Alf Maskan marketing site — zero-dependency static builder.
// Assembles src/pages/**.html into dist/ using src/layout.html + src/partials/*.html.
//
//   node build.js          build once into dist/
//   node build.js --watch  rebuild on change
//   node build.js --serve  build, watch, and serve dist/ on :4321

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const ASSETS = path.join(ROOT, 'assets');
const DIST = path.join(ROOT, 'dist');

const readdirDeep = (dir, base = '') => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...readdirDeep(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
};

// Front matter is an HTML comment at the very top: <!-- key: value ... -->
const parseFrontMatter = (raw) => {
  const match = raw.match(/^<!--([\s\S]*?)-->\s*/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^\s*([a-zA-Z][\w-]*)\s*:\s*(.*?)\s*$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: raw.slice(match[0].length) };
};

const loadPartials = () => {
  const map = {};
  for (const name of fs.readdirSync(PARTIALS)) {
    if (name.endsWith('.html')) map[name.replace(/\.html$/, '')] = fs.readFileSync(path.join(PARTIALS, name), 'utf8');
  }
  return map;
};

// {{> name}} includes a partial; nested includes are resolved too.
const expandPartials = (html, partials, depth = 0) => {
  if (depth > 8) throw new Error('partial include depth exceeded — check for a cycle');
  const next = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (whole, name) => {
    if (!(name in partials)) throw new Error(`unknown partial: ${name}`);
    return partials[name];
  });
  return next === html ? next : expandPartials(next, partials, depth + 1);
};

const fillVars = (html, vars) =>
  html.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (whole, key) => (key in vars ? vars[key] : ''));

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
};

// Wiping dist/ is how stale pages get pruned, but on Windows a file the dev
// server is streaming — or a second build running at the same time — makes the
// delete throw ENOTEMPTY/EBUSY. Losing a whole build to that is worse than
// leaving one stale file behind, so this retries, then gives up quietly and
// lets the build overwrite in place.
function clean() {
  try {
    fs.rmSync(DIST, { recursive: true, force: true, maxRetries: 10, retryDelay: 60 });
  } catch (err) {
    if (err.code !== 'ENOTEMPTY' && err.code !== 'EBUSY' && err.code !== 'EPERM') throw err;
    console.warn(`could not fully clear dist/ (${err.code}) — overwriting in place`);
  }
}

function build() {
  const started = Date.now();
  const layout = fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8');
  const partials = loadPartials();

  clean();
  fs.mkdirSync(DIST, { recursive: true });

  const pages = readdirDeep(PAGES).filter((p) => p.endsWith('.html'));
  for (const rel of pages) {
    const raw = fs.readFileSync(path.join(PAGES, rel), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    const depth = rel.split('/').length - 1;
    const base = depth ? '../'.repeat(depth) : '';

    const vars = {
      // Any front-matter key is usable as {{key}} in a page or partial, so a
      // page can pass something like `step: 4` through to a shared partial.
      // The computed values below deliberately win over anything of the same
      // name in the front matter.
      ...meta,
      base,
      lang: meta.lang || 'en',
      dir: meta.dir || 'ltr',
      nav: meta.nav || '',
      title: meta.title || 'Alf Maskan',
      desc: meta.desc || '',
      bodyClass: meta.bodyClass || '',
      skip: meta.skip || (meta.lang === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content'),
      // Extra Google Fonts for one page, as a raw css2 query string:
      //   fonts: family=Newsreader:opsz,wght@6..72,400;6..72,600
      // The storefront uses a serif the dashboard never loads.
      fonts: meta.fonts
        ? `<link href="https://fonts.googleapis.com/css2?${meta.fonts}&display=swap" rel="stylesheet">`
        : '',
      // Per-page assets: `css: dashboard` / `js: dashboard` in front matter.
      extraCss: (meta.css || '')
        .split(',').map((s) => s.trim()).filter(Boolean)
        .map((n) => `<link rel="stylesheet" href="${base}assets/css/${n}.css">`)
        .join('\n'),
      extraJs: (meta.js || '')
        .split(',').map((s) => s.trim()).filter(Boolean)
        .map((n) => `<script src="${base}assets/js/${n}.js" defer></script>`)
        .join('\n'),
      // Applies the stored theme before first paint so dark mode never flashes white.
      headScript: meta.theme === 'yes'
        ? `<script>try{var t=localStorage.getItem('am-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.dataset.theme='dark';}catch(e){}</script>`
        : '',
      content: body,
    };

    let html = fillVars(expandPartials(layout, partials), vars);
    // Page bodies may include partials and vars of their own.
    html = fillVars(expandPartials(html, partials), vars);

    // Mark the nav link for this page as current, statically — no JS needed.
    // Marketing nav keys on data-page, the dashboard rail on data-app-page.
    if (vars.nav) {
      html = html.replace(
        new RegExp(`(<a class="nav-link"[^>]*data-page="${vars.nav}")`, 'g'),
        '$1 aria-current="page"'
      );
      html = html.replace(
        new RegExp(`(<(?:a|summary) class="nav-item"[^>]*data-app-page="${vars.nav}")`, 'g'),
        '$1 aria-current="page"'
      );
      // The phone tab bar marks its own current destination.
      html = html.replace(
        new RegExp(`(<a class="tabbar__i"[^>]*data-tab-page="${vars.nav}")`, 'g'),
        '$1 aria-current="page"'
      );
      // A rail group stays open when the current page lives inside it.
      html = html.replace(
        new RegExp(`(<details class="nav-group" data-app-group="${vars.nav}")`, 'g'),
        '$1 open'
      );
    }

    const out = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }

  copyDir(ASSETS, path.join(DIST, 'assets'));
  console.log(`built ${pages.length} pages -> dist/ in ${Date.now() - started}ms`);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// PORT env var wins, then --port=N, then the default. Lets two copies of the
// dev server run side by side without editing this file.
function resolvePort() {
  const flag = process.argv.find((a) => a.startsWith('--port='));
  return Number(process.env.PORT) || (flag && Number(flag.slice(7))) || 4321;
}

function serve(port = resolvePort()) {
  http
    .createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      if (!path.extname(rel)) rel += '.html';
      const file = path.join(DIST, path.normalize(rel).replace(/^([/\\])+/, ''));
      if (!file.startsWith(DIST) || !fs.existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('404');
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, '127.0.0.1', () => console.log(`serving dist/ on http://127.0.0.1:${port}`));
}

function watch() {
  let timer = null;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error('build failed:', err.message);
      }
    }, 60);
  };
  for (const dir of [SRC, ASSETS]) fs.watch(dir, { recursive: true }, rebuild);
  console.log('watching src/ and assets/');
}

build();
if (process.argv.includes('--watch') || process.argv.includes('--serve')) watch();
if (process.argv.includes('--serve')) serve();
