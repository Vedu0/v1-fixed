// api/inventory.js
// GET  /api/inventory          → list all containers
// POST /api/inventory          → update capacity for a container
//   body: { containerId, capacity }

const { handlePreflight } = require('./_cors');
const { getAll, setCapacity, getLastUpdated } = require('./_store');

module.exports = function handler(req, res) {
  if (handlePreflight(req, res)) return;

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      containers: getAll(),
      lastUpdated: getLastUpdated(),
    });
  }

  if (req.method === 'POST') {
    const { containerId, capacity } = req.body || {};
    if (!containerId) return res.status(400).json({ error: 'containerId required' });
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1)
      return res.status(400).json({ error: 'capacity must be a positive number' });

    const updated = setCapacity(containerId, cap);
    if (!updated) return res.status(404).json({ error: 'Container not found' });

    return res.status(200).json({ success: true, container: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
