import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { watch } from 'chokidar';
import { readdirSync, statSync } from 'fs';
import { readFileAsync, fileExists, getFileName } from './utils.js';
import { Converter } from './converter.js';
import { TemplateEngine } from './template-engine.js';
import { PDFGenerator } from './pdf-generator.js';
import path from 'path';
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
  let templates: string[] = [];

  const inputFile = path.resolve(options.input);
  const inputDir = path.dirname(inputFile);
  const inputBaseName = getFileName(inputFile);

  if (options.config && await fileExists(options.config)) {
    const configModule = await import(path.resolve(process.cwd(), options.config));
    const userConfig = configModule.default || configModule;
    Object.assign(config, userConfig);
  }

  const templatesDir = config.template ? path.dirname(config.template) : './templates';
  templates = await discoverTemplates(templatesDir);

  async function discoverTemplates(dir: string): Promise<string[]> {
    try {
      const results: string[] = [];
      const scanDir = (d: string) => {
        const entries = readdirSync(d);
        for (const entry of entries) {
          const fullPath = path.join(d, entry);
          if (statSync(fullPath).isDirectory()) {
            if (entry !== 'parts') scanDir(fullPath);
          } else if (entry.endsWith('.hbs')) {
            results.push(fullPath);
          }
        }
      };
      scanDir(dir);
      return results;
    } catch {
      return [];
    }
  }

  async function renderMarkdown(templatePath: string): Promise<string> {
    if (!(await fileExists(options.input))) {
      return '<p style="color: red;">Input file not found</p>';
    }

    const markdown = await readFileAsync(options.input);
    const converter = new Converter();
    const { html, frontMatter } = converter.convert(markdown);

    let styles = '';
    if (config.style && await fileExists(config.style)) {
      styles = await readFileAsync(config.style);
    }

    const engine = new TemplateEngine(config);
    if (templatePath && await fileExists(templatePath)) {
      await engine.loadTemplate(templatePath);
    } else {
      engine.loadDefaultTemplate();
    }

    return engine.render(html, frontMatter, styles);
  }

  function getTemplateList() {
    return templates.map(t => ({
      name: path.basename(t, '.hbs'),
      path: t
    }));
  }

  app.get('/', (_req: Request, res: Response) => {
    res.send(getDevHTML(port));
  });

  app.get('/api/templates', (_req: Request, res: Response) => {
    res.json(getTemplateList());
  });

  app.get('/api/render', async (req: Request, res: Response) => {
    const template = req.query.template as string;
    const html = await renderMarkdown(template);
    res.send(html);
  });

  app.get('/api/generate-pdf', async (req: Request, res: Response) => {
    try {
      const template = req.query.template as string;
      const html = await renderMarkdown(template);
      const templateInfo = templates.find(t => t === template);
      const templateName = templateInfo ? path.basename(templateInfo, '.hbs') : 'output';
      
      const outputPath = path.join(inputDir, `${inputBaseName}-${templateName}.pptx`);
      const generator = new PDFGenerator();
      await generator.generate(html, outputPath, config.pptxOptions);
      
      res.download(outputPath);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate PDF' });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    clients.push(ws);
    ws.on('close', () => {
      clients = clients.filter(c => c !== ws);
    });
  });

  function broadcast(type: string, data?: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  const watcher = watch([options.input, templatesDir], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100 }
  });

  watcher.on('change', async (filepath) => {
    if (filepath.endsWith('.hbs')) {
      templates = await discoverTemplates(templatesDir);
      broadcast('templates-updated', getTemplateList());
    }
    broadcast('reload');
  });

  server.listen(port, () => {
    console.log(`\n  Dev server running at http://localhost:${port}`);
    console.log(`  Watching: ${options.input}, ${templatesDir}/\n`);
  });
}

function getDevHTML(port: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>md2ppt - Dev Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      height: 100vh;
      display: flex;
      overflow: hidden;
      background: #0f172a;
      color: #e2e8f0;
    }
    .sidebar {
      width: 280px;
      background: #1e293b;
      border-right: 1px solid #334155;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #334155;
    }
    .sidebar-header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
    }
    .sidebar-header p {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .template-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .template-item {
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      font-size: 14px;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    .template-item:hover {
      background: #334155;
    }
    .template-item.active {
      background: #3b82f6;
      color: white;
      border-color: #60a5fa;
    }
    .preview-container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .preview-header {
      padding: 12px 20px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .preview-header span {
      font-size: 13px;
      color: #94a3b8;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .export-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .export-btn:hover {
      background: #2563eb;
    }
    .export-btn:disabled {
      background: #475569;
      cursor: not-allowed;
    }
    .export-btn svg {
      width: 16px;
      height: 16px;
    }
    .preview-frame {
      flex: 1;
      background: white;
      border: none;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #94a3b8;
      font-size: 14px;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      color: #e2e8f0;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      pointer-events: none;
      border: 1px solid #334155;
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    .toast .toast-dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
      animation: pulse 1s ease infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <div class="toast" id="toast"><span class="toast-dot"></span><span id="toastMsg">Reloading...</span></div>
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>md2ppt</h1>
      <p id="currentTemplate"><span style="color: #22c55e;">●</span> Watching for changes</p>
    </div>
    <div class="template-list" id="templateList"></div>
  </div>
  <div class="preview-container">
    <div class="preview-header">
      <span><span class="status-dot"></span>Live Preview</span>
      <button class="export-btn" id="exportBtn" onclick="exportPDF()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span id="btnText">Export PDF</span>
      </button>
    </div>
    <iframe class="preview-frame" id="previewFrame"></iframe>
  </div>
  <script>
    const templateList = document.getElementById('templateList');
    const previewFrame = document.getElementById('previewFrame');
    const currentTemplateEl = document.getElementById('currentTemplate');
    let templates = [];
    let activeTemplate = null;

    async function loadTemplates() {
      const res = await fetch('/api/templates');
      templates = await res.json();
      renderTemplateList();
      if (templates.length > 0 && !activeTemplate) {
        selectTemplate(templates[0].path);
      }
    }

    function renderTemplateList() {
      templateList.innerHTML = templates.map(t => \`
        <div class="template-item \${activeTemplate === t.path ? 'active' : ''}" data-path="\${t.path}">
          \${t.name}
        </div>
      \`).join('');

      templateList.querySelectorAll('.template-item').forEach(el => {
        el.addEventListener('click', () => selectTemplate(el.dataset.path));
      });
    }

    async function selectTemplate(path) {
      activeTemplate = path;
      const template = templates.find(t => t.path === path);
      if (template) currentTemplateEl.innerHTML = '<span style="color: #22c55e;">●</span> ' + template.name;
      renderTemplateList();
      await renderPreview();
    }

    async function renderPreview() {
      const res = await fetch('/api/render?template=' + encodeURIComponent(activeTemplate));
      const html = await res.text();
      previewFrame.srcdoc = html;
    }

    async function exportPDF() {
      const btn = document.getElementById('exportBtn');
      const btnText = document.getElementById('btnText');
      btn.disabled = true;
      btnText.textContent = 'Generating...';
      
      try {
        const res = await fetch('/api/generate-pdf?template=' + encodeURIComponent(activeTemplate));
        if (!res.ok) throw new Error('Failed to generate PDF');
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.pptx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Failed to generate PDF: ' + err.message);
      } finally {
        btn.disabled = false;
        btnText.textContent = 'Export PDF';
      }
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      toastMsg.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    const ws = new WebSocket('ws://localhost:${port}');
    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'reload') {
        showToast('File changed, reloading...');
        await renderPreview();
      }
      if (msg.type === 'templates-updated') {
        templates = msg.data;
        renderTemplateList();
        showToast('Templates updated');
      }
    };

    loadTemplates();
  </script>
</body>
</html>`;
}
