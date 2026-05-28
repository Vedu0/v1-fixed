// api/_store.js — central persistent state (files prefixed _ are NOT Vercel endpoints)
// Uses global in-process cache. Replace with Vercel KV for true multi-instance persistence.
// See README.md → "Upgrading to Persistent Storage" for instructions.

const DEFAULT_CONTAINERS = [
  { id: 'c1', name: 'Container A', quantity: 0, capacity: 50, logs: [] },
  { id: 'c2', name: 'Container B', quantity: 0, capacity: 50, logs: [] },
  { id: 'c3', name: 'Container C', quantity: 0, capacity: 50, logs: [] },
  { id: 'c4', name: 'Container D', quantity: 0, capacity: 50, logs: [] },
];

if (!global.__rfid_store) {
  global.__rfid_store = {
    containers: JSON.parse(JSON.stringify(DEFAULT_CONTAINERS)),
    rfidMap: {},
    lastUpdated: new Date().toISOString(),
  };
}

const store = global.__rfid_store;

function getStatus(quantity, capacity) {
  if (!capacity || capacity <= 0 || quantity <= 0) return 'EMPTY';
  const ratio = quantity / capacity;
  if (ratio >= 1)    return 'FULL';
  if (ratio <= 0.25) return 'LOW STOCK';
  return 'OK';
}

function getAll() {
  return store.containers.map(c => ({
    ...c,
    status: getStatus(c.quantity, c.capacity),
  }));
}

function getById(id) {
  const c = store.containers.find(c => c.id === id);
  if (!c) return null;
  return { ...c, status: getStatus(c.quantity, c.capacity) };
}

function updateContainer(id, patch) {
  const idx = store.containers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  store.containers[idx] = { ...store.containers[idx], ...patch };
  store.lastUpdated = new Date().toISOString();
  return getById(id);
}

function appendLog(id, entry) {
  const idx = store.containers.findIndex(c => c.id === id);
  if (idx === -1) return;
  const logs = store.containers[idx].logs;
  logs.push({ ...entry, timestamp: new Date().toISOString() });
  if (logs.length > 200) logs.splice(0, logs.length - 200);
}

function getAllLogs() {
  return store.containers
    .flatMap(c => c.logs.map(l => ({ ...l, containerName: c.name, containerId: c.id })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 100);
}

function setCapacity(id, capacity) {
  if (!Number.isFinite(capacity) || capacity < 1) return null;
  return updateContainer(id, { capacity: Math.floor(capacity) });
}

function getRfidMap() { return store.rfidMap; }
function setRfidMap(uid, data) { store.rfidMap[uid] = data; }
function getLastUpdated() { return store.lastUpdated; }

module.exports = {
  getStatus, getAll, getById, updateContainer,
  appendLog, getAllLogs, setCapacity,
  getRfidMap, setRfidMap, getLastUpdated,
};
