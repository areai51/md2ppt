import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { watch } from 'chokidar';
import path from 'path';
import { readFileAsync, fileExists, getFileName } from './utils.js';
import { Converter } from './converter.js';
import { PPTGenerator } from './ppt-generator.js';
import { MD2PPTConfig, DEFAULT_CONFIG } from './types.js';

interface DevServerOptions {
  input: string;
  port?: number;
  config?: string;
}

export async function startDevServer(options: DevServerOptions) {
  const port = options.port || 3456;
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  let config: MD2PPTConfig = { ...DEFAULT_CONFIG };
  let clients: WebSocket[] = [];

  const inputFile = path.resolve(options.input);
  const inputDir = path.dirname(inputFile);
  const inputBaseName = getFileName(inputFile);

  if (options.config && await fileExists(options.config)) {
    const configModule = await import(path.resolve(process.cwd(), options.config));
    const userConfig = configModule.default || configModule;
    Object.assign(config, userConfig);
  }

  async function renderSlides(): Promise<string> {
    if (!(await fileExists(options.input))) {
      return '<p style="color: red; padding: 2rem;">Input file not found</p>';
    }

    const markdown = await readFileAsync(options.input);
    const converter = new Converter();
    const { slides, frontMatter } = await converter.convertFile(options.input);

    const title = frontMatter.title || config.title || 'Presentation';

    return buildPresentationHTML(title, slides, config);
  }

  function buildPresentationHTML(title: string, slides: any[], config: MD2PPTConfig): string {
    const slideWidth = config.slideWidth || 10;
    const slideHeight = config.slideHeight || 7.5;
    const ratio = (slideWidth / slideHeight) * 100;

    const titleFont = config.titleFont || {};
    const bodyFont = config.bodyFont || {};

    const slidesHTML = slides.map((s: any, idx: number) => {
      const layoutClass = `slide slide-${s.layout || 'content'}`;
      const titleHTML = s.title
        ? `<h2 class="slide-title">${escapeHtml(s.title)}</h2>`
        : '';
      const contentHTML = s.content
        ? `<div class="slide-content">${s.content}</div>`
        : '';

      return `
        <section class="${layoutClass}" data-index="${idx}" style="padding: ${s.layout === 'title' ? '10%' : '5%'};">
          ${titleHTML}
          ${contentHTML}
        </section>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --title-color: ${titleFont.color || '#333333'};
      --body-color: ${bodyFont.color || '#444444'};
      --bg-color: ${config.backgroundColor || '#FFFFFF'};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: #111;
      font-family: ${bodyFont.name || 'Arial'}, sans-serif;
      overflow: hidden;
    }
    .deck {
      width: 100vw; height: 100vh;
      display: flex; align-items: center; justify-content: center;
    }
    .slides-container {
      width: ${ratio}vh; height: 100vh;
      max-width: 100vw; max-height: 100vw / (${ratio}/100);
      position: relative;
      background: white;
      box-shadow: 0 4px 30px rgba(0,0,0,0.6);
    }
    .slide {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      padding: 3rem;
      display: flex; flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: left;
    }
    .slide[data-layout="title"], .slide[data-layout="section"] {
      justify-content: center;
      text-align: center;
    }
    .slide-title {
      font-size: ${(titleFont.size || 32) / (slideWidth/10)}rem;
      color: var(--title-color);
      font-weight: ${titleFont.bold ? 'bold' : 'normal'};
      margin-bottom: 2rem;
    }
    .slide-content {
      font-size: ${(bodyFont.size || 18) / (slideWidth/10)}rem;
      color: var(--body-color);
      width: 100%; line-height: 1.5;
    }
    .controls {
      position: fixed; bottom: 20px; right: 20px;
      display: flex; gap: 10px; z-index: 1000;
    }
    button {
      background: #333; color: white; border: none; padding: 10px 16px;
      border-radius: 6px; cursor: pointer; font-size: 14px;
    }
    button:hover { background: #555; }
    .slide-number {
      position: fixed; bottom: 10px; left: 10px;
      font-size: 12px; color: #aaa;
    }
  </style>
</head>
<body>
  <div class="deck">
    <div class="slides-container" id="slides">
      ${slidesHTML}
    </div>
  </div>
  <div class="controls">
    <button onclick="prev()">← Prev</button>
    <button onclick="next()">Next →</button>
    <button onclick="exportPPTX()">Export PPTX</button>
  </div>
  <div class="slide-number"><span id="current">1</span> / <span id="total">${slides.length}</span></div>

  <script>
    let current = 0;
    const total = ${slides.length};
    const slidesEls = document.querySelectorAll('.slide');

    function showSlide(idx) {
      current = idx; if (current < 0) current = 0; if (current >= total) current = total - 1;
      slidesEls.forEach((s, i) => s.style.display = i === current ? 'flex' : 'none');
      document.getElementById('current').textContent = current + 1;
    }

    function next() { showSlide(current + 1); }
    function prev() { showSlide(current - 1); }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });

    async function exportPPTX() {
      const btn = event.target; btn.disabled = true; btn.textContent = 'Exporting...';
      try {
        const res = await fetch('/api/export-pptx', { method: 'POST' });
        if (!res.ok) throw new Error('Failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'presentation.pptx';
        a.click(); URL.revokeObjectURL(url);
      } catch (e) {
        alert('Export failed: ' + e.message);
      } finally { btn.disabled = false; btn.textContent = 'Export PPTX'; }
    }

    showSlide(0);
  </script>
</body>
</html>`;
  }

  function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c] || c));
  }

  app.get('/', (_req: Request, res: Response) => {
    res.send(renderDevPage(port));
  });

  app.get('/api/slides', async (_req: Request, res: Response) => {
    if (!(await fileExists(options.input))) {
      return res.status(404).json({ error: 'Input file not found' });
    }
    const converter = new Converter();
    const { slides, frontMatter } = await converter.convertFile(options.input);
    res.json({ slides, frontMatter });
  });

  app.get('/api/render', async (_req: Request, res: Response) => {
    const html = await renderSlides();
    res.send(html);
  });

  app.post('/api/export-pptx', async (req: Request, res: Response) => {
    try {
      const converter = new Converter();
      const { slides, frontMatter } = await converter.convertFile(options.input);
      const outputPath = path.join(inputDir, `${inputBaseName}-dev.pptx`);
      const generator = new PPTGenerator(config);
      await generator.generate(slides, outputPath);
      res.download(outputPath);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate PPTX' });
    }
  });

  const watcher = watch([options.input], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100 }
  });

  watcher.on('change', () => {
    broadcast('reload');
  });

  function broadcast(type: string, data?: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  }

  wss.on('connection', (ws: WebSocket) => {
    clients.push(ws);
    ws.on('close', () => {
      clients = clients.filter(c => c !== ws);
    });
  });

  server.listen(port, () => {
    console.log(`\n  Dev server running at http://localhost:${port}`);
    console.log(`  Watching: ${options.input}\n`);
  });
}

function renderDevPage(port: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>md2ppt Dev Server</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; }
    .card { background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { font-size: 24px; margin-bottom: 10px; color: #f8fafc; }
    p { color: #94a3b8; margin-bottom: 20px; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .status { margin-top: 20px; font-size: 13px; color: #22c55e; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% {opacity:1;} 50% {opacity:0.5;} }
    iframe { border: none; width: 90vw; height: 80vh; margin-top: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div class="card">
    <h1>md2ppt Dev Server</h1>
    <p>Live preview of your presentation:</p>
    <iframe src="/api/render"></iframe>
    <div class="status"><span class="dot"></span> Server running on port ${port}</div>
  </div>
</body>
</html>`;
}
