import { readFile, stat, writeFile, mkdir } from 'fs/promises';
import { join, dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function readFileAsync(path: string): Promise<string> {
  return await readFile(path, 'utf-8');
}

export async function writeFileAsync(path: string, content: string): Promise<void> {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  await writeFile(path, content, 'utf-8');
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function resolvePath(from: string, to: string): string {
  return resolve(dirname(from), to);
}

export function getFileName(path: string): string {
  const name = resolve(path).split('/').pop() || 'output';
  const ext = extname(name);
  return ext ? name.slice(0, -ext.length) : name;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
