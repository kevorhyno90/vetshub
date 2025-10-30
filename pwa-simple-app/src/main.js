// Main app logic for the simple farm-management PWA.
import { getRecords, saveRecord, updateRecord, deleteRecord } from './storage.js';
import { exportAll, addRecord as dbAdd } from './db.js';

const MODULES = ['crop', 'livestock', 'inventory', 'tasks', 'finance', 'fields', 'activities', 'equipment', 'contacts', 'orders', 'animals', 'attachments'];

function q(sel, ctx = document) { return ctx.querySelector(sel); }
function qa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

function showSection(name) {
    qa('.section').forEach(s => s.classList.remove('active'));
    qa('.nav button').forEach(b => b.classList.remove('active'));
    const btn = q(`.nav button[data-section="${name}"]`);
    if (btn) btn.classList.add('active');
    const sec = q(`#${name}`);
    if (sec) sec.classList.add('active');
}

async function renderList(module) {
    const listEl = q(`#${module}-list`);
    const records = await getRecords(module);
    if (!listEl) return;
    if (!records || records.length === 0) {
        listEl.innerHTML = `<p>No ${module} records yet.</p>`;
        return;
    }
        const items = records.map(r => {
            const lines = Object.entries(r).filter(([k]) => !['id','createdAt','updatedAt','blob','file'].includes(k)).map(([k,v]) => `<strong>${k}</strong>: ${v}`);
            let body = lines.join('<br>');
            // attachments special: show filename and download link
            if (module === 'attachments') {
                const name = r.filename || r.name || 'file';
                if (r.blob) {
                    const url = URL.createObjectURL(r.blob);
                    body = `<a href="${url}" download="${name}">${name}</a>` + (r.description ? `<div>${r.description}</div>` : '');
                } else if (r.blob_base64 || r.blob_base64) {
                    body = `${name} (base64)`;
                }
            }
            return `<div class="item" data-id="${r.id}">
                <div class="item-body">${body}</div>
                <div class="item-actions">
                    <button class="edit">Edit</button>
                    <button class="delete">Delete</button>
                </div>
                </div>`;
        }).join('\n');
    listEl.innerHTML = items;
}

function wireListActions(module) {
    const listEl = q(`#${module}-list`);
    if (!listEl) return;
    listEl.addEventListener('click', async (e) => {
        const item = e.target.closest('.item');
        if (!item) return;
        const id = item.dataset.id;
        if (e.target.classList.contains('delete')) {
            if (confirm('Delete record?')) {
                await deleteRecord(module, id);
                await renderAll();
            }
        } else if (e.target.classList.contains('edit')) {
            // simple inline edit: prompt each editable field
            const recs = await getRecords(module);
            const rec = recs.find(r => r.id === id);
            if (!rec) return;
            const patch = {};
            Object.keys(rec).forEach(k => {
                if (['id','createdAt','updatedAt'].includes(k)) return;
                const val = prompt(`Edit ${k}`, rec[k] ?? '');
                if (val !== null) patch[k] = val;
            });
            await updateRecord(module, id, patch);
            await renderAll();
        }
    });
}

async function renderOverview() {
    const out = [];
    for (const m of MODULES) {
        const count = (await getRecords(m)).length;
        out.push(`<div><strong>${m}</strong>: ${count}</div>`);
    }
    q('#overview-area').innerHTML = out.join('');
}

async function renderFinanceSummary() {
    const recs = await getRecords('finance');
    const sum = recs.reduce((s,r) => s + (Number(r.amount) || 0), 0);
    q('#finance-summary').textContent = `Balance: ${sum.toFixed(2)}`;
}

async function renderAll() {
    for (const m of MODULES) await renderList(m);
    await renderOverview();
    await renderFinanceSummary();
}

document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    qa('.nav button').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    // Export / Import handlers
    const exportBtn = q('#export-btn');
    const importFile = q('#import-file');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const dump = await exportAll();
                const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vetshub-export-${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (err) {
                alert('Export failed: ' + err);
            }
        });
    }

    if (importFile) {
        importFile.addEventListener('change', async (evt) => {
            const f = evt.target.files && evt.target.files[0];
            if (!f) return;
            try {
                const txt = await f.text();
                const parsed = JSON.parse(txt);
                if (!parsed) throw new Error('Invalid file');
                // Confirm destructive import
                if (!confirm('Import will add records from this file into your local database. Continue?')) return;
                // iterate stores
                for (const [store, records] of Object.entries(parsed)) {
                    if (!Array.isArray(records)) continue;
                    for (const r of records) {
                        // attempt to add record preserving id
                        try {
                            await dbAdd(store, r);
                        } catch (err) {
                            // if add fails (duplicate key), try put to overwrite
                            try { await importPut(store, r); } catch (e) { console.warn('Import record failed', e); }
                        }
                    }
                }
                alert('Import completed.');
                await renderAll();
            } catch (err) {
                alert('Import failed: ' + err);
            } finally {
                importFile.value = '';
            }
        });
    }

    // helper: use db.putRecord via storage.updateRecord if available, otherwise raw put
    async function importPut(store, rec) {
        // try updateRecord if rec.id exists
        if (rec && rec.id) {
            await updateRecord(store, rec.id, rec);
            return;
        }
        await saveRecord(store, rec);
    }

    // Crop form
    const cropForm = q('#crop-form');
    if (cropForm) {
        cropForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rec = {
                name: q('#crop-name').value,
                field: q('#crop-field').value,
                planting: q('#crop-planting').value
            };
            saveRecord('crop', rec);
            cropForm.reset();
            renderAll();
        });
    }

    // Livestock form
    const lsForm = q('#livestock-form');
    if (lsForm) {
        lsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rec = {
                tag: q('#animal-id').value,
                type: q('#animal-type').value,
                breed: q('#animal-breed').value
            };
            saveRecord('livestock', rec);
            lsForm.reset();
            renderAll();
        });
    }

    // Fields form
    const fieldForm = q('#field-form');
    if (fieldForm) {
        fieldForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rec = {
                name: q('#field-name').value,
                geometry: null
            };
            const geoText = q('#field-geojson').value.trim();
            if (geoText) {
                try { rec.geometry = JSON.parse(geoText); } catch (err) { alert('Invalid GeoJSON'); return; }
            }
            await saveRecord('fields', rec);
            fieldForm.reset();
            await renderAll();
        });
    }

    // Activities
    const actForm = q('#activity-form');
    if (actForm) {
        q('#geo-capture')?.addEventListener('click', () => {
            if (!navigator.geolocation) return alert('Geolocation not supported');
            navigator.geolocation.getCurrentPosition((pos) => {
                q('#act-lat').value = pos.coords.latitude;
                q('#act-lng').value = pos.coords.longitude;
                alert('Location captured');
            }, (err) => alert('Location error: ' + err.message));
        });
        actForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rec = {
                type: q('#act-type').value,
                date: q('#act-date').value,
                fieldId: q('#act-field').value,
                cropId: q('#act-crop').value,
                worker: q('#act-worker').value,
                cost: Number(q('#act-cost').value) || 0,
                geotag: q('#act-lat').value ? { lat: Number(q('#act-lat').value), lng: Number(q('#act-lng').value) } : null
            };
            await saveRecord('activities', rec);
            actForm.reset();
            await renderAll();
        });
    }

    // Equipment
    const equipForm = q('#equipment-form');
    if (equipForm) {
        equipForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rec = { name: q('#equip-name').value, type: q('#equip-type').value, purchaseDate: q('#equip-purchase').value };
            await saveRecord('equipment', rec);
            equipForm.reset();
            await renderAll();
        });
    }

    // Contacts
    const contactForm = q('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rec = { name: q('#contact-name').value, type: q('#contact-type').value, phone: q('#contact-phone').value };
            await saveRecord('contacts', rec);
            contactForm.reset();
            await renderAll();
        });
    }

    // Orders
    const orderForm = q('#order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rec = { description: q('#order-desc').value, amount: Number(q('#order-amount').value) || 0, date: q('#order-date').value };
            await saveRecord('orders', rec);
            orderForm.reset();
            await renderAll();
        });
    }

    // Animals
    const animalForm = q('#animal-form');
    if (animalForm) {
        animalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rec = { tag: q('#animal-tag').value, species: q('#animal-species').value, dob: q('#animal-dob').value, parentIds: q('#animal-parents').value.split(',').map(s=>s.trim()).filter(Boolean) };
            await saveRecord('animals', rec);
            animalForm.reset();
            await renderAll();
        });
    }

    // Attachments upload
    const attachForm = q('#attachment-form');
    if (attachForm) {
        attachForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = q('#attachment-file').files && q('#attachment-file').files[0];
            if (!f) return alert('Select a file');
            const desc = q('#attachment-desc').value;
            // store as blob in attachments store using dbAdd to preserve blob
            const rec = { filename: f.name, mimeType: f.type, description: desc, blob: f };
            try {
                await dbAdd('attachments', rec);
                attachForm.reset();
                await renderAll();
            } catch (err) {
                alert('Upload failed: ' + err);
            }
        });
    }

    // Inventory form
    const invForm = q('#inventory-form');
    if (invForm) {
        invForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rec = {
                name: q('#inv-name').value,
                qty: q('#inv-qty').value,
                unit: q('#inv-unit').value
            };
            saveRecord('inventory', rec);
            invForm.reset();
            renderAll();
        });
    }

    // Task form
    const tForm = q('#task-form');
    if (tForm) {
        tForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rec = {
                title: q('#task-title').value,
                date: q('#task-date').value,
                assignee: q('#task-assignee').value
            };
            saveRecord('tasks', rec);
            tForm.reset();
            renderAll();
        });
    }

    // Finance form
    const fForm = q('#finance-form');
    if (fForm) {
        fForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rec = {
                description: q('#fin-desc').value,
                amount: q('#fin-amount').value,
                type: q('#fin-type').value
            };
            // store numeric amount (income positive, expense negative)
            rec.amount = rec.type === 'expense' ? -(Math.abs(Number(rec.amount) || 0)) : Number(rec.amount) || 0;
            saveRecord('finance', rec);
            fForm.reset();
            renderAll();
        });
    }

    // Wire up list delegation for actions
    MODULES.forEach(m => wireListActions(m));

    // initial render
    (async () => { await renderAll(); })();
});

// Register service worker (keep using existing sw if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registered', reg.scope))
            .catch(err => console.warn('SW failed', err));
    });
}