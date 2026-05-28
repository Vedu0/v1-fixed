// api/_cors.js — CORS + preflight helper used by every handler
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

function handlePreflight(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

module.exports = { cors, handlePreflight };
