const http = require('http');
const crypto = require('crypto');

const users = [];
const refreshSessions = new Map();

const authBasePath = '/api/v1/auth';
const catalogBasePath = '/api/v1/books';

const books = [
  {
    id: 'book_1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    isbn: '9780132350884',
    description: 'A handbook of agile software craftsmanship.',
    publishedYear: 2008,
    totalCopies: 4,
    availableCopies: 2,
  },
  {
    id: 'book_2',
    title: 'Design Patterns',
    author: 'Erich Gamma',
    category: 'Software Engineering',
    isbn: '9780201633610',
    description: 'Elements of reusable object-oriented software.',
    publishedYear: 1994,
    totalCopies: 3,
    availableCopies: 1,
  },
  {
    id: 'book_3',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self Development',
    isbn: '9780735211292',
    description: 'An easy and proven way to build good habits.',
    publishedYear: 2018,
    totalCopies: 5,
    availableCopies: 5,
  },
];

function json(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function createToken(prefix = 'token') {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
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

function handleGetBooks(req, res, searchParams) {
  const filtered = filterBooks(searchParams);
  return json(res, 200, {
    items: filtered,
    total: filtered.length,
  });
}

function handleGetBookById(req, res, bookId) {
  const book = books.find((item) => item.id === bookId);
  if (!book) {
    return json(res, 404, { message: 'Book not found' });
  }
  return json(res, 200, book);
}

async function handleRegister(req, res) {
  const body = await parseBody(req);
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || !password) {
    return json(res, 400, { message: 'name, email, and password are required' });
  }

  if (users.some((u) => u.email === email)) {
    return json(res, 409, { message: 'Email already registered' });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
    role: 'MEMBER',
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  return json(res, 201, {
    message: 'Registration successful',
    user: sanitizeUser(user),
  });
}

async function handleLogin(req, res) {
  const body = await parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return json(res, 400, { message: 'email and password are required' });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return json(res, 401, { message: 'Invalid credentials' });
  }

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.passwordHash !== passwordHash) {
    return json(res, 401, { message: 'Invalid credentials' });
  }

  const accessToken = createToken('access');
  const refreshToken = createToken('refresh');
  refreshSessions.set(refreshToken, { userId: user.id, issuedAt: Date.now() });

  return json(res, 200, {
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });
}

async function handleRefresh(req, res) {
  const body = await parseBody(req);
  const refreshToken = String(body.refreshToken || '');

  if (!refreshToken) {
    return json(res, 400, { message: 'refreshToken is required' });
  }

  const session = refreshSessions.get(refreshToken);
  if (!session) {
    return json(res, 401, { message: 'Invalid refresh token' });
  }

  refreshSessions.delete(refreshToken);
  const nextRefreshToken = createToken('refresh');
  refreshSessions.set(nextRefreshToken, { userId: session.userId, issuedAt: Date.now() });

  return json(res, 200, {
    accessToken: createToken('access'),
    refreshToken: nextRefreshToken,
  });
}

async function handleLogout(req, res) {
  const body = await parseBody(req);
  const refreshToken = String(body.refreshToken || '');

  if (!refreshToken) {
    return json(res, 400, { message: 'refreshToken is required' });
  }

  refreshSessions.delete(refreshToken);
  return json(res, 200, { message: 'Logout successful' });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && pathname === '/health') {
      return json(res, 200, { status: 'ok', service: 'api' });
    }

    if (req.method === 'GET' && pathname === catalogBasePath) {
      return handleGetBooks(req, res, parsedUrl.searchParams);
    }

    if (req.method === 'GET' && pathname.startsWith(`${catalogBasePath}/`)) {
      const bookId = pathname.replace(`${catalogBasePath}/`, '').trim();
      return handleGetBookById(req, res, bookId);
    }

    if (req.method === 'POST' && pathname === `${authBasePath}/register`) {
      return await handleRegister(req, res);
    }

    if (req.method === 'POST' && pathname === `${authBasePath}/login`) {
      return await handleLogin(req, res);
    }

    if (req.method === 'POST' && pathname === `${authBasePath}/refresh`) {
      return await handleRefresh(req, res);
    }

    if (req.method === 'POST' && pathname === `${authBasePath}/logout`) {
      return await handleLogout(req, res);
    }

    return json(res, 404, { message: 'Not Found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return json(res, 400, { message });
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`[api] listening on :${port}`);
});
