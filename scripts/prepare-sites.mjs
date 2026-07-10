import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const hostingPath = '.openai/hosting.json';

if (!existsSync(hostingPath)) {
  throw new Error('Missing .openai/hosting.json');
}

await mkdir('dist/.openai', { recursive: true });
await mkdir('dist/server', { recursive: true });
await copyFile(hostingPath, 'dist/.openai/hosting.json');

await writeFile(
  'dist/server/index.js',
  `import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const publicDir = resolve(process.cwd(), 'dist');
const indexHtml = join(publicDir, 'index.html');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function getFilePath(urlPath) {
  const cleanPath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\\\])+/, '');
  const filePath = resolve(publicDir, cleanPath || 'index.html');
  return filePath.startsWith(publicDir) ? filePath : indexHtml;
}

async function sendFile(res, filePath) {
  const fileStat = await stat(filePath);
  const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': fileStat.size,
    'Cache-Control': filePath.includes('/assets/') || filePath.includes('\\\\assets\\\\')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const filePath = getFilePath(req.url || '/');
    if (existsSync(filePath) && (await stat(filePath)).isFile()) {
      await sendFile(res, filePath);
      return;
    }

    const html = await readFile(indexHtml);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(html);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0');

export default server;
`,
);
