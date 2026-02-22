#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = process.cwd();
const apiSrcDir = path.join(repoRoot, 'apps', 'api', 'src');
const entryFile = path.join(apiSrcDir, 'main.js');

const starter = `const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'api' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not Found' }));
});

server.listen(4000, () => {
  console.log('[api] listening on :4000');
});
`;

if (!fs.existsSync(apiSrcDir)) {
  fs.mkdirSync(apiSrcDir, { recursive: true });
}

if (!fs.existsSync(entryFile)) {
  fs.writeFileSync(entryFile, starter);
  console.log('[api-dev] apps/api/src/main.js was missing. Created a starter API file automatically.');
}

const child = spawn(process.execPath, [entryFile], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
