const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { randomBytes } = require('node:crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');
const { createStore } = require('./store');
const { seed, slugify } = require('./seed');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const configuredSecret = process.env.JWT_SECRET;
const JWT_SECRET = configuredSecret || randomBytes(48).toString('hex');
const FRONTEND = path.join(__dirname, '..', 'frontend');

app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

if (process.env.CORS_ORIGIN) {
  const allowedOrigins = new Set(process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean));
  app.use(cors({ origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  } }));
}

app.use(express.json({ limit: '5mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait and try again.' }
});

const htmlOptions = {
  allowedTags: [...new Set([...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2', 'h3', 'span', 'figure', 'figcaption', 'iframe'])],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    iframe: ['src', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'],
    '*': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  exclusiveFilter: (frame) => {
    if (frame.tag !== 'img') return false;
    const src = String(frame.attribs.src || '');
    if (src.startsWith('data:')) {
      return src.length > 650000 || !/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(src);
    }
    return !/^https?:\/\//i.test(src);
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'nofollow noopener noreferrer' }
    })
  }
};

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authOptional(req, _res, next) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return next();
  try {
    req.user = jwt.verify(authorization.slice(7), JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in first' });
    return next();
  });
}

function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  return input.map((tag) => String(tag).trim().slice(0, 32))
    .filter((tag) => {
      const normalized = tag.toLowerCase();
      if (!tag || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    }).slice(0, 8);
}

function sanitizeContent(value) {
  return sanitizeHtml(String(value || ''), htmlOptions);
}

const MAX_STORY_CONTENT_LENGTH = 3_000_000;

async function start() {
  if (isProduction) {
    if (!configuredSecret || configuredSecret.length < 32 || configuredSecret === 'change-this-to-a-long-random-string') {
      throw new Error('Production requires a unique JWT_SECRET with at least 32 characters.');
    }
    if (!process.env.MONGODB_URI || process.env.USE_JSON_STORE === '1') {
      throw new Error('Production requires MONGODB_URI so hosted data persists across restarts.');
    }
  } else if (!configuredSecret) {
    console.warn('JWT_SECRET is not set. A temporary random key will be used; local sessions reset when the server restarts.');
  }

  const store = await createStore();
  await store.ensureSeed(seed);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, storage: store.storageName });
  });

  app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Name must be between 2 and 80 characters' });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'Password must be 8 to 72 bytes long' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.createUser({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user), user });
  }));

  app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
    const body = req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = email && !email.endsWith('@datasphare.local') ? await store.findUserByEmail(email) : null;
    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const account = publicUser(user);
    res.json({ token: signToken(account), user: account });
  }));

  app.get('/api/auth/me', authRequired, asyncRoute(async (req, res) => {
    const user = await store.findUserById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    res.json({ user: publicUser(user) });
  }));

  app.delete('/api/auth/me', authRequired, asyncRoute(async (req, res) => {
    const password = String((req.body || {}).password || '');
    if (!password) return res.status(400).json({ error: 'Enter your password to delete this account' });
    const account = await store.findUserByEmail(req.user.email);
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      return res.status(403).json({ error: 'Password did not match' });
    }
    const deleted = await store.deleteAccount(account.id);
    if (!deleted) return res.status(404).json({ error: 'Account not found' });
    res.json({ ok: true });
  }));

  app.get('/api/posts', authOptional, asyncRoute(async (req, res) => {
    const tag = typeof req.query.tag === 'string' ? req.query.tag.slice(0, 32) : '';
    res.json({ posts: await store.listPosts({ tag, includePrivateFor: req.user?.id }) });
  }));

  app.get('/api/posts/:slug', authOptional, asyncRoute(async (req, res) => {
    const post = await store.getPostBySlug(req.params.slug, req.user?.id);
    if (!post) return res.status(404).json({ error: 'Story not found' });
    const comments = await store.listComments(post.id);
    res.json({ post, comments });
  }));

  app.post('/api/posts', authRequired, asyncRoute(async (req, res) => {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    if (typeof body.content !== 'string') return res.status(400).json({ error: 'Story content is required' });
    if (body.content.length > MAX_STORY_CONTENT_LENGTH) return res.status(413).json({ error: 'Story content is too large. Reduce image sizes and try again.' });
    const content = sanitizeContent(body.content);
    const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (title.length < 4 || title.length > 160) return res.status(400).json({ error: 'Title must be between 4 and 160 characters' });
    if (textOnly.length < 20) return res.status(400).json({ error: 'Write at least 20 characters before publishing' });
    const tags = normalizeTags(body.tags);
    const isPublic = body.isPublic !== false;
    const baseSlug = slugify(title) || `story-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (await store.slugExists(slug)) slug = `${baseSlug}-${suffix++}`;
    const post = await store.createPost({
      slug, title, excerpt: textOnly.slice(0, 180), content, tags, isPublic, authorId: req.user.id
    });
    res.status(201).json({ post });
  }));

  app.put('/api/posts/:id', authRequired, asyncRoute(async (req, res) => {
    const body = req.body || {};
    const changes = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 4 || title.length > 160) return res.status(400).json({ error: 'Title must be between 4 and 160 characters' });
      changes.title = title;
    }
    if (body.content !== undefined) {
      if (typeof body.content !== 'string') return res.status(400).json({ error: 'Story content must be text or formatted HTML' });
      if (body.content.length > MAX_STORY_CONTENT_LENGTH) return res.status(413).json({ error: 'Story content is too large. Reduce image sizes and try again.' });
      const content = sanitizeContent(body.content);
      const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (textOnly.length < 20) return res.status(400).json({ error: 'Write at least 20 characters before saving' });
      changes.content = content;
      changes.excerpt = textOnly.slice(0, 180);
    }
    if (body.tags !== undefined) changes.tags = normalizeTags(body.tags);
    if (body.isPublic !== undefined) {
      if (typeof body.isPublic !== 'boolean') return res.status(400).json({ error: 'isPublic must be true or false' });
      changes.isPublic = body.isPublic;
    }
    if (Object.keys(changes).length === 0) return res.status(400).json({ error: 'No supported changes supplied' });
    const post = await store.updatePost(req.params.id, req.user.id, changes);
    if (!post) return res.status(404).json({ error: 'Story not found' });
    res.json({ post });
  }));

  app.delete('/api/posts/:id', authRequired, asyncRoute(async (req, res) => {
    const deleted = await store.deletePost(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Story not found' });
    res.json({ ok: true });
  }));

  app.post('/api/posts/:id/like', authRequired, asyncRoute(async (req, res) => {
    const result = await store.toggleLike(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'Story not found' });
    res.json(result);
  }));

  app.post('/api/posts/:id/comments', authRequired, asyncRoute(async (req, res) => {
    const text = String((req.body || {}).text || '').trim();
    if (text.length < 2 || text.length > 2000) return res.status(400).json({ error: 'Comment must be between 2 and 2,000 characters' });
    const comment = await store.addComment({ postId: req.params.id, authorId: req.user.id, text });
    if (!comment) return res.status(404).json({ error: 'Story not found' });
    res.status(201).json({ comment });
  }));

  app.post('/api/users/:id/follow', authRequired, asyncRoute(async (req, res) => {
    const result = await store.toggleFollow(req.user.id, req.params.id);
    if (!result) return res.status(404).json({ error: 'Account not found' });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
  app.use(express.static(FRONTEND, { extensions: ['html'], fallthrough: true }));
  app.use((_req, res) => res.status(404).sendFile(path.join(FRONTEND, '404.html'), (error) => {
    if (error && !res.headersSent) res.status(404).type('text').send('Page not found');
  }));

  app.use((err, _req, res, _next) => {
    if (res.headersSent) return;
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    if (err.status === 409) return res.status(409).json({ error: err.message });
    if (err.code === 11000) return res.status(409).json({ error: 'That story title is already being saved. Please try again.' });
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  const server = app.listen(PORT, () => console.log(`DataSphare server listening on port ${PORT}`));
  const shutdown = () => server.close(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
    process.exit(0);
  });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error(`DataSphare could not start: ${error.message}`);
  process.exit(1);
});
