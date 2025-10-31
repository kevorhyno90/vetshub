// Main app logic for the simple farm-management PWA.
import { getRecords, saveRecord, updateRecord, deleteRecord } from './storage.js';
import { exportAll, addRecord as dbAdd, getRecord as dbGetRecord } from './db.js';

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
    // when showing a section, show its default sub-section (overview or first .subnav button)
    setTimeout(() => {
        const subnav = sec && sec.querySelector('.subnav');
        if (subnav) {
            const active = subnav.querySelector('button.active') || subnav.querySelector('button');
            if (active) showSubSection(name, active.dataset.sub);
        }
    }, 0);
}

function showSubSection(module, sub) {
    const sec = q(`#${module}`);
    if (!sec) return;
    // toggle active class on subnav buttons
    const buttons = Array.from(sec.querySelectorAll('.subnav button'));
    buttons.forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
    // hide/show sub-section content
    const subs = Array.from(sec.querySelectorAll('.sub-section'));
    subs.forEach(s => {
        if (s.id === `${module}-${sub}` || s.id === `${module}-${sub}`.replace(/--/, '-')) {
            s.style.display = '';
        } else {
            s.style.display = 'none';
        }
    });
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

    // If module has photo links, attach thumbnails after rendering
    if (module === 'activities' || module === 'fields') {
        for (const r of records) {
            if (!r.photos || !Array.isArray(r.photos) || r.photos.length === 0) continue;
            const itemEl = listEl.querySelector(`.item[data-id="${r.id}"]`);
            if (!itemEl) continue;
            const container = itemEl.querySelector('.item-body');
            for (const pid of r.photos) {
                try {
                    const aRec = await dbGetRecord('attachments', pid);
                    if (aRec && aRec.blob) {
                        const url = URL.createObjectURL(aRec.blob);
                        const img = document.createElement('img');
                        img.src = url;
                        img.style.width = '80px'; img.style.height = '56px'; img.style.objectFit = 'cover'; img.style.marginRight = '6px'; img.alt = aRec.filename || 'photo';
                        container.insertBefore(img, container.firstChild);
                    }
                } catch (err) {
                    console.warn('Thumbnail load failed', err);
                }
            }
        }
    }
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
            // open modal editor for this record
            const recs = await getRecords(module);
            const rec = recs.find(r => r.id === id);
            if (!rec) return;
            openModalEditor(module, rec);
        }
    });
}

/* Modal editor helpers */
function mapFieldType(key, value) {
    if (typeof value === 'number') return 'number';
    if (/date|time|dob|purchase|plant|harvest/i.test(key)) return 'date';
    if (/desc|notes|geometry|geojson|description/i.test(key)) return 'textarea';
    return 'text';
}

function openModalEditor(module, record) {
    const modal = q('#modal');
    const form = q('#modal-form');
    const title = q('#modal-title');
    title.textContent = `Edit ${module} — ${record.id || ''}`;
    form.innerHTML = '';
    // build fields
    Object.keys(record).forEach(k => {
        if (['id','createdAt','updatedAt'].includes(k)) {
            const el = document.createElement('div'); el.className='full'; el.innerHTML = `<label>${k}</label><div>${record[k]}</div>`; form.appendChild(el); return;
        }
        const fieldType = mapFieldType(k, record[k]);
        const wrapper = document.createElement('div'); wrapper.className='full';
        const label = document.createElement('label'); label.textContent = k; wrapper.appendChild(label);
        let input;
        if (fieldType === 'textarea') {
            input = document.createElement('textarea'); input.rows = 3; input.value = record[k] ?? '';
        } else {
            input = document.createElement('input'); input.type = fieldType; input.value = record[k] ?? '';
            if (fieldType === 'number') input.step = 'any';
        }
        input.name = k; wrapper.appendChild(input);
        form.appendChild(wrapper);
    });

    // show modal
    modal.setAttribute('aria-hidden', 'false');

    function close() { modal.setAttribute('aria-hidden', 'true'); }
    q('#modal-close').onclick = close;
    q('#modal-backdrop');

    q('#modal-save').onclick = async () => {
        // collect form values
        const fd = new FormData(form);
        const patch = {};
        for (const [k,v] of fd.entries()) {
            // basic type coercion
            const orig = record[k];
            if (typeof orig === 'number') patch[k] = Number(v) || 0;
            else patch[k] = v;
        }
        try {
            await updateRecord(module, record.id, patch);
            await renderAll();
            close();
        } catch (err) {
            alert('Save failed: ' + err);
        }
    };
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
    // populate richer sub-section UIs
    try {
        await populateCropOverview();
        await populateLivestockOverview();
        await populateInventoryOverview();
        await populateAttachmentsGallery();
        await populateReports();
        await renderFieldsTable();
        await populateActivitiesCalendar();
    } catch (err) { console.warn('Subsection render failed', err); }

}


// --- Rich sub-section renderers ---
function makeRow(cells) {
    return '<tr>' + cells.map(c => `<td>${c ?? ''}</td>`).join('') + '</tr>';
}

async function populateCropOverview() {
    const crops = await getRecords('crop');
    const statsEl = q('#crop-overview-stats');
    if (statsEl) statsEl.textContent = `${crops.length} crop records`;
    const upcomingList = q('#crop-upcoming-list');
    if (upcomingList) {
        upcomingList.innerHTML = '';
        const upcoming = crops.filter(c => c.planting).sort((a,b) => (a.planting||'').localeCompare(b.planting||''));
        if (upcoming.length === 0) upcomingList.innerHTML = '<li>No upcoming plantings</li>';
        else upcoming.forEach(c => { const li = document.createElement('li'); li.textContent = `${c.name || 'Unnamed'} — ${c.planting || ''}`; upcomingList.appendChild(li); });
    }
}

async function populateLivestockOverview() {
    const recs = await getRecords('livestock');
    const el = q('#livestock-stats');
    if (el) el.textContent = `${recs.length} animals in herd`;
}

async function populateInventoryOverview() {
    const inv = await getRecords('inventory');
    const el = q('#inventory-stats');
    if (el) el.textContent = `${inv.length} inventory items`;
    const list = q('#inventory-list');
    if (list) {
        if (inv.length === 0) { list.innerHTML = '<div>No inventory yet.</div>'; return; }
        const rows = inv.map(i => `<div class="item"><div><strong>${i.name}</strong> — ${i.qty || ''} ${i.unit || ''}</div></div>`).join('');
        list.innerHTML = rows;
    }
}

async function populateAttachmentsGallery() {
    const atts = await getRecords('attachments');
    const grid = q('#attachments-gallery-grid');
    if (!grid) return;
    if (!atts || atts.length === 0) { grid.innerHTML = '<div class="muted">No attachments yet.</div>'; return; }
    grid.innerHTML = '';
    for (const a of atts) {
        const card = document.createElement('div'); card.className = 'gallery-card';
        if (a.blob) {
            try {
                const url = URL.createObjectURL(a.blob);
                card.innerHTML = `<a href="${url}" download="${a.filename || 'file'}"><img src="${url}" alt="${a.filename || ''}"/></a><div class="caption">${a.filename || ''}</div>`;
            } catch (err) { card.textContent = a.filename || 'file'; }
        } else if (a.blob_base64) {
            card.textContent = a.filename || 'file (base64)';
        } else {
            card.textContent = a.filename || 'file';
        }
        grid.appendChild(card);
    }
}

async function populateReports() {
    // finance report table
    const fin = await getRecords('finance');
    const reportEl = q('#report-production');
    const prodTable = q('#report-production-table');
    if (reportEl) reportEl.textContent = `Finance records: ${fin.length}`;
    if (prodTable) {
        if (!fin || fin.length === 0) { prodTable.innerHTML = '<div>No finance records.</div>'; }
        else {
            const rows = fin.map(r => makeRow([r.description || '', (r.amount||0).toFixed(2), r.type || ''])).join('');
            prodTable.innerHTML = `<table class="simple"><thead><tr><th>Description</th><th>Amount</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
    }
}

// --- Animals: richer list, detail and editor UI ---
let _currentAnimalId = null;

async function renderAnimalsList() {
    const listEl = q('#animals-list');
    if (!listEl) return;
    const recs = await getRecords('animals');
    if (!recs || recs.length === 0) {
        listEl.innerHTML = '<div class="muted">No animals yet.</div>';
        const titleEl = q('#animal-detail-title');
        const detailEl = q('#animal-detail');
        if (titleEl) titleEl.textContent = 'Select an animal';
        if (detailEl) detailEl.textContent = 'No animal selected.';
        return;
    }
    // build clickable list
    const items = recs.map(r => `<div class="item" data-id="${r.id}"><div><strong>${r.tag || r.id}</strong><div class="muted">${r.species || ''} ${r.breed ? '— ' + r.breed : ''}</div></div></div>`).join('');
    listEl.innerHTML = items;

    // click handler
    listEl.querySelectorAll('.item').forEach(it => it.addEventListener('click', async (e) => {
        const id = it.dataset.id;
        _currentAnimalId = id;
        await showAnimalDetail(id);
    }));
}

async function showAnimalDetail(id) {
    const rec = (await getRecords('animals')).find(r => r.id === id);
    const detailEl = q('#animal-detail');
    const titleEl = q('#animal-detail-title');
    if (!rec) {
        if (titleEl) titleEl.textContent = 'Select an animal';
        if (detailEl) detailEl.textContent = 'No animal selected.';
        return;
    }
    if (titleEl) titleEl.textContent = `${rec.tag || rec.id} — ${rec.species || ''}`;
    if (detailEl) {
        detailEl.innerHTML = `
            <div><strong>Tag:</strong> ${rec.tag || ''}</div>
            <div><strong>Species:</strong> ${rec.species || ''}</div>
            <div><strong>Breed:</strong> ${rec.breed || ''}</div>
            <div><strong>Sex:</strong> ${rec.sex || ''}</div>
            <div><strong>DOB:</strong> ${rec.dob || ''}</div>
            <div><strong>Parents:</strong> ${(rec.parentIds && rec.parentIds.length) ? rec.parentIds.join(', ') : ''}</div>
            <div style="margin-top:8px"><strong>Notes:</strong><div class="muted">${rec.notes || ''}</div></div>
        `;
    }
}

function showAnimalEditor(show, record = null) {
    const editor = q('#animal-editor');
    const form = q('#animal-editor-form');
    if (!editor || !form) return;
    if (!show) { editor.style.display = 'none'; return; }
    editor.style.display = '';
    // populate fields
    q('#edit-animal-tag').value = record?.tag || '';
    q('#edit-animal-species').value = record?.species || '';
    q('#edit-animal-dob').value = record?.dob || '';
    q('#edit-animal-sex').value = record?.sex || '';
    q('#edit-animal-breed').value = record?.breed || '';
    q('#edit-animal-parents').value = record && record.parentIds ? record.parentIds.join(', ') : '';
    q('#edit-animal-notes').value = record?.notes || '';
}

async function wireAnimalUI() {
    // new animal button
    q('#btn-new-animal')?.addEventListener('click', () => {
        _currentAnimalId = null;
        showAnimalEditor(true, {});
        q('#animal-editor-title').textContent = 'New animal';
    });

    // edit button on detail card
    q('#animal-edit-btn')?.addEventListener('click', async () => {
        if (!_currentAnimalId) return alert('Select an animal first');
        const rec = (await getRecords('animals')).find(r => r.id === _currentAnimalId);
        if (!rec) return alert('Record not found');
        showAnimalEditor(true, rec);
        q('#animal-editor-title').textContent = 'Edit animal';
    });

    // delete
    q('#animal-delete-btn')?.addEventListener('click', async () => {
        if (!_currentAnimalId) return alert('Select an animal first');
        if (!confirm('Delete this animal?')) return;
        try {
            await deleteRecord('animals', _currentAnimalId);
            _currentAnimalId = null;
            await renderAnimalsList();
            showAnimalDetail(null);
        } catch (err) { alert('Delete failed: ' + err); }
    });

    // duplicate
    q('#animal-copy-btn')?.addEventListener('click', async () => {
        if (!_currentAnimalId) return alert('Select an animal first');
        const rec = (await getRecords('animals')).find(r => r.id === _currentAnimalId);
        if (!rec) return alert('Record not found');
        const copy = Object.assign({}, rec); delete copy.id; copy.tag = (copy.tag || '') + '-copy';
        await saveRecord('animals', copy);
        await renderAnimalsList();
    });

    // cancel editor
    q('#animal-cancel-btn')?.addEventListener('click', () => {
        showAnimalEditor(false);
    });

    // save editor
    q('#animal-editor-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rec = {
            tag: q('#edit-animal-tag').value.trim(),
            species: q('#edit-animal-species').value.trim(),
            dob: q('#edit-animal-dob').value || '',
            sex: q('#edit-animal-sex').value || '',
            breed: q('#edit-animal-breed').value || '',
            parentIds: q('#edit-animal-parents').value.split(',').map(s=>s.trim()).filter(Boolean),
            notes: q('#edit-animal-notes').value || ''
        };
        try {
            if (_currentAnimalId) {
                await updateRecord('animals', _currentAnimalId, rec);
            } else {
                const created = await saveRecord('animals', rec);
                _currentAnimalId = created && created.id ? created.id : null;
            }
            showAnimalEditor(false);
            await renderAnimalsList();
            if (_currentAnimalId) await showAnimalDetail(_currentAnimalId);
        } catch (err) { alert('Save failed: ' + err); }
    });
}


// --- Reporting system: selectable reports, viewer and download (.doc) ---
const AVAILABLE_REPORTS = [
    { id: 'production', name: 'Production (Crops & Yield)' },
    { id: 'finance', name: 'Finance (P&L / Records)' },
    { id: 'inventory', name: 'Inventory Valuation' },
    { id: 'activities', name: 'Activities Log' },
    { id: 'fields', name: 'Fields (GeoJSON summary)' },
    { id: 'attachments', name: 'Attachments index' }
];

function populateReportDropdown() {
    const sel = q('#report-select');
    if (!sel) return;
    // build options from sections + their subnav buttons so every visible sub-section becomes a report choice
    sel.innerHTML = '<option value="">-- choose report --</option>';
    // also add a top-level "All data" option
    const allOpt = document.createElement('option'); allOpt.value = 'all::all'; allOpt.textContent = 'All data (full export)'; sel.appendChild(allOpt);
    // iterate DOM sections
    const sections = qa('main .section');
    for (const s of sections) {
        const moduleId = s.id || 'unknown';
        const titleEl = s.querySelector('h2');
        const title = titleEl ? titleEl.textContent.trim() : moduleId;
        // find subnav buttons; if none, add a module-level option
        const subs = Array.from(s.querySelectorAll('.subnav button'));
        if (subs.length === 0) {
            const opt = document.createElement('option'); opt.value = `${moduleId}::all`; opt.textContent = `${title} — all`; sel.appendChild(opt);
        } else {
            for (const b of subs) {
                const sub = b.dataset.sub || b.textContent.trim().toLowerCase();
                const label = `${title} — ${b.textContent.trim()}`;
                const opt = document.createElement('option'); opt.value = `${moduleId}::${sub}`; opt.textContent = label;
                sel.appendChild(opt);
            }
        }
    }
}

async function generateReportHtml(id) {
    // build an HTML document string suitable for viewing and downloading as .doc
    // id may be 'module::sub' from the dropdown; parse it
    let module = id;
    let sub = null;
    if (!id) module = 'all';
    if (id && id.indexOf('::') !== -1) {
        [module, sub] = id.split('::');
    }
    const title = (AVAILABLE_REPORTS.find(r => r.id === module)?.name) || `${module}${sub ? ' — ' + sub : ''}`;
    let body = `<h1>${title}</h1>`;
    const tableStyle = `border-collapse:collapse;width:100%;`;
    const thStyle = `border:1px solid #ddd;padding:6px;background:#f4f4f4;text-align:left;`;
    const tdStyle = `border:1px solid #ddd;padding:6px;text-align:left;`;

    // route by module
    if (module === 'finance') {
        const fin = await getRecords('finance');
        body += `<h2>Finance records (${fin.length})</h2>`;
        if (fin.length === 0) body += '<p>No finance records.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Date</th><th style="${thStyle}">Description</th><th style="${thStyle}">Amount</th><th style="${thStyle}">Type</th></tr></thead><tbody>`;
            for (const r of fin) {
                body += `<tr><td style="${tdStyle}">${r.createdAt||''}</td><td style="${tdStyle}">${r.description||''}</td><td style="${tdStyle}">${(Number(r.amount)||0).toFixed(2)}</td><td style="${tdStyle}">${r.type||''}</td></tr>`;
            }
            body += `</tbody></table>`;
            const sum = fin.reduce((s,r) => s + (Number(r.amount)||0), 0);
            body += `<p><strong>Balance:</strong> ${sum.toFixed(2)}</p>`;
        }
    } else if (module === 'inventory') {
        const inv = await getRecords('inventory');
        body += `<h2>Inventory (${inv.length})</h2>`;
        if (inv.length === 0) body += '<p>No inventory records.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Name</th><th style="${thStyle}">Quantity</th><th style="${thStyle}">Unit</th></tr></thead><tbody>`;
            for (const i of inv) body += `<tr><td style="${tdStyle}">${i.name||''}</td><td style="${tdStyle}">${i.qty||''}</td><td style="${tdStyle}">${i.unit||''}</td></tr>`;
            body += `</tbody></table>`;
        }
    } else if (module === 'crop' || module === 'production') {
        const crops = await getRecords('crop');
        const acts = await getRecords('activities');
        body += `<h2>Crops (${crops.length})</h2>`;
        if (crops.length === 0) body += '<p>No crops.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Name</th><th style="${thStyle}">Field</th><th style="${thStyle}">Planting</th></tr></thead><tbody>`;
            for (const c of crops) body += `<tr><td style="${tdStyle}">${c.name||''}</td><td style="${tdStyle}">${c.field||''}</td><td style="${tdStyle}">${c.planting||''}</td></tr>`;
            body += `</tbody></table>`;
        }
        body += `<h2>Related Activities (${acts.length})</h2>`;
        if (acts.length === 0) body += '<p>No activities.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Date</th><th style="${thStyle}">Type</th><th style="${thStyle}">Crop</th><th style="${thStyle}">Field</th><th style="${thStyle}">Cost</th></tr></thead><tbody>`;
            for (const a of acts) body += `<tr><td style="${tdStyle}">${a.date||''}</td><td style="${tdStyle}">${a.type||''}</td><td style="${tdStyle}">${a.cropId||''}</td><td style="${tdStyle}">${a.fieldId||''}</td><td style="${tdStyle}">${(Number(a.cost)||0).toFixed(2)}</td></tr>`;
            body += `</tbody></table>`;
        }
    } else if (module === 'activities') {
        const acts = await getRecords('activities');
        body += `<h2>Activities (${acts.length})</h2>`;
        if (acts.length === 0) body += '<p>No activities logged.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Date</th><th style="${thStyle}">Type</th><th style="${thStyle}">Field</th><th style="${thStyle}">Worker</th><th style="${thStyle}">Cost</th></tr></thead><tbody>`;
            for (const a of acts) body += `<tr><td style="${tdStyle}">${a.date||''}</td><td style="${tdStyle}">${a.type||''}</td><td style="${tdStyle}">${a.fieldId||''}</td><td style="${tdStyle}">${a.worker||''}</td><td style="${tdStyle}">${(Number(a.cost)||0).toFixed(2)}</td></tr>`;
            body += `</tbody></table>`;
        }
    } else if (module === 'fields') {
        const flds = await getRecords('fields');
        body += `<h2>Fields (${flds.length})</h2>`;
        if (flds.length === 0) body += '<p>No fields defined.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Name</th><th style="${thStyle}">Geometry type</th><th style="${thStyle}">Summary</th></tr></thead><tbody>`;
            for (const f of flds) {
                const g = f.geometry || {};
                body += `<tr><td style="${tdStyle}">${f.name||''}</td><td style="${tdStyle}">${g.type||''}</td><td style="${tdStyle}">${JSON.stringify(g.coordinates||'')}</td></tr>`;
            }
            body += `</tbody></table>`;
        }
    } else if (module === 'attachments') {
        const atts = await getRecords('attachments');
        body += `<h2>Attachments (${atts.length})</h2>`;
        if (atts.length === 0) body += '<p>No attachments.</p>';
        else {
            body += `<table style="${tableStyle}"><thead><tr><th style="${thStyle}">Filename</th><th style="${thStyle}">Type</th><th style="${thStyle}">Linked To</th><th style="${thStyle}">Notes</th></tr></thead><tbody>`;
            for (const a of atts) body += `<tr><td style="${tdStyle}">${a.filename||''}</td><td style="${tdStyle}">${a.mimeType||''}</td><td style="${tdStyle}">${a.linkedTo ? (a.linkedTo.module + ':' + a.linkedTo.id) : ''}</td><td style="${tdStyle}">${a.description||''}</td></tr>`;
            body += `</tbody></table>`;
        }
    } else if (module === 'all') {
        // produce a short summary list of counts per store
        body += '<h2>All data summary</h2>';
        const counts = [];
        for (const m of MODULES) {
            const recs = await getRecords(m);
            counts.push(`<div><strong>${m}</strong>: ${recs.length}</div>`);
        }
        body += counts.join('');
    } else {
        // generic module listing: build table of records with union of keys
        try {
            const recs = await getRecords(module);
            body += `<h2>${title} (${recs.length})</h2>`;
            if (!recs || recs.length === 0) body += '<p>No records.</p>';
            else {
                // collect keys
                const keys = new Set();
                recs.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
                const cols = Array.from(keys).filter(k => k !== 'blob');
                body += `<table style="${tableStyle}"><thead><tr>`;
                cols.forEach(c => body += `<th style="${thStyle}">${c}</th>`);
                body += `</tr></thead><tbody>`;
                for (const r of recs) {
                    body += '<tr>';
                    for (const c of cols) body += `<td style="${tdStyle}">${(r[c] !== undefined) ? String(r[c]) : ''}</td>`;
                    body += '</tr>';
                }
                body += `</tbody></table>`;
            }
        } catch (err) {
            body += `<p>Error generating report for ${module}: ${err}</p>`;
        }
    }

    // wrap into minimal HTML
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:12px}table{${tableStyle}}th{${thStyle}}td{${tdStyle}}</style></head><body>${body}</body></html>`;
    return doc;
}

async function viewReport(id) {
    const viewer = q('#report-viewer');
    if (!viewer) return;
    if (!id) { viewer.innerHTML = '<div class="muted">Select a report to view.</div>'; return; }
    viewer.innerHTML = '<div>Loading report...</div>';
    try {
        const html = await generateReportHtml(id);
        // show inside an iframe to keep document structure separate
        viewer.innerHTML = `<iframe style="width:100%;height:600px;border:0" sandbox srcdoc='${html.replace(/'/g, "\'")}'></iframe>`;
    } catch (err) {
        viewer.innerHTML = `<div class="error">Failed to generate report: ${err}</div>`;
    }
}

async function downloadReportDoc(id) {
    if (!id) return alert('Select a report first');
    try {
        const html = await generateReportHtml(id);
        // Word accepts HTML files saved with .doc extension
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const name = `${id}-report-${new Date().toISOString().slice(0,10)}.doc`;
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) {
        alert('Download failed: ' + err);
    }
}

async function populateActivitiesCalendar() {
    const acts = await getRecords('activities');
    const list = q('#activities-calendar-list');
    if (!list) return;
    if (!acts || acts.length === 0) { list.textContent = 'No scheduled activities.'; return; }
    list.innerHTML = '<ul>' + acts.map(a => `<li>${a.date || ''} — ${a.type || ''} (${a.fieldId || ''})</li>`).join('') + '</ul>';
}

// render fields table in Fields -> Manage
async function renderFieldsTable() {
    const table = q('#fields-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const records = await getRecords('fields');
    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="muted">No fields yet.</td></tr>`;
        return;
    }
    let rows = '';
    for (const r of records) {
        const photos = (r.photos && r.photos.length) ? r.photos.length : 0;
        const area = (r.area !== undefined && r.area !== null) ? (Number(r.area).toFixed(2)) : '';
        const soil = r.soilType || '';
        const last = r.lastCrop || '';
        const notes = r.notes ? (String(r.notes).length > 120 ? String(r.notes).slice(0,120) + '…' : String(r.notes)) : '';
        // geometry summary
        let geomSummary = '';
        try {
            if (r.geometry) {
                geomSummary = r.geometry.type ? r.geometry.type : 'GeoJSON';
                if (r.geometry.coordinates) geomSummary += ` (${Array.isArray(r.geometry.coordinates) ? r.geometry.coordinates.length : ''})`;
            }
        } catch (err) { geomSummary = '' }
        const createdAt = r.createdAt ? (new Date(r.createdAt).toLocaleString()) : (r.created ? (new Date(r.created).toLocaleString()) : '');
        // include thumbnail if available
        let thumbHtml = '';
        if (r.photos && r.photos.length) {
            try {
                const aRec = await dbGetRecord('attachments', r.photos[0]);
                if (aRec && aRec.blob) {
                    const url = URL.createObjectURL(aRec.blob);
                    thumbHtml = `<img class="thumb" src="${url}" alt="${aRec.filename||''}"/>`;
                }
            } catch (err) { /* ignore thumbnail errors */ }
        }
        rows += `<tr data-id="${r.id}"><td style="min-width:160px">${r.name||''}</td><td>${area}</td><td>${soil}</td><td>${last}</td><td>${notes}</td><td>${geomSummary}</td><td>${createdAt}</td><td style="width:72px">${thumbHtml || photos}</td><td><button class="edit-field" data-id="${r.id}">Edit</button> <button class="delete-field" data-id="${r.id}">Delete</button></td></tr>`;
    }
    tbody.innerHTML = rows;
}

// --- Map integration for field polygons using Leaflet + Leaflet.draw ---
let _fieldMap = null;
let _fieldDrawnItems = null;

function ensureLeaflet() {
    if (typeof window === 'undefined' || !window.L) return false;
    return true;
}

async function initFieldMap() {
    if (!ensureLeaflet()) return;
    const L = window.L;
    const el = document.getElementById('fields-map');
    if (!el) return;
    // create map
    _fieldMap = L.map(el).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(_fieldMap);
    _fieldDrawnItems = new L.FeatureGroup();
    _fieldMap.addLayer(_fieldDrawnItems);
    // Ensure draw plugin is available. If the patched local copy didn't expose the constructor
    // (some environments or loading ordering can cause that), dynamically load the CDN fallback.
    if (!L.Control || typeof L.Control.Draw !== 'function') {
        console.warn('L.Control.Draw not available; loading CDN fallback for Leaflet.draw');
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load leaflet.draw from CDN'));
            document.head.appendChild(s);
        }).catch(err => { console.error(err); });
    }

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: _fieldDrawnItems },
        draw: { polygon: true, polyline: false, rectangle: true, circle: false, marker: false }
    });
    _fieldMap.addControl(drawControl);

    _fieldMap.on(L.Draw.Event.CREATED, async (e) => {
        const layer = e.layer;
        // ask for field name
        const name = prompt('Name for this field polygon');
        const gj = layer.toGeoJSON();
        const rec = { name: name || 'Field', geometry: gj.geometry };
        const created = await saveRecord('fields', rec);
        layer._fieldId = created.id;
        _fieldDrawnItems.addLayer(layer);
        await renderAll();
    });

    _fieldMap.on(L.Draw.Event.EDITED, async (e) => {
        const layers = e.layers;
        layers.eachLayer(async (layer) => {
            const id = layer._fieldId;
            if (!id) return;
            const gj = layer.toGeoJSON();
            await updateRecord('fields', id, { geometry: gj.geometry });
        });
        await renderAll();
    });

    _fieldMap.on(L.Draw.Event.DELETED, async (e) => {
        const layers = e.layers;
        layers.eachLayer(async (layer) => {
            const id = layer._fieldId;
            if (!id) return;
            await deleteRecord('fields', id);
        });
        await renderAll();
    });

    // load existing fields onto map
    await loadFieldsToMap();
}

async function loadFieldsToMap() {
    if (!_fieldMap || !_fieldDrawnItems) return;
    _fieldDrawnItems.clearLayers();
    const fields = await getRecords('fields');
    for (const f of fields) {
        try {
            if (!f.geometry) continue;
            const layer = L.geoJSON(f.geometry, { style: { color: '#2f7a3a', weight: 2, fillOpacity: 0.2 } });
            layer.eachLayer(l => {
                l._fieldId = f.id;
                _fieldDrawnItems.addLayer(l);
            });
        } catch (err) { console.warn('Render field failed', err); }
    }
    // fit bounds
    try {
        const bounds = _fieldDrawnItems.getBounds();
        if (bounds.isValid()) _fieldMap.fitBounds(bounds.pad(0.2));
    } catch (err) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    qa('.nav button').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    // Sub-navigation inside modules
    qa('.subnav button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const module = e.target.closest('.section')?.id;
            if (!module) return;
            showSubSection(module, e.target.dataset.sub);
        });
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
                    for (let r of records) {
                        // attachments: convert base64 back to Blob if present
                        if (store === 'attachments' && (r.blob_base64 || r.blob_base64)) {
                            const b64 = r.blob_base64 || r.blob_base64;
                            const type = r.blob_type || r.mimeType || 'application/octet-stream';
                            try {
                                const binary = atob(b64);
                                const len = binary.length;
                                const u8 = new Uint8Array(len);
                                for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
                                r.blob = new Blob([u8], { type });
                            } catch (err) {
                                console.warn('Failed to decode attachment', err);
                            }
                            delete r.blob_base64;
                            delete r.blob_type;
                        }
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
                area: parseFloat(q('#field-area').value) || null,
                soilType: q('#field-soil').value || '',
                lastCrop: q('#field-lastcrop').value || '',
                notes: q('#field-notes').value || '',
                geometry: null
            };
            const geoText = q('#field-geojson').value.trim();
            if (geoText) {
                try { rec.geometry = JSON.parse(geoText); } catch (err) { alert('Invalid GeoJSON'); return; }
            }
            const created = await saveRecord('fields', rec);
            // if a photo was attached, store it as an attachment and link
            const f = q('#field-photo').files && q('#field-photo').files[0];
            if (f) {
                try {
                    const a = await dbAdd('attachments', { filename: f.name, mimeType: f.type, description: 'Field photo', blob: f, linkedTo: { module: 'fields', id: created.id } });
                    await updateRecord('fields', created.id, { photos: [a.id] });
                } catch (err) { console.warn('Field photo save failed', err); }
            }
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
            const created = await saveRecord('activities', rec);
            const f = q('#act-photo').files && q('#act-photo').files[0];
            if (f) {
                try {
                    const a = await dbAdd('attachments', { filename: f.name, mimeType: f.type, description: 'Activity photo', blob: f, linkedTo: { module: 'activities', id: created.id } });
                    await updateRecord('activities', created.id, { photos: [a.id] });
                } catch (err) { console.warn('Activity photo save failed', err); }
            }
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

    // Defer initial heavy rendering and map initialization until window.load so
    // stylesheets and other resources are fully loaded. This avoids forcing
    // layout during page load which can cause flashes of unstyled content and
    // the "Layout was forced before the page was fully loaded" warning.
    window.addEventListener('load', async () => {
        try {
            await renderAll();
            await renderAnimalsList();
            await wireAnimalUI();
        } catch (err) {
            console.warn('Initial render failed', err);
        }

        // initialize map for fields (if Leaflet loaded)
        try { await initFieldMap(); } catch (err) { console.warn('Map init skipped', err); }

        // refresh fields summary after full load
        try { await updateFieldsSummary(); } catch (err) { /* non-critical */ }
    });

    // Wire quick actions in Fields map view
    q('#btn-new-field')?.addEventListener('click', () => {
        // switch to Manage sub-section and focus name input
        showSection('fields');
        showSubSection('fields', 'manage');
        setTimeout(() => q('#field-name')?.focus(), 200);
    });
    q('#btn-refresh-fields')?.addEventListener('click', async () => { await renderAll(); });
    q('#btn-export-fields')?.addEventListener('click', async () => {
        const fields = await getRecords('fields');
        const gj = { type: 'FeatureCollection', features: (fields || []).map(f => ({ type: 'Feature', properties: { id: f.id, name: f.name, area: f.area, soilType: f.soilType }, geometry: f.geometry || null })) };
        const blob = new Blob([JSON.stringify(gj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `fields-${new Date().toISOString().slice(0,10)}.geojson`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    // refresh fields summary and recent list
    async function updateFieldsSummary() {
        const sumsEl = q('#fields-summary');
        const recentEl = q('#fields-recent-list');
        const fields = await getRecords('fields');
        if (sumsEl) sumsEl.innerHTML = `<div><strong>Total fields:</strong> ${fields.length}</div><div><strong>Total area (ha):</strong> ${fields.reduce((s,f)=>s + (Number(f.area)||0),0).toFixed(2)}</div>`;
        if (recentEl) {
            recentEl.innerHTML = '';
            const recent = fields.slice(-6).reverse();
            if (recent.length === 0) recentEl.innerHTML = '<div class="muted">No fields yet.</div>';
            for (const f of recent) {
                const div = document.createElement('div'); div.style.display='flex'; div.style.alignItems='center'; div.style.gap='8px';
                const name = document.createElement('div'); name.textContent = f.name || 'Unnamed'; name.style.fontWeight='600';
                const meta = document.createElement('div'); meta.style.marginLeft='auto'; meta.className='muted'; meta.textContent = `${(f.area || '') ? Number(f.area).toFixed(2)+' ha' : ''}`;
                div.appendChild(name); div.appendChild(meta);
                recentEl.appendChild(div);
            }
        }
    }
    // call once now
    updateFieldsSummary();

    // Reporting UI wiring
    const reportSelect = q('#report-select');
    const reportViewBtn = q('#report-view-btn');
    const reportDownloadBtn = q('#report-download-btn');
    if (reportSelect) populateReportDropdown();
    if (reportViewBtn) reportViewBtn.addEventListener('click', async () => {
        const id = reportSelect && reportSelect.value;
        await viewReport(id);
    });
    if (reportDownloadBtn) reportDownloadBtn.addEventListener('click', async () => {
        const id = reportSelect && reportSelect.value;
        await downloadReportDoc(id);
    });

    // Fields table actions (edit/delete)
    const fieldsTable = q('#fields-table');
    if (fieldsTable) {
        fieldsTable.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('edit-field')) {
                const recs = await getRecords('fields');
                const rec = recs.find(r => r.id === id);
                if (rec) openModalEditor('fields', rec);
            } else if (btn.classList.contains('delete-field')) {
                if (confirm('Delete field?')) {
                    await deleteRecord('fields', id);
                    await renderAll();
                }
            }
        });
    }
});

// Register service worker (keep using existing sw if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registered', reg.scope))
            .catch(err => console.warn('SW failed', err));
    });
}