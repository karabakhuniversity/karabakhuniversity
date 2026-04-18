/**
 * content.js — Content Listing Page Logic
 * Uses Supabase instead of local data.js
 */

'use strict';

const supabaseDb = window.supabaseClient;

/* ─── URL PARAMS ─── */
const params = new URLSearchParams(window.location.search);
const URL_TYPE = params.get('type') || 'all';
const URL_QUERY = params.get('q') || '';

/* ─── STATE ─── */
let activeType = URL_TYPE;
let searchQuery = URL_QUERY;
let allContent = [];

/* ─── DOM ─── */
const grid = document.getElementById('contentGrid');
const emptyEl = document.getElementById('emptyState');
const pageTitle = document.getElementById('pageTitle');
const pageSub = document.getElementById('pageSub');
const searchInput = document.getElementById('contentSearch');
const filterWrap = document.getElementById('filterTabs');
const resultHint = document.getElementById('resultHint');
const breadcrumb = document.getElementById('breadcrumbType');
const yearEl = document.getElementById('footerYear');

/* ─── LABELS ─── */
const CONTENT_TYPES = [
  { value: 'book', label: 'Books' },
  { value: 'article', label: 'Articles' },
  { value: 'essay', label: 'Essays' },
  { value: 'magazine', label: 'Magazines' },
  { value: 'story', label: 'Stories' },
  { value: 'review', label: 'Reviews' },
  { value: 'art-photo', label: 'Art & Photo' }
];

const TYPE_META = {
  all: { label: 'All Content', desc: 'Browse the complete digital library' },
  book: { label: 'Books', desc: 'Academic textbooks and reference works' },
  article: { label: 'Articles', desc: 'Research and academic articles' },
  essay: { label: 'Essays', desc: 'Student and faculty essays' },
  magazine: { label: 'Magazines', desc: 'Student and departmental magazines' },
  story: { label: 'Stories', desc: 'Creative fiction and short stories' },
  review: { label: 'Reviews', desc: 'Critical reviews and evaluations' },
  'art-photo': { label: 'Art & Photo', desc: 'Visual art and photo collections' }
};

function getMeta(type) {
  return TYPE_META[type] || TYPE_META.all;
}

/* ─── HELPERS ─── */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function typeLabel(type) {
  return CONTENT_TYPES.find((t) => t.value === type)?.label || type;
}

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title || 'Untitled',
    author: row.author || 'Unknown',
    category: row.category || 'General',
    description: row.description || '',
    coverImage: row.cover_path || 'https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover',
    fileUrl: row.file_path || '#',
    createdAt: row.created_at || ''
  };
}

function getFilteredContent() {
  const q = searchQuery.trim().toLowerCase();

  return allContent.filter((item) => {
    const matchesType = activeType === 'all' || item.type === activeType;
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    return matchesType && matchesQuery;
  });
}

/* ─── BUILD CARD ─── */
function buildCard(item, delay) {
  const hasPdf = item.fileUrl && item.fileUrl !== '#';

  const readBtn = hasPdf
    ? `<a href="${esc(item.fileUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm" aria-label="Read ${esc(item.title)}">Read</a>`
    : `<span class="btn btn--unavailable btn--sm">PDF Unavailable</span>`;

  return `
    <article class="card" style="animation-delay:${delay}ms" data-id="${esc(item.id)}">
      <div class="card__cover-wrap">
        <img class="card__cover"
             src="${esc(item.coverImage)}"
             alt="Cover: ${esc(item.title)}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover'"/>
        <span class="card__badge card__badge--${esc(item.type)}">${esc(typeLabel(item.type))}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${esc(item.title)}</h3>
        <p class="card__author">${esc(item.author)}</p>
        <div class="card__divider" aria-hidden="true"></div>
        <div class="card__actions">${readBtn}</div>
      </div>
    </article>
  `;
}

/* ─── DATA LOAD ─── */
async function loadContent() {
  if (!supabaseDb) throw new Error('Supabase is not connected.');

  const { data, error } = await supabaseDb
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  allContent = (data || []).map(mapRow);
}

/* ─── RENDER ─── */
function render() {
  const results = getFilteredContent();
  const meta = getMeta(activeType);

  if (pageTitle) pageTitle.textContent = meta.label;
  if (pageSub) pageSub.textContent = meta.desc;
  if (breadcrumb) breadcrumb.textContent = meta.label;

  if (resultHint) {
    const q = searchQuery.trim();
    resultHint.textContent = q
      ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
      : `${results.length} item${results.length !== 1 ? 's' : ''}`;
  }

  if (!grid) return;

  if (results.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  grid.innerHTML = results.map((item, i) => buildCard(item, Math.min(i * 55, 440))).join('');
}

/* ─── FILTER TABS ─── */
function buildFilterTabs() {
  if (!filterWrap) return;

  const types = [{ value: 'all', label: 'All' }, ...CONTENT_TYPES];

  filterWrap.innerHTML = types.map((t) => `
    <button class="filter-tab${activeType === t.value ? ' active' : ''}"
            data-type="${t.value}"
            role="tab"
            aria-selected="${activeType === t.value}">
      ${t.label}
    </button>
  `).join('');

  filterWrap.querySelectorAll('.filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterWrap.querySelectorAll('.filter-tab').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeType = btn.dataset.type;

      const url = new URL(window.location);
      activeType === 'all'
        ? url.searchParams.delete('type')
        : url.searchParams.set('type', activeType);

      window.history.replaceState(null, '', url);
      render();
    });
  });
}

/* ─── SEARCH ─── */
function initSearch() {
  if (!searchInput) return;

  searchInput.value = searchQuery;
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;

    const url = new URL(window.location);
    searchQuery
      ? url.searchParams.set('q', searchQuery)
      : url.searchParams.delete('q');

    window.history.replaceState(null, '', url);
    render();
  });
}

/* ─── RESET BTN ─── */
function initReset() {
  const btn = document.getElementById('resetBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    searchQuery = '';
    activeType = 'all';

    if (searchInput) searchInput.value = '';

    const url = new URL(window.location);
    url.searchParams.delete('q');
    url.searchParams.delete('type');
    window.history.replaceState(null, '', url);

    buildFilterTabs();
    render();
  });
}

/* ─── MOBILE NAV ─── */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── MARK ACTIVE NAV LINK ─── */
function markActiveNav() {
  document.querySelectorAll('.header__nav-link[data-type]').forEach((link) => {
    link.classList.toggle('active', link.dataset.type === activeType);
  });
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  buildFilterTabs();
  initSearch();
  initReset();
  initMobileNav();

  try {
    await loadContent();
    markActiveNav();
    render();
  } catch (error) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (resultHint) resultHint.textContent = 'Failed to load content.';
    console.error(error);
  }
});
