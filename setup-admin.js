const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const readline = require('node:readline/promises');
const scrypt = promisify(crypto.scrypt);
const file = path.join(__dirname, 'data', 'store.json');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const inputLines = rl[Symbol.asyncIterator]();
async function ask(prompt) { process.stdout.write(prompt); const result = await inputLines.next(); if (result.done) throw new Error('A entrada foi encerrada antes do fim da configuração.'); return result.value; }
const clean = (v, n=254) => String(v || '').trim().slice(0,n);
(async () => {
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    let store;
    try { store = JSON.parse(await fs.readFile(file, 'utf8')); }
    catch { store = { users: [], workouts: [], logs: [] }; }
    if (store.users.some(u => u.role === 'admin')) {
      console.log('\nJá existe uma conta administradora. Por segurança, este assistente não cria outro administrador.\n');
      process.exitCode = 1; return;
    }
    console.log('\n=== Configuração inicial do Mogger Gym ===');
    console.log('Crie a conta privada que administrará os usuários. Não compartilhe essa senha.\n');
    const name = clean(await ask('Seu nome: '), 80);
    const email = clean(await ask('Seu e-mail: ')).toLowerCase();
    const password = await ask('Crie uma senha (mínimo 10 caracteres): ');
    const confirmation = await ask('Repita a senha: ');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Nome e e-mail válido são obrigatórios.');
    if (password.length < 10) throw new Error('A senha precisa ter pelo menos 10 caracteres.');
    if (password !== confirmation) throw new Error('As senhas não coincidem.');
    if (store.users.some(u => u.email === email)) throw new Error('Já existe uma conta com esse e-mail.');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    store.users.push({ id: crypto.randomUUID(), name, email, salt, passwordHash, role: 'admin', active: true, createdAt: new Date().toISOString() });
    await fs.writeFile(file + '.tmp', JSON.stringify(store, null, 2));
    await fs.rename(file + '.tmp', file);
    console.log('\nAdministrador criado com sucesso. Agora execute: npm start');
    console.log('Abra http://localhost:3000 para entrar no Mogger Gym.\n');
  } catch (err) {
    console.error('\nNão foi possível concluir: ' + err.message + '\n');
    process.exitCode = 1;
  } finally { rl.close(); }
})();
