// api/logs.js
// GET /api/logs                → all logs across all containers (last 100)
// GET /api/logs?id=c1          → logs for a specific container

const { handlePreflight } = require('./_cors');
const { getAllLogs, getById } = require('./_store');

module.exports = function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  if (id) {
    const container = getById(id);
    if (!container)
      return res.status(404).json({ error: 'Container not found' });
    return res.status(200).json({
      success: true,
      containerId: id,
      logs: container.logs.slice().reverse(),
    });
  }

  return res.status(200).json({
    success: true,
    logs: getAllLogs(),
  });
};
