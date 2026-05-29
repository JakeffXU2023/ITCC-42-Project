/* import-students.js — Excel/CSV import for PTA Cashiering System */

(function () {
  /* ── inject SheetJS from CDN ── */
  function loadSheetJS(cb) {
    if (window.XLSX) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ── modal HTML ── */
  function createModal() {
    const existing = document.getElementById('import-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'import-modal-overlay';
    overlay.innerHTML = `
      <div id="import-modal">
        <div class="import-modal-header">
          <h2 class="import-modal-title">Import Students from Excel</h2>
          <button class="import-modal-close" id="import-close-btn" aria-label="Close">&times;</button>
        </div>

        <div class="import-modal-body">
          <!-- Step 1: Upload -->
          <div id="import-step-upload">
            <p class="import-hint">Upload an <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong> file. The first row should be the header row.</p>

            <div class="import-dropzone" id="import-dropzone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" aria-hidden="true">
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
                <polyline points="8 12 12 8 16 12"/>
                <line x1="12" y1="8" x2="12" y2="20"/>
              </svg>
              <p class="dropzone-label">Drag &amp; drop file here, or</p>
              <label class="btn btn-sm import-file-label" for="import-file-input">Browse file</label>
              <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv" style="display:none">
              <p class="dropzone-sub" id="import-file-name">No file selected</p>
            </div>

            <div class="import-template-hint">
              <strong>Expected columns (in any order):</strong>
              Student Name, SPTA, School Paper, School Org, Sports, Insurance, Graduation
              <br><span style="opacity:.7;font-size:12px;">Numeric fee columns are optional — leave blank or 0 if not yet paid.</span>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div id="import-step-preview" style="display:none;">
            <div class="import-preview-bar">
              <span id="import-preview-count"></span>
              <button class="btn btn-sm" id="import-back-btn">← Back</button>
            </div>
            <div class="import-table-wrap">
              <table id="import-preview-table">
                <thead id="import-preview-thead"></thead>
                <tbody id="import-preview-tbody"></tbody>
              </table>
            </div>
            <div class="import-map-section">
              <p class="import-hint" style="margin-bottom:8px;">Map columns from your file to the system fields below:</p>
              <div id="import-column-map" class="import-map-grid"></div>
            </div>
          </div>
        </div>

        <div class="import-modal-footer">
          <button class="btn btn-sm" id="import-cancel-btn">Cancel</button>
          <button class="btn btn-sm btn-primary" id="import-confirm-btn" style="display:none;">Import Students</button>
          <button class="btn btn-sm btn-primary" id="import-parse-btn" style="display:none;" disabled>Preview</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    injectStyles();
    bindModalEvents(overlay);
    return overlay;
  }

  /* ── styles ── */
  function injectStyles() {
    if (document.getElementById('import-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'import-modal-styles';
    style.textContent = `
      #import-modal-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,.45);
        display: flex; align-items: center; justify-content: center;
        animation: importFadeIn .15s ease;
      }
      @keyframes importFadeIn { from { opacity:0 } to { opacity:1 } }
      #import-modal {
        background: var(--bg, #fff);
        border-radius: 12px;
        width: min(680px, 95vw);
        max-height: 90vh;
        display: flex; flex-direction: column;
        box-shadow: 0 8px 32px rgba(0,0,0,.18);
        overflow: hidden;
        animation: importSlideUp .2s ease;
      }
      @keyframes importSlideUp { from { transform: translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }
      .import-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 22px 14px;
        border-bottom: 1px solid var(--border, #e5e7eb);
      }
      .import-modal-title { margin:0; font-size:17px; font-weight:600; color: var(--text, #111); }
      .import-modal-close {
        background:none; border:none; cursor:pointer; font-size:22px;
        color: var(--text-muted, #6b7280); line-height:1; padding:2px 6px;
        border-radius:6px;
      }
      .import-modal-close:hover { background: var(--hover, #f3f4f6); }
      .import-modal-body { padding:20px 22px; overflow-y:auto; flex:1; }
      .import-modal-footer {
        display:flex; gap:10px; justify-content:flex-end;
        padding:14px 22px; border-top:1px solid var(--border, #e5e7eb);
      }
      .import-hint { font-size:13.5px; color: var(--text-muted, #6b7280); margin-bottom:14px; line-height:1.5; }
      .import-dropzone {
        border: 2px dashed var(--border, #d1d5db);
        border-radius:10px; padding:36px 20px;
        text-align:center; transition: border-color .2s, background .2s;
        cursor:pointer; background: var(--bg-muted, #fafafa);
      }
      .import-dropzone.drag-over {
        border-color: var(--accent, #4f46e5);
        background: var(--accent-light, #eef2ff);
      }
      .import-dropzone.file-ready { border-color: #22c55e; background: #f0fdf4; }
      .dropzone-label { color: var(--text-muted, #6b7280); font-size:14px; margin:10px 0 8px; }
      .import-file-label { cursor:pointer; }
      .dropzone-sub { font-size:12px; color: var(--text-muted, #9ca3af); margin-top:8px; }
      .import-template-hint {
        margin-top:16px; background: var(--bg-muted, #f9fafb);
        border:1px solid var(--border, #e5e7eb); border-radius:8px;
        padding:12px 14px; font-size:12.5px; color: var(--text-muted, #6b7280);
        line-height:1.6;
      }
      .import-preview-bar {
        display:flex; align-items:center; justify-content:space-between;
        margin-bottom:12px;
      }
      #import-preview-count { font-size:13px; color: var(--text-muted, #6b7280); }
      .import-table-wrap { overflow-x:auto; border:1px solid var(--border, #e5e7eb); border-radius:8px; max-height:200px; overflow-y:auto; }
      #import-preview-table { width:100%; border-collapse:collapse; font-size:12.5px; }
      #import-preview-table th { background: var(--bg-muted, #f3f4f6); padding:7px 10px; text-align:left; font-weight:600; position:sticky;top:0; }
      #import-preview-table td { padding:6px 10px; border-top:1px solid var(--border, #f0f0f0); }
      .import-map-section { margin-top:18px; }
      .import-map-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .import-map-row { display:flex; flex-direction:column; gap:4px; }
      .import-map-label { font-size:12px; font-weight:600; color: var(--text, #374151); }
      .import-map-select { font-size:13px; padding:6px 8px; border:1px solid var(--border, #d1d5db); border-radius:6px; background: var(--bg, #fff); color: var(--text, #111); width:100%; }
      .btn-primary { background: var(--accent, #4f46e5) !important; color:#fff !important; border-color: var(--accent, #4f46e5) !important; }
      .btn-primary:hover { opacity:.9; }
    `;
    document.head.appendChild(style);
  }

  /* ── field definitions ── */
  const SYSTEM_FIELDS = [
    { key: 'name',       label: 'Student Name' },
    { key: 'spta',       label: 'SPTA' },
    { key: 'paper',      label: 'School Paper' },
    { key: 'org',        label: 'School Org' },
    { key: 'sports',     label: 'Sports' },
    { key: 'insurance',  label: 'Insurance' },
    { key: 'graduation', label: 'Graduation' },
  ];

  /* ── fuzzy match column headers ── */
  function guessMapping(headers) {
    const aliases = {
      name:       ['name','student','full name','student name','lastname','last name','surname'],
      spta:       ['spta','pta','association'],
      paper:      ['paper','school paper','publication','newspaper'],
      org:        ['org','school org','organization','student org'],
      sports:     ['sports','sport','athletic'],
      insurance:  ['insurance','insur'],
      graduation: ['graduation','grad','yearbook'],
    };
    const map = {};
    SYSTEM_FIELDS.forEach(f => {
      const found = headers.find(h =>
        aliases[f.key].some(alias => h.toLowerCase().includes(alias))
      );
      map[f.key] = found || '';
    });
    return map;
  }

  /* ── bind events ── */
  function bindModalEvents(overlay) {
    let parsedRows = [];
    let fileColumns = [];
    let currentMapping = {};

    const fileInput   = overlay.querySelector('#import-file-input');
    const dropzone    = overlay.querySelector('#import-dropzone');
    const fileName    = overlay.querySelector('#import-file-name');
    const parseBtn    = overlay.querySelector('#import-parse-btn');
    const confirmBtn  = overlay.querySelector('#import-confirm-btn');
    const backBtn     = overlay.querySelector('#import-back-btn');
    const cancelBtn   = overlay.querySelector('#import-cancel-btn');
    const closeBtn    = overlay.querySelector('#import-close-btn');
    const stepUpload  = overlay.querySelector('#import-step-upload');
    const stepPreview = overlay.querySelector('#import-step-preview');

    function close() { overlay.remove(); }
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    /* drag & drop */
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault(); dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

    function handleFile(file) {
      fileName.textContent = file.name;
      dropzone.classList.add('file-ready');
      parseBtn.style.display = 'inline-block';
      parseBtn.disabled = false;
      parseBtn._file = file;
    }

    parseBtn.addEventListener('click', () => {
      const file = parseBtn._file;
      if (!file) return;
      loadSheetJS(() => {
        const reader = new FileReader();
        reader.onload = e => {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (!rows.length) { alert('File appears to be empty.'); return; }

          const headers = rows[0].map(String);
          fileColumns = headers;
          parsedRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ''));
          currentMapping = guessMapping(headers);

          showPreview(headers, parsedRows.slice(0, 5), currentMapping);
          stepUpload.style.display = 'none';
          stepPreview.style.display = 'block';
          parseBtn.style.display = 'none';
          confirmBtn.style.display = 'inline-block';
          overlay.querySelector('#import-preview-count').textContent =
            `${parsedRows.length} student${parsedRows.length !== 1 ? 's' : ''} found in file (showing first 5)`;
        };
        reader.readAsArrayBuffer(file);
      });
    });

    function showPreview(headers, rows, mapping) {
      const thead = overlay.querySelector('#import-preview-thead');
      const tbody = overlay.querySelector('#import-preview-tbody');
      thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      tbody.innerHTML = rows.map(r =>
        `<tr>${headers.map((_,i) => `<td>${r[i] ?? ''}</td>`).join('')}</tr>`
      ).join('');

      /* column mapping selects */
      const mapGrid = overlay.querySelector('#import-column-map');
      mapGrid.innerHTML = SYSTEM_FIELDS.map(f => `
        <div class="import-map-row">
          <label class="import-map-label">${f.label}</label>
          <select class="import-map-select" data-field="${f.key}">
            <option value="">(skip)</option>
            ${headers.map(h => `<option value="${h}" ${mapping[f.key] === h ? 'selected' : ''}>${h}</option>`).join('')}
          </select>
        </div>
      `).join('');
    }

    backBtn.addEventListener('click', () => {
      stepPreview.style.display = 'none';
      stepUpload.style.display = 'block';
      parseBtn.style.display = 'inline-block';
      confirmBtn.style.display = 'none';
    });

    confirmBtn.addEventListener('click', () => {
      /* read mapping from selects */
      const selects = overlay.querySelectorAll('.import-map-select');
      const mapping = {};
      selects.forEach(sel => { mapping[sel.dataset.field] = sel.value; });

      if (!mapping.name) { alert('Please map the "Student Name" column.'); return; }

      /* build student objects */
      const colIndex = col => fileColumns.indexOf(col);
      const imported = parsedRows.map(row => {
        const get = field => {
          const col = mapping[field];
          if (!col) return field === 'name' ? '' : 0;
          const val = row[colIndex(col)];
          if (field === 'name') return String(val ?? '').trim();
          const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
          return isNaN(n) ? 0 : n;
        };
        return {
          name:       get('name'),
          spta:       get('spta'),
          paper:      get('paper'),
          org:        get('org'),
          sports:     get('sports'),
          insurance:  get('insurance'),
          graduation: get('graduation'),
        };
      }).filter(s => s.name !== '');

      if (!imported.length) { alert('No valid student rows found.'); return; }

      /* hand off to the page's addImportedStudents function */
      if (typeof window.addImportedStudents === 'function') {
        window.addImportedStudents(imported);
      } else {
        /* fallback: dispatch event */
        document.dispatchEvent(new CustomEvent('students-imported', { detail: imported }));
      }
      close();
    });
  }

  /* ── public API ── */
  window.openImportModal = function () { createModal(); };
})();