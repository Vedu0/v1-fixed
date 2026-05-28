// api/rfid.js
// POST /api/rfid  — called by ESP32
// body: { uid, containerId?, action? }
//
// Logic:
//   1. If uid is registered in rfidMap → use mapped containerId + action
//   2. Else if containerId provided → toggle ADD/REMOVE based on current state
//   3. Else → register uid to first available container
//
// Optional API key auth: set API_SECRET env var in Vercel dashboard.
// ESP32 must send header: x-api-key: <your-secret>

const { handlePreflight } = require('./_cors');
const {
  getById, updateContainer, appendLog,
  getRfidMap, setRfidMap,
} = require('./_store');

module.exports = function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  // Optional API key guard
  const secret = process.env.API_SECRET;
  if (secret) {
    const key = req.headers['x-api-key'];
    if (key !== secret)
      return res.status(401).json({ error: 'Unauthorized' });
  }

  const { uid, containerId, action } = req.body || {};

  if (!uid || typeof uid !== 'string' || uid.trim() === '')
    return res.status(400).json({ error: 'uid required' });

  const cleanUid = uid.trim().toUpperCase();
  const rfidMap = getRfidMap();

  // Resolve target container
  let targetId = containerId;
  let targetAction = action;

  if (rfidMap[cleanUid]) {
    targetId     = rfidMap[cleanUid].containerId;
    targetAction = rfidMap[cleanUid].action || 'toggle';
  }

  if (!targetId) {
    return res.status(400).json({
      error: 'containerId required for unregistered tag',
      uid: cleanUid,
    });
  }

  const container = getById(targetId);
  if (!container)
    return res.status(404).json({ error: 'Container not found' });

  // Register tag if new
  if (!rfidMap[cleanUid]) {
    setRfidMap(cleanUid, { containerId: targetId, action: targetAction || 'toggle' });
  }

  // Determine actual action
  let resolvedAction = targetAction;
  if (!resolvedAction || resolvedAction === 'toggle') {
    resolvedAction = container.quantity > 0 ? 'remove' : 'add';
  }

  // Apply change
  let newQty = container.quantity;
  if (resolvedAction === 'add') {
    newQty = Math.min(container.quantity + 1, container.capacity);
  } else if (resolvedAction === 'remove') {
    newQty = Math.max(0, container.quantity - 1);
  }

  const updated = updateContainer(targetId, { quantity: newQty });

  appendLog(targetId, {
    type: resolvedAction.toUpperCase(),
    productName: 'RFID Item',
    quantity: 1,
    newTotal: newQty,
    source: 'rfid',
    uid: cleanUid,
  });

  return res.status(200).json({
    success: true,
    uid: cleanUid,
    action: resolvedAction,
    container: updated,
  });
};
