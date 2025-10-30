// Minimal IndexedDB wrapper for vetshub PWA
const DB_NAME = 'vetshub-db';
const DB_VERSION = 1;
const STORES = [
    'crop','livestock','inventory','tasks','finance','fields','attachments','animals','equipment','contacts','orders'
];

let _dbPromise = null;

function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            STORES.forEach(name => {
                if (!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name, { keyPath: 'id' });
                }
            });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _dbPromise;
}

async function withStore(storeName, mode, callback) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result;
        try {
            result = callback(store);
        } catch (err) {
            reject(err);
        }
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    });
}

async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function addRecord(storeName, record) {
    const rec = Object.assign({}, record);
    if (!rec.id) rec.id = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
    rec.createdAt = rec.createdAt || new Date().toISOString();
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.add(rec);
        req.onsuccess = () => resolve(rec);
        req.onerror = () => reject(req.error);
    });
}

async function putRecord(storeName, record) {
    const rec = Object.assign({}, record);
    rec.updatedAt = new Date().toISOString();
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(rec);
        req.onsuccess = () => resolve(rec);
        req.onerror = () => reject(req.error);
    });
}

async function getRecord(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function deleteRecord(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

async function clearStore(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

async function exportAll() {
    const out = {};
    for (const s of STORES) {
        const records = await getAll(s);
        // If attachments store, convert any Blob fields to base64 for JSON export
        if (s === 'attachments') {
            const conv = await Promise.all(records.map(async (r) => {
                const copy = Object.assign({}, r);
                // find any Blob/ArrayBuffer fields and convert
                for (const k of Object.keys(copy)) {
                    const v = copy[k];
                    if (v instanceof Blob) {
                        const arrBuff = await v.arrayBuffer();
                        const b64 = Buffer.from(arrBuff).toString('base64');
                        copy[`${k}_base64`] = b64;
                        copy[`${k}_type`] = v.type || 'application/octet-stream';
                        delete copy[k];
                    }
                }
                return copy;
            }));
            out[s] = conv;
        } else {
            out[s] = records;
        }
    }
    return out;
}

export { openDB, getAll, addRecord, putRecord, getRecord, deleteRecord, clearStore, exportAll, STORES };
