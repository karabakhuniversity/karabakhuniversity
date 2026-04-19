/**
 * admin.js — Admin Panel Logic
 * Uses Supabase for storage + database + auth
 */

'use strict';

const supabaseDb = window.supabaseClient;

const CONTENT_TYPES = [
  { value: 'book', label: 'Book' },
  { value: 'article', label: 'Article' },
  { value: 'essay', label: 'Essay' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'story', label: 'Story' },
  { value: 'art-photo', label: 'Art & Photo' }
];

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
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ─── ESCAPE ─── */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── SUPABASE HELPERS ─── */
function ensureSupabase() {
  if (!supabaseDb) {
    showToast('Supabase is not connected. Check supabase.js.', true);
    throw new Error('Supabase client not found.');
  }
}

/* ─── AUTH ─── */
async function adminLogin(email, pass) {
  ensureSupabase();

  const { error } = await supabaseDb.auth.signInWithPassword({
    email,
    password: pass
  });

  if (error) throw error;
  return true;
}

async function adminLogout() {
  ensureSupabase();
  await supabaseDb.auth.signOut();
}

async function isAdminLoggedIn() {
  ensureSupabase();

  const { data, error } = await supabaseDb.auth.getUser();
  if (error) return false;

  return !!data.user;
}

async function requireAuth() {
  const ok = await isAdminLoggedIn();
  if (!ok) {
    window.location.href = 'admin-login.html';
    return false;
  }

  return true;
}

/* ─── STORAGE ─── */
async function uploadToStorage(bucket, file, folder = '') {
  ensureSupabase();

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabaseDb.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;
  return filePath;
}

function getPublicFileUrl(bucket, filePath) {
  ensureSupabase();
  const { data } = supabaseDb.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/* ─── DATA HELPERS ─── */
function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    author: row.author || 'Unknown',
    category: row.category || 'General',
    description: row.description || '',
    coverImage: row.cover_path || 'https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover',
    fileUrl: row.file_path || '#',
    featured: !!row.featured,
    issueNumber: row.issue_number || '',
    publicationDate: row.publication_date || '',
    reviewedItem: row.reviewed_item || '',
    reviewerName: row.reviewer_name || '',
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString() : ''
  };
}

async function fetchContent(type = 'all', query = '') {
  ensureSupabase();

  let req = supabaseDb
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (type !== 'all') {
    req = req.eq('type', type);
  }

  const { data, error } = await req;
  if (error) throw error;

  const items = (data || []).map(mapRow);
  const q = query.trim().toLowerCase();

  if (!q) return items;

  return items.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.author.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  );
}

async function fetchStats() {
  ensureSupabase();

  const { data, error } = await supabaseDb
    .from('content_items')
    .select('id, type');

  if (error) throw error;

  const items = data || [];
  const counts = { all: items.length };

  CONTENT_TYPES.forEach((t) => {
    counts[t.value] = items.filter((item) => item.type === t.value).length;
  });

  return counts;
}

async function getById(id) {
  ensureSupabase();

  const { data, error } = await supabaseDb
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapRow(data);
}

async function insertItem(payload) {
  ensureSupabase();

  const { error } = await supabaseDb
    .from('content_items')
    .insert([payload]);

  if (error) throw error;
}

async function updateItem(id, payload) {
  ensureSupabase();

  const { error } = await supabaseDb
    .from('content_items')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

async function deleteItem(id) {
  ensureSupabase();

  const { error } = await supabaseDb
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/* ─── SIDEBAR ─── */
function initSidebarToggle() {
  const btn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');

    let overlay = document.getElementById('adminOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'adminOverlay';
      overlay.className = 'admin-overlay';
      document.body.appendChild(overlay);

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
      });
    }

    overlay.style.display = open ? 'block' : 'none';
  });
}

function markSidebarActive() {
  const page = window.location.pathname.split('/').pop();
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');

  document.querySelectorAll('.sidebar__link').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    const linkPage = href.split('?')[0].split('/').pop();
    const linkType = new URLSearchParams(href.split('?')[1] || '').get('type');

    const match =
      (page === linkPage || (page === '' && linkPage === 'admin-dashboard.html')) &&
      (linkType === typeParam || (!linkType && !typeParam && linkPage === 'admin-dashboard.html'));

    link.classList.toggle('active', match);
  });
}

/* ─── LOGIN PAGE ─── */
async function initLoginPage() {
  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError');
  if (!form) return;

  if (await isAdminLoggedIn()) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim() || '';
    const pass = document.getElementById('loginPass')?.value || '';

    try {
      await adminLogin(email, pass);
      window.location.href = 'admin-dashboard.html';
    } catch (error) {
      if (errEl) {
        errEl.textContent = error.message || 'Invalid email or password.';
        errEl.classList.add('visible');
      } else {
        showToast(error.message || 'Login failed.', true);
      }
    }
  });
}

/* ─── DASHBOARD PAGE ─── */
async function initDashboard() {
  const tableBody = document.getElementById('contentTableBody');
  if (!tableBody) return;

  const authorized = await requireAuth();
  if (!authorized) return;

  initSidebarToggle();
  markSidebarActive();

  let filterType = new URLSearchParams(window.location.search).get('type') || 'all';
  let filterQ = '';

  const searchEl = document.getElementById('tableSearch');
  const filterEl = document.getElementById('tableFilter');

  if (filterEl) {
    filterEl.innerHTML =
      `<option value="all">All Types</option>` +
      CONTENT_TYPES.map(
        (t) => `<option value="${t.value}"${filterType === t.value ? ' selected' : ''}>${t.label}</option>`
      ).join('');

    filterEl.addEventListener('change', () => {
      filterType = filterEl.value;
      renderTable();
    });
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      filterQ = searchEl.value;
      renderTable();
    });
  }

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await adminLogout();
    window.location.href = 'admin-login.html';
  });

  async function renderStats() {
    const statsRow = document.getElementById('statsRow');
    if (!statsRow) return;

    try {
      const counts = await fetchStats();

      statsRow.innerHTML = `
        <div class="stat-card"><div class="stat-card__n">${counts.all}</div><div class="stat-card__l">Total Items</div></div>
        ${CONTENT_TYPES.map((t) => `
          <div class="stat-card">
            <div class="stat-card__n">${counts[t.value]}</div>
            <div class="stat-card__l">${t.label}s</div>
          </div>
        `).join('')}
      `;
    } catch (error) {
      showToast(error.message || 'Failed to load stats.', true);
    }
  }

  async function renderTable() {
    try {
      const results = await fetchContent(filterType, filterQ);

      if (results.length === 0) {
        tableBody.innerHTML =
          `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--c-text-muted)">No content found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = results.map((item) => `
        <tr data-id="${esc(item.id)}">
          <td class="td-cover-wrap">
            <img class="td-cover" src="${esc(item.coverImage)}"
                 alt=""
                 onerror="this.src='https://via.placeholder.com/40x52/1a3d2e/fff?text=?'"/>
          </td>
          <td class="td-title"><span title="${esc(item.title)}">${esc(item.title)}</span></td>
          <td><span class="td-type-badge">${CONTENT_TYPES.find((t) => t.value === item.type)?.label || esc(item.type)}</span></td>
          <td class="td-author">${esc(item.author)}</td>
          <td>${esc(item.category)}</td>
          <td>${esc(item.createdAt)}</td>
          <td>
            <div class="td-actions">
              <a href="admin-form.html?id=${encodeURIComponent(item.id)}" class="btn btn--outline btn--sm">Edit</a>
              <button class="btn btn--danger btn--sm" data-delete="${esc(item.id)}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this item? This cannot be undone.')) return;

          try {
            await deleteItem(btn.dataset.delete);
            showToast('Item deleted.');
            await renderStats();
            await renderTable();
          } catch (error) {
            showToast(error.message || 'Delete failed.', true);
          }
        });
      });
    } catch (error) {
      tableBody.innerHTML =
        `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--c-text-muted)">Failed to load content.</td></tr>`;
      showToast(error.message || 'Failed to load dashboard.', true);
    }
  }

  await renderStats();
  await renderTable();
}

/* ─── FORM PAGE ─── */
async function initFormPage() {
  const form = document.getElementById('contentForm');
  if (!form) return;

  const authorized = await requireAuth();
  if (!authorized) return;

  initSidebarToggle();
  markSidebarActive();

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  let editItem = null;

  const formTitle = document.getElementById('formTitle');
  const formSub = document.getElementById('formSub');
  const typeSelect = document.getElementById('fieldType');

  if (typeSelect) {
    typeSelect.innerHTML =
      `<option value="">— Select Type —</option>` +
      CONTENT_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');

    typeSelect.addEventListener('change', () => toggleDynamicFields(typeSelect.value));
  }

  initCoverUpload();
  initPdfUpload();

  if (editId) {
    try {
      editItem = await getById(editId);

      if (formTitle) formTitle.textContent = 'Edit Content';
      if (formSub) formSub.textContent = `Editing: ${editItem.title}`;

      setField('fieldType', editItem.type);
      setField('fieldTitle', editItem.title);
      setField('fieldAuthor', editItem.author);
      setField('fieldCategory', editItem.category);
      setField('fieldDesc', editItem.description);

      if (editItem.coverImage) {
        setField('fieldCoverUrl', editItem.coverImage);
        showCoverPreview(editItem.coverImage);
      }

      if (editItem.fileUrl && editItem.fileUrl !== '#') {
        setField('fieldPdfUrl', editItem.fileUrl);
        showPdfPreview(editItem.fileUrl.split('/').pop(), 'Uploaded');
      }

      if (editItem.issueNumber) setField('fieldIssueNumber', editItem.issueNumber);
      if (editItem.publicationDate) setField('fieldPubDate', editItem.publicationDate);
      if (editItem.reviewedItem) setField('fieldReviewedItem', editItem.reviewedItem);
      if (editItem.reviewerName) setField('fieldReviewerName', editItem.reviewerName);

      toggleDynamicFields(editItem.type);
    } catch (error) {
      showToast(error.message || 'Failed to load content for editing.', true);
    }
  } else {
    if (formTitle) formTitle.textContent = 'Add New Content';
    if (formSub) formSub.textContent = 'Fill in the details to publish new content.';
  }

  document.getElementById('cancelBtn')?.addEventListener('click', () => {
    window.location.href = 'admin-dashboard.html';
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await adminLogout();
    window.location.href = 'admin-login.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = getField('fieldType');
    const title = getField('fieldTitle');

    if (!type) {
      showToast('Please select a content type.', true);
      return;
    }

    if (!title) {
      showToast('Title is required.', true);
      return;
    }

    const payload = {
      type,
      title,
      author: getField('fieldAuthor') || 'Unknown',
      category: getField('fieldCategory') || 'General',
      description: getField('fieldDesc') || '',
      cover_path: getField('fieldCoverUrl') || 'https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover',
      file_path: getField('fieldPdfUrl') || '#',
      featured: editItem ? !!editItem.featured : false,
      issue_number: type === 'magazine' ? (getField('fieldIssueNumber') || null) : null,
      publication_date: type === 'magazine' ? (getField('fieldPubDate') || null) : null,
      reviewed_item: type === 'review' ? (getField('fieldReviewedItem') || null) : null,
      reviewer_name: type === 'review' ? (getField('fieldReviewerName') || null) : null
    };

    try {
      if (editId) {
        await updateItem(editId, payload);
        showToast('Content updated successfully.');
      } else {
        await insertItem(payload);
        showToast('Content added successfully.');
      }

      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 900);
    } catch (error) {
      showToast(error.message || 'Failed to save content.', true);
    }
  });
}

/* ─── COVER UPLOAD ─── */
function initCoverUpload() {
  const zone = document.getElementById('coverUploadZone');
  const input = document.getElementById('fieldCoverFile');
  const removeBtn = document.getElementById('coverRemoveBtn');
  const hidden = document.getElementById('fieldCoverUrl');

  if (!zone || !input || !hidden) return;

  let pickerOpening = false;

  function openPicker() {
    if (pickerOpening) return;
    pickerOpening = true;
    input.click();
    setTimeout(() => {
      pickerOpening = false;
    }, 300);
  }

  zone.addEventListener('click', (e) => {
    if (e.target === removeBtn || removeBtn?.contains(e.target) || e.target === input) return;
    e.preventDefault();
    openPicker();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('upload-zone--drag');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('upload-zone--drag');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('upload-zone--drag');
    const file = e.dataTransfer.files[0];
    if (file) handleCoverFile(file);
  });

  input.addEventListener('change', () => {
    pickerOpening = false;
    if (input.files[0]) handleCoverFile(input.files[0]);
  });

  input.addEventListener('click', (e) => e.stopPropagation());

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearCoverPreview();
  });

  async function handleCoverFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5 MB.', true);
      return;
    }

    try {
      showToast('Uploading cover...');
      const filePath = await uploadToStorage('covers', file, 'images');
      const publicUrl = getPublicFileUrl('covers', filePath);
      hidden.value = publicUrl;
      showCoverPreview(publicUrl);
      showToast('Cover uploaded successfully.');
    } catch (error) {
      showToast(error.message || 'Cover upload failed.', true);
    }
  }
}

function showCoverPreview(src) {
  const zoneBody = document.getElementById('coverZoneBody');
  const preview = document.getElementById('coverPreview');
  const previewImg = document.getElementById('coverPreviewImg');

  if (previewImg) previewImg.src = src;
  if (zoneBody) zoneBody.hidden = true;
  if (preview) preview.hidden = false;
}

function clearCoverPreview() {
  const zoneBody = document.getElementById('coverZoneBody');
  const preview = document.getElementById('coverPreview');
  const previewImg = document.getElementById('coverPreviewImg');
  const hidden = document.getElementById('fieldCoverUrl');
  const input = document.getElementById('fieldCoverFile');

  if (previewImg) previewImg.src = '';
  if (preview) preview.hidden = true;
  if (zoneBody) zoneBody.hidden = false;
  if (hidden) hidden.value = '';
  if (input) input.value = '';
}

/* ─── PDF UPLOAD ─── */
function initPdfUpload() {
  const zone = document.getElementById('pdfUploadZone');
  const input = document.getElementById('fieldPdfFile');
  const removeBtn = document.getElementById('pdfRemoveBtn');
  const hidden = document.getElementById('fieldPdfUrl');

  if (!zone || !input || !hidden) return;

  let pickerOpening = false;

  function openPicker() {
    if (pickerOpening) return;
    pickerOpening = true;
    input.click();
    setTimeout(() => {
      pickerOpening = false;
    }, 300);
  }

  zone.addEventListener('click', (e) => {
    if (e.target === removeBtn || removeBtn?.contains(e.target) || e.target === input) return;
    e.preventDefault();
    openPicker();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('upload-zone--drag');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('upload-zone--drag');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('upload-zone--drag');
    const file = e.dataTransfer.files[0];
    if (file) handlePdfFile(file);
  });

  input.addEventListener('change', () => {
    pickerOpening = false;
    if (input.files[0]) handlePdfFile(input.files[0]);
  });

  input.addEventListener('click', (e) => e.stopPropagation());

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearPdfPreview();
  });

  async function handlePdfFile(file) {
    if (file.type !== 'application/pdf') {
      showToast('Please select a valid PDF file.', true);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('PDF must be smaller than 50 MB.', true);
      return;
    }

    const sizeFmt = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    try {
      showToast('Uploading PDF...');
      const filePath = await uploadToStorage('files', file, 'pdfs');
      const publicUrl = getPublicFileUrl('files', filePath);
      hidden.value = publicUrl;
      showPdfPreview(file.name, sizeFmt);
      showToast('PDF uploaded successfully.');
    } catch (error) {
      showToast(error.message || 'PDF upload failed.', true);
    }
  }
}

function showPdfPreview(name, size) {
  const zoneBody = document.getElementById('pdfZoneBody');
  const preview = document.getElementById('pdfPreview');
  const nameEl = document.getElementById('pdfFileName');
  const sizeEl = document.getElementById('pdfFileSize');

  if (nameEl) nameEl.textContent = name;
  if (sizeEl) sizeEl.textContent = size;
  if (zoneBody) zoneBody.hidden = true;
  if (preview) preview.hidden = false;
}

function clearPdfPreview() {
  const zoneBody = document.getElementById('pdfZoneBody');
  const preview = document.getElementById('pdfPreview');
  const hidden = document.getElementById('fieldPdfUrl');
  const input = document.getElementById('fieldPdfFile');

  if (preview) preview.hidden = true;
  if (zoneBody) zoneBody.hidden = false;
  if (hidden) hidden.value = '';
  if (input) input.value = '';
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

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
  const page = window.location.pathname.split('/').pop();

  if (page === 'admin-login.html' || page === '') await initLoginPage();
  if (page === 'admin-dashboard.html') await initDashboard();
  if (page === 'admin-form.html') await initFormPage();
});
