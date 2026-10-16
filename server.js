const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

// Carregamento simples de arquivo .env sem dependências externas
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (key && !process.env[key]) process.env[key] = val;
      }
    });
  }
} catch (e) { /* continua com process.env padrão */ }

const IS_VERCEL = Boolean(process.env.VERCEL);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = IS_VERCEL ? path.join(os.tmpdir(), 'mogger-data') : path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;
const sessions = new Map();
const loginAttempts = new Map();
let memoryStore = { users: [], workouts: [], logs: [] };

async function ensureStore() {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    try { await fsp.access(STORE_FILE); }
    catch { await fsp.writeFile(STORE_FILE, JSON.stringify({ users: [], workouts: [], logs: [] }, null, 2)); }
  } catch (err) {
    console.warn('Armazenamento em disco indisponível, usando fallback em memória:', err.message);
  }
}
async function getStore() {
  await ensureStore();
  try {
    return JSON.parse(await fsp.readFile(STORE_FILE, 'utf8'));
  } catch {
    return memoryStore;
  }
}
async function saveStore(store) {
  memoryStore = store;
  try {
    const temp = STORE_FILE + '.tmp';
    await fsp.writeFile(temp, JSON.stringify(store, null, 2));
    await fsp.rename(temp, STORE_FILE);
  } catch (err) {
    console.warn('Falha ao persistir em disco, dados mantidos em memória:', err.message);
  }
}
function id() { return crypto.randomUUID(); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return scrypt(password, salt, 64).then(buf => ({ salt, passwordHash: buf.toString('hex') }));
}
async function verifyPassword(password, user) {
  const derived = await scrypt(password, user.salt, 64);
  const expected = Buffer.from(user.passwordHash, 'hex');
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}
function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, createdAt: user.createdAt };
}
function json(res, status, data, extraHeaders = {}) {
  const output = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', ...extraHeaders });
  res.end(output);
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(pair => {
    const i = pair.indexOf('=');
    if (i > -1) out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}
function cookieHeader(token, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `mogger_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}
async function currentUser(req, store) {
  const token = cookies(req).mogger_session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { sessions.delete(token); return null; }
  const user = store.users.find(u => u.id === session.userId && u.active);
  if (!user) { sessions.delete(token); return null; }
  session.expiresAt = Date.now() + SESSION_TTL;
  return user;
}
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1_000_000) { reject(Object.assign(new Error('Corpo da requisição muito grande.'), { status: 413 })); req.destroy(); }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { reject(Object.assign(new Error('JSON inválido.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function clean(value, max = 120) { return String(value ?? '').trim().slice(0, max); }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
function isAdmin(user) { return user?.role === 'admin'; }
function requireAuth(user) { if (!user) throw Object.assign(new Error('Faça login para continuar.'), { status: 401 }); }
function requireAdmin(user) { requireAuth(user); if (!isAdmin(user)) throw Object.assign(new Error('Apenas o administrador pode executar esta ação.'), { status: 403 }); }
function logWorkout(store, userId) { return store.workouts.filter(w => w.userId === userId); }

async function routeApi(req, res, url) {
  const method = req.method || 'GET';
  const pathname = url.pathname;
  const store = await getStore();
  const user = await currentUser(req, store);
  try {
    if (pathname === '/api/health' && method === 'GET') {
      return json(res, 200, { ok: true, administratorConfigured: store.users.some(u => u.role === 'admin') });
    }
    if (pathname === '/api/config/supabase' && method === 'GET') {
      return json(res, 200, {
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
      });
    }
    if (pathname === '/api/auth/login' && method === 'POST') {
      const ip = req.socket.remoteAddress || 'unknown';
      const attempt = loginAttempts.get(ip) || { count: 0, since: Date.now() };
      if (Date.now() - attempt.since > 10 * 60 * 1000) { attempt.count = 0; attempt.since = Date.now(); }
      if (attempt.count >= 8) return json(res, 429, { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
      const body = await readBody(req);
      const email = clean(body.email, 254).toLowerCase();
      const password = String(body.password || '');
      const found = store.users.find(u => u.email === email);
      if (!found || !found.active || !(await verifyPassword(password, found))) {
        attempt.count += 1; loginAttempts.set(ip, attempt);
        return json(res, 401, { error: 'E-mail ou senha incorretos, ou conta desativada.' });
      }
      loginAttempts.delete(ip);
      const token = crypto.randomBytes(32).toString('base64url');
      sessions.set(token, { userId: found.id, expiresAt: Date.now() + SESSION_TTL });
      return json(res, 200, { user: safeUser(found) }, { 'Set-Cookie': cookieHeader(token) });
    }
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const token = cookies(req).mogger_session;
      if (token) sessions.delete(token);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
    }
    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!user) return json(res, 200, { user: null });
      return json(res, 200, { user: safeUser(user) });
    }

    requireAuth(user);

    if (pathname === '/api/workouts' && method === 'GET') {
      const ownerId = isAdmin(user) && url.searchParams.get('userId') ? url.searchParams.get('userId') : user.id;
      return json(res, 200, { workouts: logWorkout(store, ownerId).sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')) });
    }
    if (pathname === '/api/workouts' && method === 'POST') {
      const body = await readBody(req);
      const title = clean(body.title, 80);
      if (!title) return json(res, 400, { error: 'Dê um nome ao treino.' });
      const exercises = Array.isArray(body.exercises) ? body.exercises.slice(0, 80).map(e => ({
        id: clean(e.id, 80), name: clean(e.name, 160), gif: clean(e.gif, 400), bodyParts: Array.isArray(e.bodyParts) ? e.bodyParts.slice(0, 4).map(x=>clean(x,50)) : [],
        targetMuscles: Array.isArray(e.targetMuscles) ? e.targetMuscles.slice(0, 4).map(x=>clean(x,50)) : [], equipment: Array.isArray(e.equipment) ? e.equipment.slice(0,4).map(x=>clean(x,50)) : [],
        sets: Math.max(1, Math.min(20, Number(e.sets) || 3)), reps: clean(e.reps || '8–12', 20), rest: Math.max(0, Math.min(600, Number(e.rest) || 90))
      })) : [];
      const workout = { id: id(), userId: user.id, title, focus: clean(body.focus || 'Hipertrofia', 80), days: Math.max(1, Math.min(7, Number(body.days) || 4)), notes: clean(body.notes, 1200), exercises, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      store.workouts.push(workout); await saveStore(store);
      return json(res, 201, { workout });
    }
    const workoutRoute = pathname.match(/^\/api\/workouts\/([\w-]+)(?:\/(complete))?$/);
    if (workoutRoute) {
      const workout = store.workouts.find(w => w.id === workoutRoute[1]);
      if (!workout || (workout.userId !== user.id && !isAdmin(user))) return json(res, 404, { error: 'Treino não encontrado.' });
      if (workoutRoute[2] === 'complete' && method === 'POST') {
        const body = await readBody(req);
        const log = { id: id(), userId: workout.userId, workoutId: workout.id, workoutTitle: workout.title, completedAt: new Date().toISOString(), durationMinutes: Math.max(1, Math.min(600, Number(body.durationMinutes) || 45)), note: clean(body.note, 500), exercisesCompleted: Math.max(0, Math.min(100, Number(body.exercisesCompleted) || workout.exercises.length) ) };
        store.logs.push(log); await saveStore(store);
        return json(res, 201, { log });
      }
      if (method === 'PUT') {
        const body = await readBody(req);
        workout.title = clean(body.title || workout.title, 80);
        workout.focus = clean(body.focus || workout.focus, 80);
        workout.days = Math.max(1, Math.min(7, Number(body.days) || workout.days));
        workout.notes = clean(body.notes ?? workout.notes, 1200);
        if (Array.isArray(body.exercises)) workout.exercises = body.exercises.slice(0, 80).map(e => ({
          id: clean(e.id, 80), name: clean(e.name, 160), gif: clean(e.gif, 400), bodyParts: Array.isArray(e.bodyParts) ? e.bodyParts.slice(0,4).map(x=>clean(x,50)) : [], targetMuscles: Array.isArray(e.targetMuscles) ? e.targetMuscles.slice(0,4).map(x=>clean(x,50)) : [], equipment: Array.isArray(e.equipment) ? e.equipment.slice(0,4).map(x=>clean(x,50)) : [], sets: Math.max(1, Math.min(20, Number(e.sets) || 3)), reps: clean(e.reps || '8–12', 20), rest: Math.max(0, Math.min(600, Number(e.rest) || 90))
        }));
        workout.updatedAt = new Date().toISOString(); await saveStore(store);
        return json(res, 200, { workout });
      }
      if (method === 'DELETE') {
        store.workouts = store.workouts.filter(w => w.id !== workout.id);
        store.logs = store.logs.filter(l => l.workoutId !== workout.id);
        await saveStore(store); return json(res, 200, { ok: true });
      }
    }
    if (pathname === '/api/logs' && method === 'GET') {
      const logs = store.logs.filter(l => l.userId === user.id).sort((a,b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 100);
      return json(res, 200, { logs });
    }
    if (pathname === '/api/stats' && method === 'GET') {
      const ownWorkouts = store.workouts.filter(w => w.userId === user.id);
      const ownLogs = store.logs.filter(l => l.userId === user.id);
      const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); weekStart.setHours(0,0,0,0);
      const weekLogs = ownLogs.filter(l => new Date(l.completedAt) >= weekStart);
      const recent = ownLogs.filter(l => Date.now() - new Date(l.completedAt).getTime() < 30 * 24 * 3600 * 1000);
      return json(res, 200, { workoutCount: ownWorkouts.length, completedCount: ownLogs.length, weekCount: weekLogs.length, recentCount: recent.length, minutes: ownLogs.reduce((s,l)=>s+(l.durationMinutes||0),0), lastWorkout: ownLogs.sort((a,b)=>b.completedAt.localeCompare(a.completedAt))[0] || null });
    }
    if (pathname === '/api/admin/users' && method === 'GET') {
      requireAdmin(user);
      const members = store.users.map(u => ({ ...safeUser(u), workoutCount: store.workouts.filter(w=>w.userId===u.id).length, completedCount: store.logs.filter(l=>l.userId===u.id).length })).sort((a,b) => (a.role === 'admin' ? -1 : 1));
      return json(res, 200, { users: members });
    }
    if (pathname === '/api/admin/users' && method === 'POST') {
      requireAdmin(user);
      const body = await readBody(req);
      const name = clean(body.name, 80), email = clean(body.email, 254).toLowerCase(), password = String(body.password || '');
      if (!name || !validEmail(email) || password.length < 10) return json(res, 400, { error: 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.' });
      if (store.users.some(u => u.email === email)) return json(res, 409, { error: 'Já existe uma conta com esse e-mail.' });
      const hashed = await hashPassword(password);
      const created = { id: id(), name, email, ...hashed, role: 'member', active: true, createdAt: new Date().toISOString() };
      store.users.push(created); await saveStore(store);
      return json(res, 201, { user: safeUser(created) });
    }
    const userRoute = pathname.match(/^\/api\/admin\/users\/([\w-]+)$/);
    if (userRoute && ['PATCH','DELETE'].includes(method)) {
      requireAdmin(user);
      const target = store.users.find(u => u.id === userRoute[1]);
      if (!target) return json(res, 404, { error: 'Usuário não encontrado.' });
      if (target.id === user.id && method === 'DELETE') return json(res, 400, { error: 'Você não pode excluir sua própria conta de administrador.' });
      if (method === 'PATCH') {
        const body = await readBody(req);
        if (typeof body.active === 'boolean') {
          if (target.role === 'admin' && !body.active) return json(res, 400, { error: 'A conta administradora principal não pode ser desativada por aqui.' });
          target.active = body.active;
          if (!body.active) for (const [token, sess] of sessions.entries()) if (sess.userId === target.id) sessions.delete(token);
        }
        if (body.name) target.name = clean(body.name, 80);
        if (body.password) {
          const password = String(body.password);
          if (password.length < 10) return json(res, 400, { error: 'A nova senha precisa ter pelo menos 10 caracteres.' });
          const hashed = await hashPassword(password); target.salt = hashed.salt; target.passwordHash = hashed.passwordHash;
          for (const [token, sess] of sessions.entries()) if (sess.userId === target.id) sessions.delete(token);
        }
        await saveStore(store); return json(res, 200, { user: safeUser(target) });
      }
      if (method === 'DELETE') {
        store.users = store.users.filter(u => u.id !== target.id);
        store.workouts = store.workouts.filter(w => w.userId !== target.id);
        store.logs = store.logs.filter(l => l.userId !== target.id);
        for (const [token, sess] of sessions.entries()) if (sess.userId === target.id) sessions.delete(token);
        await saveStore(store); return json(res, 200, { ok: true });
      }
    }
    return json(res, 404, { error: 'Rota não encontrada.' });
  } catch (err) {
    return json(res, err.status || 500, { error: err.status ? err.message : 'Erro interno. Tente novamente.' });
  }
}
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.json':'application/json; charset=utf-8', '.ico':'image/x-icon' };
async function serveStatic(req, res, url) {
  let requestPath = decodeURIComponent(url.pathname);
  if (requestPath === '/') requestPath = '/index.html';
  const resolved = path.resolve(PUBLIC, '.' + requestPath);
  if (!resolved.startsWith(PUBLIC + path.sep) && resolved !== path.join(PUBLIC, 'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }
  try {
    const stat = await fsp.stat(resolved);
    if (!stat.isFile()) throw new Error('not file');
    res.writeHead(200, { 'Content-Type': mime[path.extname(resolved)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin', 'Cache-Control': path.extname(resolved) === '.html' ? 'no-cache' : 'public, max-age=3600' });
    fs.createReadStream(resolved).pipe(res);
  } catch {
    if (!path.extname(requestPath)) {
      const index = await fsp.readFile(path.join(PUBLIC, 'index.html'));
      res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-cache' }); return res.end(index);
    }
    res.writeHead(404); res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return routeApi(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end('Method not allowed'); }
  return serveStatic(req, res, url);
});

module.exports = server;
module.exports.server = server;
module.exports.routeApi = routeApi;
module.exports.serveStatic = serveStatic;

if (require.main === module && !IS_VERCEL) {
  ensureStore().then(() => server.listen(PORT, HOST, () => {
    console.log('\n  MOGGER GYM');
    console.log(`  Aplicativo: http://localhost:${PORT}`);
    console.log('  Para criar o administrador inicial: npm run setup-admin');
    console.log('  Ctrl+C para encerrar.\n');
  })).catch(err => { console.error('Falha ao iniciar:', err); process.exit(1); });
}
