// api/remove-product.js
// POST /api/remove-product
// body: { containerId, productName?, quantity? }

const { handlePreflight } = require('./_cors');
const { getById, updateContainer, appendLog } = require('./_store');

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

  if (container.quantity <= 0)
    return res.status(400).json({ error: 'Container is already empty' });

  const newQty = Math.max(0, container.quantity - qty);
  const updated = updateContainer(containerId, { quantity: newQty });

  appendLog(containerId, {
    type: 'REMOVE',
    productName,
    quantity: qty,
    newTotal: newQty,
    source: 'manual',
  });

  return res.status(200).json({ success: true, container: updated });
};
