/**
 * admin.js — Admin Panel Logic
 * Covers: login, dashboard, form (add/edit)
 */

'use strict';

/* ─── TOAST ─── */
function showToast(msg, isError = false) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' toast--error' : '');
  // Force reflow
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ─── ESCAPE ─── */
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── SIDEBAR TOGGLE (mobile) ─── */
function initSidebarToggle() {
  const btn     = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    // overlay
    let overlay = document.getElementById('adminOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'adminOverlay';
      overlay.className = 'admin-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => sidebar.classList.remove('open'));
    }
    overlay.style.display = open ? 'block' : 'none';
  });
}

/* ─── MARK ACTIVE SIDEBAR LINK ─── */
function markSidebarActive() {
  const page = window.location.pathname.split('/').pop();
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');

  document.querySelectorAll('.sidebar__link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('?')[0].split('/').pop();
    const linkType = new URLSearchParams(href.split('?')[1] || '').get('type');

    const match = (page === linkPage || (page === '' && linkPage === 'admin-dashboard.html'))
                  && (linkType === typeParam || (!linkType && !typeParam && linkPage === 'admin-dashboard.html'));
    link.classList.toggle('active', match);
  });
}

/* ====================================================
   LOGIN PAGE
   ==================================================== */
function initLoginPage() {
  const form   = document.getElementById('loginForm');
  const errEl  = document.getElementById('loginError');
  if (!form) return;

  // If already logged in, redirect
  if (isAdminLoggedIn()) { window.location.href = 'admin-dashboard.html'; return; }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    if (adminLogin(email, pass)) {
      window.location.href = 'admin-dashboard.html';
    } else {
      errEl.textContent = 'Invalid email or password. Try admin@karabakh.edu.az / admin123';
      errEl.classList.add('visible');
    }
  });
}

/* ====================================================
   DASHBOARD PAGE
   ==================================================== */
function initDashboard() {
  const tableBody = document.getElementById('contentTableBody');
  if (!tableBody) return;

  requireAuth();

  const params     = new URLSearchParams(window.location.search);
  let   filterType = params.get('type') || 'all';
  let   filterQ    = '';

  // Stats
  renderStats();

  // Toolbar
  const searchEl   = document.getElementById('tableSearch');
  const filterEl   = document.getElementById('tableFilter');

  if (filterEl) {
    // Populate options
    filterEl.innerHTML = `<option value="all">All Types</option>` +
      CONTENT_TYPES.map(t => `<option value="${t.value}"${filterType === t.value ? ' selected' : ''}>${t.label}</option>`).join('');
    filterEl.addEventListener('change', () => { filterType = filterEl.value; renderTable(); });
  }
  if (searchEl) {
    searchEl.addEventListener('input', () => { filterQ = searchEl.value; renderTable(); });
  }

  renderTable();
  initSidebarToggle();
  markSidebarActive();

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    adminLogout(); window.location.href = 'admin-login.html';
  });

  /* ── Render stats ── */
  function renderStats() {
    const statsRow = document.getElementById('statsRow');
    if (!statsRow) return;
    const counts = { all: CONTENT.length };
    CONTENT_TYPES.forEach(t => { counts[t.value] = CONTENT.filter(c => c.type === t.value).length; });
    statsRow.innerHTML = `
      <div class="stat-card"><div class="stat-card__n">${counts.all}</div><div class="stat-card__l">Total Items</div></div>
      ${CONTENT_TYPES.map(t => `<div class="stat-card"><div class="stat-card__n">${counts[t.value]}</div><div class="stat-card__l">${t.label}s</div></div>`).join('')}`;
  }

  /* ── Render table ── */
  function renderTable() {
    const results = searchContent(filterQ, filterType);
    if (results.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--c-text-muted)">No content found.</td></tr>`;
      return;
    }
    tableBody.innerHTML = results.map(item => `
      <tr data-id="${item.id}">
        <td class="td-cover-wrap">
          <img class="td-cover" src="${esc(item.coverImage)}"
               alt="" onerror="this.src='https://via.placeholder.com/40x52/1a3d2e/fff?text=?'"/>
        </td>
        <td class="td-title"><span title="${esc(item.title)}">${esc(item.title)}</span></td>
        <td><span class="td-type-badge">${CONTENT_TYPES.find(t=>t.value===item.type)?.label||item.type}</span></td>
        <td class="td-author">${esc(item.author)}</td>
        <td>${esc(item.category)}</td>
        <td>${esc(item.createdAt)}</td>
        <td>
          <div class="td-actions">
            <a href="admin-form.html?id=${item.id}" class="btn btn--outline btn--sm">Edit</a>
            <button class="btn btn--danger btn--sm" data-delete="${item.id}">Delete</button>
          </div>
        </td>
      </tr>`).join('');

    // Delete handlers
    tableBody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this item? This cannot be undone.')) return;
        const id = Number(btn.dataset.delete);
        deleteItem(id);
        renderStats();
        renderTable();
        showToast('Item deleted.');
      });
    });
  }
}

/* ====================================================
   FORM PAGE  (add & edit)
   ==================================================== */
function initFormPage() {
  const form = document.getElementById('contentForm');
  if (!form) return;

  requireAuth();
  initSidebarToggle();
  markSidebarActive();

  const params   = new URLSearchParams(window.location.search);
  const editId   = params.get('id') ? Number(params.get('id')) : null;
  const editItem = editId ? getById(editId) : null;

  // Page title
  const formTitle = document.getElementById('formTitle');
  const formSub   = document.getElementById('formSub');
  if (formTitle) formTitle.textContent = editItem ? 'Edit Content' : 'Add New Content';
  if (formSub)   formSub.textContent   = editItem ? `Editing: ${editItem.title}` : 'Fill in the details to publish new content.';

  // Populate type dropdown
  const typeSelect = document.getElementById('fieldType');
  if (typeSelect) {
    typeSelect.innerHTML = `<option value="">— Select Type —</option>` +
      CONTENT_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
    typeSelect.addEventListener('change', () => toggleDynamicFields(typeSelect.value));
  }

  // ─── File Upload Handlers ───────────────────────────

  initCoverUpload();
  initPdfUpload();

  // Pre-fill if editing
  if (editItem) {
    setField('fieldType',     editItem.type);
    setField('fieldTitle',    editItem.title);
    setField('fieldAuthor',   editItem.author);
    setField('fieldCategory', editItem.category);
    setField('fieldDesc',     editItem.description);

    // Restore existing cover image (base64 or URL)
    if (editItem.coverImage) {
      setField('fieldCoverUrl', editItem.coverImage);
      showCoverPreview(editItem.coverImage);
    }
    // Restore existing PDF — just mark as "already uploaded"
    if (editItem.fileUrl && editItem.fileUrl !== '#') {
      setField('fieldPdfUrl', editItem.fileUrl);
      const isBase64 = editItem.fileUrl.startsWith('data:');
      showPdfPreview(
        isBase64 ? 'Uploaded PDF (stored)' : editItem.fileUrl.split('/').pop(),
        isBase64 ? 'Stored as data' : 'External link retained'
      );
    }

    // dynamic fields
    if (editItem.issueNumber)     setField('fieldIssueNumber',  editItem.issueNumber);
    if (editItem.publicationDate) setField('fieldPubDate',      editItem.publicationDate);
    if (editItem.reviewedItem)    setField('fieldReviewedItem', editItem.reviewedItem);
    if (editItem.reviewerName)    setField('fieldReviewerName', editItem.reviewerName);
    toggleDynamicFields(editItem.type);
  }

  // Cancel
  document.getElementById('cancelBtn')?.addEventListener('click', () => {
    window.location.href = 'admin-dashboard.html';
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    adminLogout(); window.location.href = 'admin-login.html';
  });

  // Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    const type = getField('fieldType');
    if (!type)  { showToast('Please select a content type.', true); return; }
    const title = getField('fieldTitle');
    if (!title) { showToast('Title is required.', true); return; }

    const coverVal = getField('fieldCoverUrl');
    const pdfVal   = getField('fieldPdfUrl');

    const data = {
      type,
      title,
      author:      getField('fieldAuthor')   || 'Unknown',
      category:    getField('fieldCategory') || 'General',
      description: getField('fieldDesc')     || '',
      coverImage:  coverVal || 'https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover',
      fileUrl:     pdfVal   || '#',
      featured:    editItem ? (editItem.featured || false) : false,
    };

    // Dynamic fields
    if (type === 'magazine') {
      data.issueNumber     = getField('fieldIssueNumber') || '';
      data.publicationDate = getField('fieldPubDate')     || '';
    }
    if (type === 'review') {
      data.reviewedItem  = getField('fieldReviewedItem')  || '';
      data.reviewerName  = getField('fieldReviewerName')  || '';
    }

    if (editItem) {
      updateItem(editId, data);
      showToast('Content updated successfully.');
    } else {
      addItem(data);
      showToast('Content added successfully.');
    }

    setTimeout(() => { window.location.href = 'admin-dashboard.html'; }, 900);
  });
}

/* ─── COVER IMAGE UPLOAD ─────────────────────────── */
function initCoverUpload() {
  const zone       = document.getElementById('coverUploadZone');
  const input      = document.getElementById('fieldCoverFile');
  const removeBtn  = document.getElementById('coverRemoveBtn');
  if (!zone || !input) return;

  let pickerOpening = false;

  function openPicker() {
    if (pickerOpening) return;
    pickerOpening = true;
    input.click();
    setTimeout(() => { pickerOpening = false; }, 300);
  }

  zone.addEventListener('click', e => {
    if (
      e.target === removeBtn ||
      removeBtn?.contains(e.target) ||
      e.target === input
    ) return;

    e.preventDefault();
    openPicker();
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('upload-zone--drag');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('upload-zone--drag');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('upload-zone--drag');
    const file = e.dataTransfer.files[0];
    if (file) handleCoverFile(file);
  });

  input.addEventListener('change', () => {
    pickerOpening = false;
    if (input.files[0]) handleCoverFile(input.files[0]);
  });

  input.addEventListener('click', e => {
    e.stopPropagation();
  });

  removeBtn?.addEventListener('click', e => {
    e.stopPropagation();
    clearCoverPreview();
  });

  function handleCoverFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5 MB.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      const base64 = evt.target.result;
      document.getElementById('fieldCoverUrl').value = base64;
      showCoverPreview(base64);
    };
    reader.readAsDataURL(file);
  }
}


/* ─── PDF UPLOAD ─────────────────────────────────── */
function initPdfUpload() {
  const zone      = document.getElementById('pdfUploadZone');
  const input     = document.getElementById('fieldPdfFile');
  const removeBtn = document.getElementById('pdfRemoveBtn');
  const hidden    = document.getElementById('fieldPdfUrl');
  if (!zone || !input) return;

  let pickerOpening = false;

  function openPicker() {
    if (pickerOpening) return;
    pickerOpening = true;
    input.click();
    setTimeout(() => { pickerOpening = false; }, 300);
  }

  zone.addEventListener('click', e => {
    if (
      e.target === removeBtn ||
      removeBtn?.contains(e.target) ||
      e.target === input
    ) return;

    e.preventDefault();
    openPicker();
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('upload-zone--drag');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('upload-zone--drag');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('upload-zone--drag');
    const file = e.dataTransfer.files[0];
    if (file) handlePdfFile(file);
  });

  input.addEventListener('change', () => {
    pickerOpening = false;
    if (input.files[0]) handlePdfFile(input.files[0]);
  });

  input.addEventListener('click', e => {
    e.stopPropagation();
  });

  removeBtn?.addEventListener('click', e => {
    e.stopPropagation();
    clearPdfPreview();
  });

  function handlePdfFile(file) {
    if (file.type !== 'application/pdf') {
      showToast('Please select a valid PDF file.', true);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('PDF must be smaller than 50 MB.', true);
      return;
    }

    const sizeFmt = file.size > 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(1) + ' MB'
      : Math.round(file.size / 1024) + ' KB';

    const reader = new FileReader();
    reader.onload = evt => {
      hidden.value = evt.target.result;
      showPdfPreview(file.name, sizeFmt);
    };
    reader.readAsDataURL(file);
  }
}

/* ─── HELPERS ─── */
function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function getField(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function toggleDynamicFields(type) {
  const magFields = document.getElementById('magazineFields');
  const revFields = document.getElementById('reviewFields');
  if (magFields) magFields.classList.toggle('visible', type === 'magazine');
  if (revFields) revFields.classList.toggle('visible', type === 'review');
}

function requireAuth() {
  if (!isAdminLoggedIn()) { window.location.href = 'admin-login.html'; }
}

/* ─── AUTO-INIT based on page ─── */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  if (page === 'admin-login.html' || page === '')     initLoginPage();
  if (page === 'admin-dashboard.html')                initDashboard();
  if (page === 'admin-form.html')                     initFormPage();
});