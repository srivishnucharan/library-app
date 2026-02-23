const http = require('http');
const crypto = require('crypto');

const users = [];
const refreshSessions = new Map();

const authBasePath = '/api/v1/auth';
const catalogBasePath = '/api/v1/books';
const loansIssuePath = '/api/v1/loans/issue';
const loansReturnPath = '/api/v1/loans/return';
const myLoansPath = '/api/v1/me/loans';
const reservationsPath = '/api/v1/reservations';
const myReservationsPath = '/api/v1/me/reservations';

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

const copies = [
  { id: 'copy_1', bookId: 'book_1', status: 'AVAILABLE' },
  { id: 'copy_2', bookId: 'book_1', status: 'LOANED' },
  { id: 'copy_3', bookId: 'book_2', status: 'AVAILABLE' },
  { id: 'copy_4', bookId: 'book_3', status: 'AVAILABLE' },
];

const loans = [];
const reservations = [];

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

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toIsoDate(date) {
  return date.toISOString();
}

function statusOfLoan(loan) {
  if (loan.status === 'RETURNED') {
    return 'RETURNED';
  }
  const dueDate = parseDate(loan.dueDate);
  if (!dueDate) {
    return 'ACTIVE';
  }
  return dueDate.getTime() < Date.now() ? 'OVERDUE' : 'ACTIVE';
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

async function handleIssueLoan(req, res) {
  const body = await parseBody(req);
  const userId = String(body.userId || '').trim();
  const copyId = String(body.copyId || '').trim();
  const days = Number(body.days || 14);

  if (!userId || !copyId) {
    return json(res, 400, { message: 'userId and copyId are required' });
  }

  if (!Number.isFinite(days) || days <= 0 || days > 90) {
    return json(res, 400, { message: 'days must be between 1 and 90' });
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return json(res, 404, { message: 'User not found' });
  }

  const copy = copies.find((c) => c.id === copyId);
  if (!copy) {
    return json(res, 404, { message: 'Copy not found' });
  }

  if (copy.status !== 'AVAILABLE') {
    return json(res, 409, { message: 'Copy is not available' });
  }

  const now = new Date();
  const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const loan = {
    id: crypto.randomUUID(),
    userId,
    copyId,
    bookId: copy.bookId,
    issuedAt: toIsoDate(now),
    dueDate: toIsoDate(dueDate),
    returnedAt: null,
    status: 'ACTIVE',
  };

  loans.push(loan);
  copy.status = 'LOANED';

  return json(res, 201, { message: 'Loan issued', loan });
}

async function handleReturnLoan(req, res) {
  const body = await parseBody(req);
  const loanId = String(body.loanId || '').trim();

  if (!loanId) {
    return json(res, 400, { message: 'loanId is required' });
  }

  const loan = loans.find((item) => item.id === loanId);
  if (!loan) {
    return json(res, 404, { message: 'Loan not found' });
  }

  if (loan.status === 'RETURNED') {
    return json(res, 409, { message: 'Loan already returned' });
  }

  const copy = copies.find((c) => c.id === loan.copyId);
  if (copy) {
    copy.status = 'AVAILABLE';
  }

  loan.status = 'RETURNED';
  loan.returnedAt = toIsoDate(new Date());

  return json(res, 200, { message: 'Loan returned', loan });
}

function handleGetMyLoans(req, res, searchParams) {
  const userId = String(searchParams.get('userId') || '').trim();
  if (!userId) {
    return json(res, 400, { message: 'userId query param is required' });
  }

  const userLoans = loans
    .filter((loan) => loan.userId === userId)
    .map((loan) => ({
      ...loan,
      computedStatus: statusOfLoan(loan),
    }));

  return json(res, 200, {
    items: userLoans,
    total: userLoans.length,
  });
}

async function handleCreateReservation(req, res) {
  const body = await parseBody(req);
  const userId = String(body.userId || '').trim();
  const bookId = String(body.bookId || '').trim();
  const branchId = String(body.branchId || 'main').trim();

  if (!userId || !bookId) {
    return json(res, 400, { message: 'userId and bookId are required' });
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return json(res, 404, { message: 'User not found' });
  }

  const book = books.find((b) => b.id === bookId);
  if (!book) {
    return json(res, 404, { message: 'Book not found' });
  }

  const alreadyQueued = reservations.some(
    (r) => r.userId === userId && r.bookId === bookId && r.status !== 'CANCELLED'
  );
  if (alreadyQueued) {
    return json(res, 409, { message: 'Reservation already exists for this book' });
  }

  const hasAvailableCopy = copies.some((c) => c.bookId === bookId && c.status === 'AVAILABLE');
  const reservation = {
    id: crypto.randomUUID(),
    userId,
    bookId,
    branchId,
    status: hasAvailableCopy ? 'READY' : 'WAITING',
    createdAt: toIsoDate(new Date()),
  };

  reservations.push(reservation);
  return json(res, 201, { message: 'Reservation created', reservation });
}

function handleCancelReservation(req, res, reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId);
  if (!reservation) {
    return json(res, 404, { message: 'Reservation not found' });
  }

  if (reservation.status === 'CANCELLED') {
    return json(res, 409, { message: 'Reservation already cancelled' });
  }

  reservation.status = 'CANCELLED';
  reservation.cancelledAt = toIsoDate(new Date());

  return json(res, 200, { message: 'Reservation cancelled', reservation });
}

function handleGetMyReservations(req, res, searchParams) {
  const userId = String(searchParams.get('userId') || '').trim();
  if (!userId) {
    return json(res, 400, { message: 'userId query param is required' });
  }

  const userReservations = reservations.filter((r) => r.userId === userId);

  return json(res, 200, {
    items: userReservations,
    total: userReservations.length,
  });
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

    if (req.method === 'POST' && pathname === loansIssuePath) {
      return await handleIssueLoan(req, res);
    }

    if (req.method === 'POST' && pathname === loansReturnPath) {
      return await handleReturnLoan(req, res);
    }

    if (req.method === 'GET' && pathname === myLoansPath) {
      return handleGetMyLoans(req, res, parsedUrl.searchParams);
    }

    if (req.method === 'POST' && pathname === reservationsPath) {
      return await handleCreateReservation(req, res);
    }

    if (req.method === 'DELETE' && pathname.startsWith(`${reservationsPath}/`)) {
      const reservationId = pathname.replace(`${reservationsPath}/`, '').trim();
      return handleCancelReservation(req, res, reservationId);
    }

    if (req.method === 'GET' && pathname === myReservationsPath) {
      return handleGetMyReservations(req, res, parsedUrl.searchParams);
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
