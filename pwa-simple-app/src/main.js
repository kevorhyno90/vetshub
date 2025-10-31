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
    
    // Trigger content rendering for the specific section
    if (module === 'animals') {
        if (sub === 'list') renderAnimalsList();
        else if (sub === 'breeding') renderBreedingList();
        else if (sub === 'health') renderHealthList();
        else if (sub === 'performance') renderPerformanceList();
        else if (sub === 'genealogy') updateGenealogySelect();
    }
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
    const listEl = q(`#animals-${module}-list`);
    if (!listEl) return;
    listEl.addEventListener('click', async (e) => {
        const item = e.target.closest('.item');
        if (!item) return;
        const id = item.dataset.id;
        if (e.target.classList.contains('delete')) {
            if (confirm('Delete record?')) {
                await deleteRecord(module, id);
                if (module === 'breeding') await renderBreedingList();
                else if (module === 'health') await renderHealthList();
                else if (module === 'performance') await renderPerformanceList();
                else await renderAll();
            }
        } else if (e.target.classList.contains('edit')) {
            // open custom editor for this record
            const recs = await getRecords(module);
            const rec = recs.find(r => r.id === id);
            if (!rec) return;
            
            if (module === 'breeding') {
                showBreedingEditor(true);
                populateBreedingForm(rec);
            } else if (module === 'health') {
                showHealthEditor(true);
                populateHealthForm(rec);
            } else if (module === 'performance') {
                showPerformanceEditor(true);
                populatePerformanceForm(rec);
            } else {
                openModalEditor(module, rec);
            }
        }
    });
}

// Form population functions
function populateBreedingForm(rec) {
    q('#breeding-female').value = rec.female || '';
    q('#breeding-male').value = rec.male || '';
    q('#breeding-date').value = rec.date || '';
    q('#breeding-method').value = rec.method || 'natural';
    q('#breeding-expected-due').value = rec.expectedDue || '';
    q('#breeding-status').value = rec.status || 'bred';
    q('#breeding-offspring').value = (rec.offspring || []).join(', ');
    q('#breeding-notes').value = rec.notes || '';
    
    // Store record ID for updating
    q('#breeding-form').dataset.recordId = rec.id;
}

function populateHealthForm(rec) {
    q('#health-animal').value = rec.animal || '';
    q('#health-date').value = rec.date || '';
    q('#health-type').value = rec.type || '';
    q('#health-description').value = rec.description || '';
    q('#health-veterinarian').value = rec.veterinarian || '';
    q('#health-cost').value = rec.cost || '';
    q('#health-weight').value = rec.weight || '';
    q('#health-next-due').value = rec.nextDue || '';
    q('#health-notes').value = rec.notes || '';
    
    // Store record ID for updating
    q('#health-form').dataset.recordId = rec.id;
}

function populatePerformanceForm(rec) {
    q('#performance-animal').value = rec.animal || '';
    q('#performance-date').value = rec.date || '';
    q('#performance-type').value = rec.type || '';
    q('#performance-value').value = rec.value || '';
    q('#performance-unit').value = rec.unit || '';
    q('#performance-notes').value = rec.notes || '';
    
    // Store record ID for updating
    q('#performance-form').dataset.recordId = rec.id;
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
        
        // Animal management sections
        await renderAnimalsList();
        await renderBreedingList();
        await renderHealthList();
        await renderPerformanceList();
        await updateGenealogySelect();
        
        // Make sure animals section is properly initialized
        const animalsSection = q('#animals');
        if (animalsSection) {
            // Show the first sub-section (animals list) by default
            showSubSection('animals', 'list');
        }
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

async function createSampleAnimal() {
    const sampleAnimal = {
        tag: 'A001',
        name: 'Bessie',
        species: 'cattle',
        breed: 'Holstein',
        sex: 'female',
        dob: '2023-03-15',
        weight: 450,
        location: 'Pasture 1',
        status: 'active',
        notes: 'Sample animal for testing'
    };
    
    try {
        await saveRecord('animals', sampleAnimal);
        await renderAnimalsList();
        alert('Sample animal created successfully!');
    } catch (err) {
        alert('Failed to create sample animal: ' + err);
    }
}

// Make function globally accessible
window.createSampleAnimal = createSampleAnimal;

async function createSampleBreeding() {
    const sampleBreeding = {
        female: 'A001',
        male: 'B002',
        date: '2024-09-15',
        method: 'natural',
        expectedDue: '2025-06-15',
        status: 'bred',
        notes: 'Sample breeding record for testing'
    };
    
    try {
        await saveRecord('breeding', sampleBreeding);
        await renderBreedingList();
        alert('Sample breeding record created successfully!');
    } catch (err) {
        alert('Failed to create sample breeding record: ' + err);
    }
}

window.createSampleBreeding = createSampleBreeding;

async function createSampleHealth() {
    const sampleHealth = {
        animal: 'A001',
        date: '2024-10-01',
        type: 'vaccination',
        description: 'Annual vaccination - FMD',
        veterinarian: 'Dr. Smith',
        cost: 25.00,
        nextDue: '2025-10-01',
        notes: 'Sample health record for testing'
    };
    
    try {
        await saveRecord('health', sampleHealth);
        await renderHealthList();
        alert('Sample health record created successfully!');
    } catch (err) {
        alert('Failed to create sample health record: ' + err);
    }
}

async function createSamplePerformance() {
    const samplePerformance = {
        animal: 'A001',
        date: '2024-10-20',
        type: 'weight',
        value: 475,
        unit: 'kg',
        notes: 'Sample performance record for testing'
    };
    
    try {
        await saveRecord('performance', samplePerformance);
        await renderPerformanceList();
        alert('Sample performance record created successfully!');
    } catch (err) {
        alert('Failed to create sample performance record: ' + err);
    }
}

window.createSampleHealth = createSampleHealth;
window.createSamplePerformance = createSamplePerformance;
window.clearAnimalFilters = clearAnimalFilters;
window.editAnimal = editAnimal;
window.duplicateAnimal = duplicateAnimal;
window.deleteAnimal = deleteAnimal;

// Inline editing functionality
function addInlineEditing() {
    const editableCells = document.querySelectorAll('.editable-cell');
    editableCells.forEach(cell => {
        cell.addEventListener('click', function() {
            if (this.querySelector('.inline-edit')) return; // Already editing
            
            const currentText = this.textContent.trim();
            const field = this.dataset.field;
            const animalId = this.closest('tr').dataset.animalId;
            
            // Create input element
            const input = document.createElement('input');
            input.className = 'inline-edit';
            input.value = currentText === '-' ? '' : currentText;
            input.type = field === 'weight' ? 'number' : 'text';
            
            // Replace content with input
            this.innerHTML = '';
            this.appendChild(input);
            this.classList.add('editing-cell');
            input.focus();
            input.select();
            
            // Save on blur or Enter
            const saveEdit = async () => {
                const newValue = input.value.trim();
                this.classList.remove('editing-cell');
                
                try {
                    // Update the record
                    const animals = await getRecords('animals');
                    const animal = animals.find(a => a.id === animalId);
                    if (animal) {
                        animal[field] = newValue || null;
                        await updateRecord('animals', animalId, animal);
                        
                        // Update the cell display
                        this.textContent = newValue || '-';
                        
                        // Refresh statistics
                        updateAnimalStats(animals);
                    }
                } catch (err) {
                    alert('Failed to update: ' + err);
                    this.textContent = currentText; // Revert on error
                }
            };
            
            const cancelEdit = () => {
                this.classList.remove('editing-cell');
                this.textContent = currentText;
            };
            
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            });
        });
    });
}

async function editAnimal(id) {
    const animals = await getRecords('animals');
    const animal = animals.find(a => a.id === id);
    if (!animal) {
        alert('Animal not found');
        return;
    }
    
    _currentAnimalId = id;
    showAnimalEditor(true, animal);
    q('#animal-editor-title').textContent = `Edit Animal: ${animal.tag || animal.name || id}`;
}

async function duplicateAnimal(id) {
    const animals = await getRecords('animals');
    const animal = animals.find(a => a.id === id);
    if (!animal) {
        alert('Animal not found');
        return;
    }
    
    // Create a copy with modified tag
    const copy = { ...animal };
    delete copy.id; // Remove ID so it gets a new one
    copy.tag = (copy.tag || '') + '_copy';
    copy.name = (copy.name || '') + ' (Copy)';
    
    _currentAnimalId = null;
    showAnimalEditor(true, copy);
    q('#animal-editor-title').textContent = 'Duplicate Animal';
}

async function deleteAnimal(id) {
    const animals = await getRecords('animals');
    const animal = animals.find(a => a.id === id);
    if (!animal) {
        alert('Animal not found');
        return;
    }
    
    const animalName = animal.tag || animal.name || id;
    if (!confirm(`Are you sure you want to delete animal "${animalName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        await deleteRecord('animals', id);
        await renderAnimalsList();
        alert('Animal deleted successfully');
    } catch (err) {
        alert('Delete failed: ' + err);
    }
}

async function renderAnimalsList() {
    const tableBody = q('#animals-table-body');
    if (!tableBody) return;
    
    const recs = await getRecords('animals');
    const searchTerm = q('#animal-search')?.value?.toLowerCase() || '';
    const speciesFilter = q('#animal-filter-species')?.value || '';
    const statusFilter = q('#animal-filter-status')?.value || '';
    
    let filteredRecs = recs || [];
    
    // Apply filters
    if (searchTerm) {
        filteredRecs = filteredRecs.filter(r => 
            (r.tag || '').toLowerCase().includes(searchTerm) ||
            (r.name || '').toLowerCase().includes(searchTerm) ||
            (r.breed || '').toLowerCase().includes(searchTerm) ||
            (r.species || '').toLowerCase().includes(searchTerm)
        );
    }
    if (speciesFilter) {
        filteredRecs = filteredRecs.filter(r => r.species === speciesFilter);
    }
    if (statusFilter) {
        filteredRecs = filteredRecs.filter(r => r.status === statusFilter);
    }
    
    // Update statistics
    updateAnimalStats(recs || []);
    
    if (!filteredRecs || filteredRecs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="13" style="text-align:center;padding:40px;color:#666">
                    <div style="margin-bottom:16px">
                        <strong>No animals found</strong>
                        ${searchTerm || speciesFilter || statusFilter ? '<br>Try adjusting your filters' : ''}
                    </div>
                    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
                        <button class="btn" onclick="document.getElementById('btn-new-animal').click()">➕ Add First Animal</button>
                        <button class="btn secondary" onclick="createSampleAnimal()">🐄 Add Sample Animal</button>
                        ${searchTerm || speciesFilter || statusFilter ? '<button class="btn secondary" onclick="clearAnimalFilters()">🔄 Clear Filters</button>' : ''}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Build table rows
    const rows = filteredRecs.map(animal => {
        const age = animal.dob ? calculateAge(animal.dob) : '-';
        const statusBadge = animal.status ? `<span class="status-badge status-${animal.status}">${animal.status}</span>` : '-';
        
        return `
            <tr data-animal-id="${animal.id}">
                <td class="editable-cell" data-field="tag">${animal.tag || '-'}</td>
                <td class="editable-cell" data-field="name">${animal.name || '-'}</td>
                <td class="editable-cell" data-field="species">${animal.species || '-'}</td>
                <td class="editable-cell" data-field="breed">${animal.breed || '-'}</td>
                <td class="editable-cell" data-field="sex">${animal.sex || '-'}</td>
                <td>${age}</td>
                <td class="editable-cell" data-field="weight">${animal.weight || '-'}</td>
                <td>${statusBadge}</td>
                <td class="editable-cell" data-field="location">${animal.location || '-'}</td>
                <td class="editable-cell" data-field="sire">${animal.sire || '-'}</td>
                <td class="editable-cell" data-field="dam">${animal.dam || '-'}</td>
                <td class="editable-cell" data-field="notes" title="${animal.notes || ''}">${truncateText(animal.notes || '', 20)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn" onclick="editAnimal('${animal.id}')" title="Edit">✏️</button>
                        <button class="btn secondary" onclick="duplicateAnimal('${animal.id}')" title="Duplicate">📋</button>
                        <button class="btn secondary" onclick="deleteAnimal('${animal.id}')" title="Delete">�️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
    
    // Add inline editing functionality
    addInlineEditing();
}

function updateAnimalStats(animals) {
    const total = animals.length;
    const active = animals.filter(a => a.status === 'active').length;
    const breeding = animals.filter(a => ['breeding', 'pregnant', 'lactating'].includes(a.status)).length;
    const needsAttention = animals.filter(a => ['sick', 'quarantine'].includes(a.status)).length;
    
    q('#total-animals-count').textContent = total;
    q('#active-animals-count').textContent = active;
    q('#breeding-animals-count').textContent = breeding;
    q('#attention-animals-count').textContent = needsAttention;
}

function truncateText(text, maxLength) {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function clearAnimalFilters() {
    q('#animal-search').value = '';
    q('#animal-filter-species').value = '';
    q('#animal-filter-status').value = '';
    renderAnimalsList();
}

function calculateAge(dob) {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    const ageInMs = today - birthDate;
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) return `${ageInDays}d`;
    if (ageInDays < 365) return `${Math.floor(ageInDays / 30)}m`;
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    return months > 0 ? `${years}y ${months}m` : `${years}y`;
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
    
    const age = rec.dob ? calculateAge(rec.dob) : '';
    const statusBadge = rec.status ? `<span class="status-badge status-${rec.status}">${rec.status}</span>` : '';
    
    if (titleEl) titleEl.textContent = `${rec.tag || rec.id} — ${rec.species || ''}`;
    if (detailEl) {
        detailEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                <h5 style="margin:0">${rec.name || rec.tag || rec.id}</h5>
                ${statusBadge}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
                <div><strong>Tag:</strong> ${rec.tag || ''}</div>
                <div><strong>Species:</strong> ${rec.species || ''}</div>
                <div><strong>Breed:</strong> ${rec.breed || ''}</div>
                <div><strong>Sex:</strong> ${rec.sex || ''}</div>
                <div><strong>Age:</strong> ${age}</div>
                <div><strong>Weight:</strong> ${rec.weight ? rec.weight + ' kg' : ''}</div>
            </div>
            <div style="margin-bottom:8px">
                <strong>Parents:</strong> 
                <div class="muted">${rec.sire ? 'Sire: ' + rec.sire : ''} ${rec.dam ? 'Dam: ' + rec.dam : ''}</div>
            </div>
            ${rec.location ? `<div style="margin-bottom:8px"><strong>Location:</strong> ${rec.location}</div>` : ''}
            ${rec.notes ? `<div><strong>Notes:</strong><div class="muted">${rec.notes}</div></div>` : ''}
        `;
    }
}

function showAnimalEditor(show, record = null) {
    console.log('showAnimalEditor called:', show, record); // Debug log
    const editor = q('#animal-editor');
    const form = q('#animal-editor-form');
    console.log('Editor elements found:', editor, form); // Debug log
    if (!editor || !form) return;
    if (!show) { editor.style.display = 'none'; return; }
    editor.style.display = '';
    
    // populate all fields
    q('#edit-animal-tag').value = record?.tag || '';
    q('#edit-animal-name').value = record?.name || '';
    q('#edit-animal-species').value = record?.species || '';
    q('#edit-animal-sex').value = record?.sex || '';
    q('#edit-animal-dob').value = record?.dob || '';
    q('#edit-animal-weight').value = record?.weight || '';
    q('#edit-animal-breed').value = record?.breed || '';
    q('#edit-animal-sire').value = record?.sire || '';
    q('#edit-animal-dam').value = record?.dam || '';
    q('#edit-animal-location').value = record?.location || '';
    q('#edit-animal-status').value = record?.status || 'active';
    q('#edit-animal-notes').value = record?.notes || '';
}

async function wireAnimalUI() {
    console.log('Wiring animal UI...'); // Debug log
    
    // New animal button
    const newBtn = q('#btn-new-animal');
    console.log('New animal button found:', newBtn); // Debug log
    newBtn?.addEventListener('click', () => {
        console.log('New animal button clicked'); // Debug log
        _currentAnimalId = null;
        showAnimalEditor(true, {});
        q('#animal-editor-title').textContent = 'Add New Animal';
    });

    // Clear filters button
    q('#btn-clear-filters')?.addEventListener('click', clearAnimalFilters);

    // Export animals button
    q('#btn-export-animals')?.addEventListener('click', async () => {
        const animals = await getRecords('animals');
        if (!animals || animals.length === 0) {
            alert('No animals to export');
            return;
        }
        
        // Create CSV content
        const headers = ['Tag/ID', 'Name', 'Species', 'Breed', 'Sex', 'Date of Birth', 'Weight (kg)', 'Status', 'Location', 'Sire', 'Dam', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...animals.map(a => [
                a.tag || '',
                a.name || '',
                a.species || '',
                a.breed || '',
                a.sex || '',
                a.dob || '',
                a.weight || '',
                a.status || '',
                a.location || '',
                a.sire || '',
                a.dam || '',
                (a.notes || '').replace(/,/g, ';') // Replace commas in notes
            ].map(field => `"${field}"`).join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `animals_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    });

    // Cancel editor
    q('#animal-cancel-btn')?.addEventListener('click', () => {
        showAnimalEditor(false);
    });

    // Save editor
    q('#animal-editor-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rec = {
            tag: q('#edit-animal-tag').value.trim(),
            name: q('#edit-animal-name').value.trim(),
            species: q('#edit-animal-species').value.trim(),
            sex: q('#edit-animal-sex').value || '',
            dob: q('#edit-animal-dob').value || '',
            weight: parseFloat(q('#edit-animal-weight').value) || null,
            breed: q('#edit-animal-breed').value.trim(),
            sire: q('#edit-animal-sire').value.trim(),
            dam: q('#edit-animal-dam').value.trim(),
            location: q('#edit-animal-location').value.trim(),
            status: q('#edit-animal-status').value || 'active',
            notes: q('#edit-animal-notes').value.trim()
        };
        
        if (!rec.tag) return alert('Tag/ID is required');
        if (!rec.species) return alert('Species is required');
        
        try {
            if (_currentAnimalId) {
                await updateRecord('animals', _currentAnimalId, rec);
            } else {
                const created = await saveRecord('animals', rec);
                _currentAnimalId = created && created.id ? created.id : null;
            }
            showAnimalEditor(false);
            await renderAnimalsList();
            alert('Animal saved successfully!');
        } catch (err) { 
            alert('Save failed: ' + err); 
        }
    });

    // Search and filter handlers
    q('#animal-search')?.addEventListener('input', debounce(renderAnimalsList, 300));
    q('#animal-filter-species')?.addEventListener('change', renderAnimalsList);
    q('#animal-filter-status')?.addEventListener('change', renderAnimalsList);

    // BREEDING MANAGEMENT
    wireBreedingUI();
    
    // HEALTH MANAGEMENT
    wireHealthUI();
    
    // GENEALOGY MANAGEMENT
    wireGenealogyUI();
    
    // PERFORMANCE MANAGEMENT
    wirePerformanceUI();
}

function wireBreedingUI() {
    // New breeding button
    q('#btn-new-breeding')?.addEventListener('click', () => {
        showBreedingEditor(true);
        q('#breeding-form').reset();
    });

    // Breeding form submit
    q('#breeding-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const recordId = form.dataset.recordId;
        
        const rec = {
            female: q('#breeding-female').value.trim(),
            male: q('#breeding-male').value.trim(),
            date: q('#breeding-date').value,
            method: q('#breeding-method').value || 'natural',
            expectedDue: q('#breeding-expected-due').value || '',
            status: q('#breeding-status').value || 'bred',
            offspring: q('#breeding-offspring').value.split(',').map(s => s.trim()).filter(Boolean),
            notes: q('#breeding-notes').value.trim()
        };
        
        if (!rec.female || !rec.date) return alert('Female ID and breeding date are required');
        
        try {
            if (recordId) {
                await updateRecord('breeding', recordId, rec);
            } else {
                await saveRecord('breeding', rec);
            }
            showBreedingEditor(false);
            delete form.dataset.recordId;
            await renderBreedingList();
        } catch (err) { alert('Save failed: ' + err); }
    });

    // Cancel breeding form
    q('#breeding-cancel')?.addEventListener('click', () => {
        showBreedingEditor(false);
    });

    // Breeding list click handlers
    wireListActions('breeding');
}

function wireHealthUI() {
    // New health record button
    q('#btn-new-health')?.addEventListener('click', () => {
        showHealthEditor(true);
        q('#health-form').reset();
    });

    // Health form submit
    q('#health-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const recordId = form.dataset.recordId;
        
        const rec = {
            animal: q('#health-animal').value.trim(),
            date: q('#health-date').value,
            type: q('#health-type').value,
            description: q('#health-description').value.trim(),
            veterinarian: q('#health-veterinarian').value.trim(),
            cost: parseFloat(q('#health-cost').value) || null,
            weight: parseFloat(q('#health-weight').value) || null,
            nextDue: q('#health-next-due').value || '',
            notes: q('#health-notes').value.trim()
        };
        
        if (!rec.animal || !rec.date || !rec.type || !rec.description) {
            return alert('Animal ID, date, type, and description are required');
        }
        
        try {
            if (recordId) {
                await updateRecord('health', recordId, rec);
            } else {
                await saveRecord('health', rec);
            }
            showHealthEditor(false);
            delete form.dataset.recordId;
            await renderHealthList();
        } catch (err) { alert('Save failed: ' + err); }
    });

    // Cancel health form
    q('#health-cancel')?.addEventListener('click', () => {
        showHealthEditor(false);
    });

    // Health search and filter
    q('#health-search')?.addEventListener('input', debounce(renderHealthList, 300));
    q('#health-filter-type')?.addEventListener('change', renderHealthList);

    // Health list click handlers
    wireListActions('health');
}

function wireGenealogyUI() {
    // Genealogy animal selection
    q('#genealogy-animal')?.addEventListener('change', (e) => {
        const animalId = e.target.value;
        if (animalId) {
            renderGenealogyTree(animalId);
        } else {
            q('#genealogy-tree').innerHTML = 'Select an animal to view its family tree';
            q('#genealogy-offspring').innerHTML = 'Select an animal to view offspring';
        }
    });
}

function wirePerformanceUI() {
    // New performance record button
    q('#btn-new-performance')?.addEventListener('click', () => {
        showPerformanceEditor(true);
        q('#performance-form').reset();
    });

    // Performance form submit
    q('#performance-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const recordId = form.dataset.recordId;
        
        const rec = {
            animal: q('#performance-animal').value.trim(),
            date: q('#performance-date').value,
            type: q('#performance-type').value,
            value: parseFloat(q('#performance-value').value),
            unit: q('#performance-unit').value.trim(),
            notes: q('#performance-notes').value.trim()
        };
        
        if (!rec.animal || !rec.date || !rec.type || isNaN(rec.value)) {
            return alert('Animal ID, date, type, and value are required');
        }
        
        try {
            if (recordId) {
                await updateRecord('performance', recordId, rec);
            } else {
                await saveRecord('performance', rec);
            }
            showPerformanceEditor(false);
            delete form.dataset.recordId;
            await renderPerformanceList();
        } catch (err) { alert('Save failed: ' + err); }
    });

    // Cancel performance form
    q('#performance-cancel')?.addEventListener('click', () => {
        showPerformanceEditor(false);
    });

    // Performance search and filter
    q('#performance-search')?.addEventListener('input', debounce(renderPerformanceList, 300));
    q('#performance-filter-type')?.addEventListener('change', renderPerformanceList);

    // Performance list click handlers
    wireListActions('performance');
}

// Editor display functions
function showBreedingEditor(show) {
    const editor = q('#breeding-editor');
    if (!editor) return;
    editor.style.display = show ? '' : 'none';
}

function showHealthEditor(show) {
    const editor = q('#health-editor');
    if (!editor) return;
    editor.style.display = show ? '' : 'none';
}

function showPerformanceEditor(show) {
    const editor = q('#performance-editor');
    if (!editor) return;
    editor.style.display = show ? '' : 'none';
}

// BREEDING MANAGEMENT
async function renderBreedingList() {
    const listEl = q('#animals-breeding-list');
    if (!listEl) return;
    
    const recs = await getRecords('breeding') || [];
    if (recs.length === 0) {
        listEl.innerHTML = `
            <div class="muted">No breeding records.</div>
            <button class="btn secondary" onclick="createSampleBreeding()" style="margin-top:8px">Add sample breeding record</button>
        `;
        return;
    }
    
    const items = recs.map(r => {
        const statusBadge = `<span class="record-type type-breeding">${r.status || 'bred'}</span>`;
        const dueDate = r.expectedDue ? new Date(r.expectedDue).toLocaleDateString() : '';
        return `
            <div class="item" data-id="${r.id}">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <strong>${r.female} × ${r.male || 'Unknown'}</strong>
                        ${statusBadge}
                    </div>
                    <div class="muted">
                        ${new Date(r.date).toLocaleDateString()} • ${r.method || 'natural'}
                        ${dueDate ? ' • Due: ' + dueDate : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn secondary edit">Edit</button>
                    <button class="btn secondary delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    listEl.innerHTML = items;
    
    updateBreedingStats();
    updatePregnancyCalendar();
}

async function updateBreedingStats() {
    const breedingRecs = await getRecords('breeding') || [];
    const thisYear = new Date().getFullYear();
    const thisYearBreedings = breedingRecs.filter(r => new Date(r.date).getFullYear() === thisYear);
    const successful = breedingRecs.filter(r => r.status === 'confirmed' || r.status === 'born');
    const pregnant = breedingRecs.filter(r => r.status === 'confirmed');
    
    const thisMonth = new Date().getMonth();
    const dueThisMonth = breedingRecs.filter(r => 
        r.expectedDue && new Date(r.expectedDue).getMonth() === thisMonth
    );
    
    q('#stat-total-breedings').textContent = thisYearBreedings.length;
    q('#stat-success-rate').textContent = breedingRecs.length > 0 ? 
        Math.round((successful.length / breedingRecs.length) * 100) + '%' : '0%';
    q('#stat-pregnant').textContent = pregnant.length;
    q('#stat-due-month').textContent = dueThisMonth.length;
}

async function updatePregnancyCalendar() {
    const calendarEl = q('#pregnancy-calendar');
    if (!calendarEl) return;
    
    const breedingRecs = await getRecords('breeding') || [];
    const pregnant = breedingRecs.filter(r => r.status === 'confirmed' && r.expectedDue);
    
    if (pregnant.length === 0) {
        calendarEl.innerHTML = 'No current pregnancies';
        return;
    }
    
    const sorted = pregnant.sort((a, b) => new Date(a.expectedDue) - new Date(b.expectedDue));
    const items = sorted.map(r => {
        const dueDate = new Date(r.expectedDue);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const urgency = daysUntilDue <= 7 ? 'color: #d73527' : daysUntilDue <= 30 ? 'color: #f57c00' : '';
        
        return `
            <div style="padding:8px;border-bottom:1px solid #eee;${urgency}">
                <strong>${r.female}</strong> - Due: ${dueDate.toLocaleDateString()}
                <span style="font-size:12px">(${daysUntilDue > 0 ? daysUntilDue + ' days' : 'Overdue'})</span>
            </div>
        `;
    }).join('');
    
    calendarEl.innerHTML = items;
}

// HEALTH MANAGEMENT
async function renderHealthList() {
    const listEl = q('#animals-health-list');
    if (!listEl) return;
    
    const recs = await getRecords('health') || [];
    const searchTerm = q('#health-search')?.value?.toLowerCase() || '';
    const typeFilter = q('#health-filter-type')?.value || '';
    
    let filteredRecs = recs;
    if (searchTerm) {
        filteredRecs = filteredRecs.filter(r => 
            (r.animal || '').toLowerCase().includes(searchTerm)
        );
    }
    if (typeFilter) {
        filteredRecs = filteredRecs.filter(r => r.type === typeFilter);
    }
    
    if (filteredRecs.length === 0) {
        listEl.innerHTML = `
            <div class="muted">No health records found.</div>
            <button class="btn secondary" onclick="createSampleHealth()" style="margin-top:8px">Add sample health record</button>
        `;
        return;
    }
    
    const items = filteredRecs.map(r => {
        const typeBadge = `<span class="record-type type-${r.type}">${r.type}</span>`;
        const nextDue = r.nextDue ? new Date(r.nextDue).toLocaleDateString() : '';
        return `
            <div class="item" data-id="${r.id}">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <strong>${r.animal}</strong>
                        ${typeBadge}
                    </div>
                    <div class="muted">
                        ${new Date(r.date).toLocaleDateString()} • ${r.description}
                        ${r.veterinarian ? ' • Dr. ' + r.veterinarian : ''}
                    </div>
                    ${nextDue ? `<div class="muted" style="font-size:12px">Next due: ${nextDue}</div>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn secondary edit">Edit</button>
                    <button class="btn secondary delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    listEl.innerHTML = items;
    
    updateHealthOverview();
}

async function updateHealthOverview() {
    const healthRecs = await getRecords('health') || [];
    const today = new Date();
    const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisMonth = today.getMonth();
    
    const needsAttention = healthRecs.filter(r => 
        r.nextDue && new Date(r.nextDue) <= oneWeek
    ).length;
    
    const vaccinationsDue = healthRecs.filter(r => 
        r.type === 'vaccination' && r.nextDue && new Date(r.nextDue) <= oneWeek
    ).length;
    
    const thisMonthEvents = healthRecs.filter(r => 
        new Date(r.date).getMonth() === thisMonth
    ).length;
    
    q('#stat-needs-attention').textContent = needsAttention;
    q('#stat-vaccinations-due').textContent = vaccinationsDue;
    q('#stat-health-month').textContent = thisMonthEvents;
}

// GENEALOGY MANAGEMENT
async function updateGenealogySelect() {
    const selectEl = q('#genealogy-animal');
    if (!selectEl) return;
    
    const animals = await getRecords('animals') || [];
    const options = animals.map(a => 
        `<option value="${a.id}">${a.tag || a.id} - ${a.species || ''}</option>`
    ).join('');
    
    selectEl.innerHTML = '<option value="">--Select Animal--</option>' + options;
}

async function renderGenealogyTree(animalId) {
    const treeEl = q('#genealogy-tree');
    if (!treeEl || !animalId) return;
    
    const animals = await getRecords('animals') || [];
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const tree = buildFamilyTree(animal, animals, 0);
    treeEl.innerHTML = `<pre>${tree}</pre>`;
    
    updateGenealogyOffspring(animalId);
    updateGenealogyStats(animalId);
}

function buildFamilyTree(animal, allAnimals, depth = 0) {
    const indent = '  '.repeat(depth);
    let tree = `${indent}${animal.tag || animal.id} (${animal.sex || '?'}) - ${animal.species || ''}\n`;
    
    if (depth < 3) { // Limit depth to prevent infinite recursion
        const sire = animal.sire ? allAnimals.find(a => a.tag === animal.sire || a.id === animal.sire) : null;
        const dam = animal.dam ? allAnimals.find(a => a.tag === animal.dam || a.id === animal.dam) : null;
        
        if (sire) {
            tree += `${indent}├─ Sire: ${buildFamilyTree(sire, allAnimals, depth + 1)}`;
        }
        if (dam) {
            tree += `${indent}└─ Dam: ${buildFamilyTree(dam, allAnimals, depth + 1)}`;
        }
    }
    
    return tree;
}

async function updateGenealogyOffspring(animalId) {
    const offspringEl = q('#genealogy-offspring');
    if (!offspringEl || !animalId) return;
    
    const animals = await getRecords('animals') || [];
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const offspring = animals.filter(a => 
        a.sire === animal.tag || a.sire === animal.id ||
        a.dam === animal.tag || a.dam === animal.id
    );
    
    if (offspring.length === 0) {
        offspringEl.innerHTML = '<div class="muted">No offspring recorded</div>';
        return;
    }
    
    const items = offspring.map(o => `
        <div style="padding:6px;border-bottom:1px solid #eee">
            <strong>${o.tag || o.id}</strong> - ${o.species || ''}
            <div class="muted">${o.dob ? new Date(o.dob).toLocaleDateString() : ''}</div>
        </div>
    `).join('');
    
    offspringEl.innerHTML = items;
}

async function updateGenealogyStats(animalId) {
    if (!animalId) {
        q('#stat-generation').textContent = '-';
        q('#stat-total-offspring').textContent = '-';
        q('#stat-breeding-value').textContent = '-';
        return;
    }
    
    const animals = await getRecords('animals') || [];
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    // Calculate generation depth
    const generation = calculateGeneration(animal, animals);
    
    // Count offspring
    const offspring = animals.filter(a => 
        a.sire === animal.tag || a.sire === animal.id ||
        a.dam === animal.tag || a.dam === animal.id
    );
    
    // Basic breeding value calculation (simplified)
    const breedingValue = offspring.length > 0 ? 'Productive' : 'Unproven';
    
    q('#stat-generation').textContent = generation;
    q('#stat-total-offspring').textContent = offspring.length;
    q('#stat-breeding-value').textContent = breedingValue;
}

function calculateGeneration(animal, allAnimals, depth = 0) {
    if (depth > 10) return depth; // Prevent infinite recursion
    
    const sire = animal.sire ? allAnimals.find(a => a.tag === animal.sire || a.id === animal.sire) : null;
    const dam = animal.dam ? allAnimals.find(a => a.tag === animal.dam || a.id === animal.dam) : null;
    
    if (!sire && !dam) return depth + 1;
    
    const sireGen = sire ? calculateGeneration(sire, allAnimals, depth + 1) : depth + 1;
    const damGen = dam ? calculateGeneration(dam, allAnimals, depth + 1) : depth + 1;
    
    return Math.max(sireGen, damGen);
}

// PERFORMANCE MANAGEMENT
async function renderPerformanceList() {
    const listEl = q('#animals-performance-list');
    if (!listEl) return;
    
    const recs = await getRecords('performance') || [];
    const searchTerm = q('#performance-search')?.value?.toLowerCase() || '';
    const typeFilter = q('#performance-filter-type')?.value || '';
    
    let filteredRecs = recs;
    if (searchTerm) {
        filteredRecs = filteredRecs.filter(r => 
            (r.animal || '').toLowerCase().includes(searchTerm)
        );
    }
    if (typeFilter) {
        filteredRecs = filteredRecs.filter(r => r.type === typeFilter);
    }
    
    if (filteredRecs.length === 0) {
        listEl.innerHTML = '<div class="muted">No performance records found.</div>';
        return;
    }
    
    const items = filteredRecs.map(r => {
        const typeBadge = `<span class="record-type type-${r.type}">${r.type}</span>`;
        return `
            <div class="item" data-id="${r.id}">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <strong>${r.animal}</strong>
                        ${typeBadge}
                    </div>
                    <div class="muted">
                        ${new Date(r.date).toLocaleDateString()} • ${r.value} ${r.unit || ''}
                        ${r.notes ? ' • ' + r.notes : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn secondary edit">Edit</button>
                    <button class="btn secondary delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    listEl.innerHTML = items;
}

// Utility function for debouncing search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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