// Offline weighing queue. Weighings captured without a connection are kept on
// the phone (localStorage) and replayed through POST /api/collector/sync.
const KEY = 'sm-weighing-queue';

export function readQueue() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeQueue(list) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full or blocked */
  }
  try {
    window.dispatchEvent(new CustomEvent('sm-weighing-queue'));
  } catch {
    /* old browsers */
  }
}

// One entry per pickup: a newer weighing replaces the queued one.
export function enqueue({ pickupId, weighedItems, rateChoice }) {
  const entry = {
    pickupId,
    // Photos can't be uploaded offline; only keep URLs that were already uploaded.
    weighedItems: weighedItems.map((w) => ({
      itemName: w.itemName,
      actualWeight: Number(w.actualWeight) || 0,
      ...(w.weighingPhoto ? { weighingPhoto: w.weighingPhoto } : {}),
    })),
    rateChoice,
    savedAt: new Date().toISOString(),
  };
  const list = readQueue().filter((e) => e.pickupId !== pickupId);
  list.push(entry);
  writeQueue(list);
  return entry;
}

export function queuedFor(pickupId) {
  return readQueue().find((e) => e.pickupId === pickupId) || null;
}

let flushing = null;

// Replays queued weighings. Returns { synced, failed, results }.
// Entries that synced, or that the server rejected for good, are removed;
// network failures keep the entry for the next attempt.
export function flushQueue(api) {
  if (flushing) return flushing;
  const run = async () => {
    const queue = readQueue();
    if (!queue.length || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return { synced: 0, failed: 0, results: [] };
    }
    const batch = queue.slice(0, 20);
    let results;
    try {
      const res = await api.post('/collector/sync', {
        entries: batch.map(({ pickupId, weighedItems, rateChoice }) => ({ pickupId, weighedItems, rateChoice })),
      });
      results = res.data?.data?.results || [];
    } catch (err) {
      // A validation error (4xx) means the batch will never sync as-is: drop it
      // so it doesn't block the queue. Network errors keep everything.
      if (err?.status && err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 429) {
        writeQueue(readQueue().filter((e) => !batch.some((b) => b.pickupId === e.pickupId && b.savedAt === e.savedAt)));
        return { synced: 0, failed: batch.length, results: batch.map((b) => ({ pickupId: b.pickupId, ok: false, message: err.message })) };
      }
      throw err;
    }
    const done = new Set(results.map((r) => r.pickupId));
    // Drop every entry the server answered for (ok or permanently rejected),
    // unless it was re-saved while the request was in flight.
    writeQueue(readQueue().filter((e) => !(done.has(e.pickupId) && batch.some((b) => b.pickupId === e.pickupId && b.savedAt === e.savedAt))));
    return {
      synced: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  };
  flushing = run().finally(() => {
    flushing = null;
  });
  return flushing;
}
