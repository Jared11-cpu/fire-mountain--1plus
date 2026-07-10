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
  `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    if (!url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return assetResponse;
  }
};
`,
);
