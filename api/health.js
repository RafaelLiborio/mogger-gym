const { routeApi } = require('../server.js');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  url.pathname = '/api/health';
  return routeApi(req, res, url);
};
