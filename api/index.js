const { routeApi } = require('../server.js');

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url, `${proto}://${host}`);

  if (!url.pathname.startsWith('/api/')) {
    url.pathname = '/api' + (url.pathname.startsWith('/') ? url.pathname : '/' + url.pathname);
  }

  try {
    return await routeApi(req, res, url);
  } catch (err) {
    res.statusCode = err.status || 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: err.message || 'Erro interno na API.' }));
  }
};
