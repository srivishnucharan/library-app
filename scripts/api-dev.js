#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = process.cwd();
const apiSrcDir = path.join(repoRoot, 'apps', 'api', 'src');
const entryFile = path.join(apiSrcDir, 'main.js');

const starter = `const http = require('http');

const catalogBasePath = '/api/v1/books';

const books = [
  {
    id: 'book_1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    availableCopies: 2,
  },
  {
    id: 'book_2',
    title: 'Design Patterns',
    author: 'Erich Gamma',
    category: 'Software Engineering',
    availableCopies: 1,
  },
];

function json(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBoolean(value) {
  if (value == null) return false;
  return String(value).toLowerCase() === 'true';
}

function filterBooks(searchParams) {
  const q = String(searchParams.get('q') || '').trim().toLowerCase();
  const author = String(searchParams.get('author') || '').trim().toLowerCase();
  const category = String(searchParams.get('category') || '').trim().toLowerCase();
  const availableOnly = parseBoolean(searchParams.get('availableOnly'));

  return books.filter((book) => {
    const matchesQ =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.category.toLowerCase().includes(q);

    const matchesAuthor = !author || book.author.toLowerCase().includes(author);
    const matchesCategory = !category || book.category.toLowerCase().includes(category);
    const matchesAvailability = !availableOnly || book.availableCopies > 0;

    return matchesQ && matchesAuthor && matchesCategory && matchesAvailability;
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET' && pathname === '/health') {
    return json(res, 200, { status: 'ok', service: 'api' });
  }

  if (req.method === 'GET' && pathname === catalogBasePath) {
    const items = filterBooks(parsedUrl.searchParams);
    return json(res, 200, { items, total: items.length });
  }

  if (req.method === 'GET' && pathname.startsWith(catalogBasePath + '/')) {
    const bookId = pathname.slice((catalogBasePath + '/').length);
    const book = books.find((item) => item.id === bookId);
    if (!book) {
      return json(res, 404, { message: 'Book not found' });
    }
    return json(res, 200, book);
  }

  return json(res, 404, { message: 'Not Found' });
});

server.listen(3000, () => {
  console.log('[api] listening on :3000');
});
`;

if (!fs.existsSync(apiSrcDir)) {
  fs.mkdirSync(apiSrcDir, { recursive: true });
}

if (!fs.existsSync(entryFile)) {
  fs.writeFileSync(entryFile, starter);
  console.log(
    '[api-dev] apps/api/src/main.js was missing. Created a starter API file automatically with /health and /api/v1/books endpoints.'
  );
}

const child = spawn(process.execPath, [entryFile], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
