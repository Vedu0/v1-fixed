// api/add-product.js
// POST /api/add-product
// body: { containerId, productName?, quantity? }

const { handlePreflight } = require('./_cors');
const { getById, updateContainer, appendLog, getStatus } = require('./_store');

module.exports = function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { containerId, productName = 'Item', quantity = 1 } = req.body || {};

  if (!containerId)
    return res.status(400).json({ error: 'containerId required' });

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const container = getById(containerId);
  if (!container)
    return res.status(404).json({ error: 'Container not found' });

  const newQty = Math.min(container.quantity + qty, container.capacity);
  const updated = updateContainer(containerId, { quantity: newQty });

  appendLog(containerId, {
    type: 'ADD',
    productName,
    quantity: qty,
    newTotal: newQty,
    source: 'manual',
  });

  return res.status(200).json({ success: true, container: updated });
};
