import * as db from './db.js';

// Storage layer that uses IndexedDB (via src/db.js). Exposes async CRUD functions
// with the same logical names used by the app: getRecords, saveRecord, updateRecord, deleteRecord, clearModule.

let dbReady = false;

async function _ensureDB() {
    if (dbReady) return;
    try {
        await db.openDB();
        // migrate any localStorage module:* keys into indexedDB
        migrateFromLocalStorage().catch(err => console.warn('Migration failed', err));
        dbReady = true;
    } catch (err) {
        console.warn('IndexedDB not available, falling back to localStorage', err);
        dbReady = false;
    }
}

async function migrateFromLocalStorage() {
    // Find keys like module:<name>
    const keys = Object.keys(localStorage).filter(k => k.startsWith('module:'));
    for (const k of keys) {
        try {
            const moduleName = k.split(':')[1];
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) continue;
            for (const r of arr) {
                // add to indexedDB store if store exists
                if (db.STORES.includes(moduleName)) {
                    await db.addRecord(moduleName, r);
                }
            }
            // remove after migration
            localStorage.removeItem(k);
        } catch (err) {
            console.warn('Failed migrating', k, err);
        }
    }
}

async function getRecords(module) {
    await _ensureDB();
    if (dbReady && db.STORES.includes(module)) {
        return await db.getAll(module);
    }
    // fallback to localStorage
    const raw = localStorage.getItem(`module:${module}`);
    return raw ? JSON.parse(raw) : [];
}

async function saveRecord(module, record) {
    await _ensureDB();
    if (dbReady && db.STORES.includes(module)) {
        return await db.addRecord(module, record);
    }
    // fallback
    const key = `module:${module}`;
    const arr = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : [];
    const rec = Object.assign({}, record);
    if (!rec.id) rec.id = (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
    rec.createdAt = rec.createdAt || new Date().toISOString();
    arr.push(rec);
    localStorage.setItem(key, JSON.stringify(arr));
    return rec;
}

async function updateRecord(module, id, patch) {
    await _ensureDB();
    if (dbReady && db.STORES.includes(module)) {
        const rec = await db.getRecord(module, id);
        if (!rec) return null;
        const updated = Object.assign({}, rec, patch, { updatedAt: new Date().toISOString() });
        return await db.putRecord(module, updated);
    }
    // fallback
    const key = `module:${module}`;
    const arr = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : [];
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return null;
    arr[idx] = Object.assign({}, arr[idx], patch, { updatedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(arr));
    return arr[idx];
}

async function deleteRecord(module, id) {
    await _ensureDB();
    if (dbReady && db.STORES.includes(module)) {
        return await db.deleteRecord(module, id);
    }
    const key = `module:${module}`;
    const arr = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : [];
    const before = arr.length;
    const filtered = arr.filter(r => r.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    return filtered.length !== before;
}

async function clearModule(module) {
    await _ensureDB();
    if (dbReady && db.STORES.includes(module)) {
        return await db.clearStore(module);
    }
    localStorage.removeItem(`module:${module}`);
}

export { getRecords, saveRecord, updateRecord, deleteRecord, clearModule };
