/**
 * content.js — Content Listing Page Logic
 * content.html?type=book  /  content.html?q=search
 */

'use strict';

/* ─── URL PARAMS ─── */
const params      = new URLSearchParams(window.location.search);
const URL_TYPE    = params.get('type') || 'all';
const URL_QUERY   = params.get('q')    || '';

/* ─── STATE ─── */
let activeType   = URL_TYPE;
let searchQuery  = URL_QUERY;

/* ─── DOM ─── */
const grid        = document.getElementById('contentGrid');
const emptyEl     = document.getElementById('emptyState');
const pageTitle   = document.getElementById('pageTitle');
const pageSub     = document.getElementById('pageSub');
const searchInput = document.getElementById('contentSearch');
const filterWrap  = document.getElementById('filterTabs');
const resultHint  = document.getElementById('resultHint');
const breadcrumb  = document.getElementById('breadcrumbType');
const yearEl      = document.getElementById('footerYear');

/* ─── LABELS ─── */
const TYPE_META = {
  all:       { label: 'All Content',   icon: '📚', desc: 'Browse the complete digital library' },
  book:      { label: 'Books',         icon: '📖', desc: 'Academic textbooks and reference works' },
  article:   { label: 'Articles',      icon: '📰', desc: 'Research and academic articles' },
  essay:     { label: 'Essays',        icon: '✍️',  desc: 'Student and faculty essays' },
  magazine:  { label: 'Magazines',     icon: '📑', desc: 'Student and departmental magazines' },
  story:     { label: 'Stories',       icon: '📓', desc: 'Creative fiction and short stories' },
  review:    { label: 'Reviews',       icon: '⭐', desc: 'Critical reviews and evaluations' },
  'art-photo':{ label: 'Art & Photo',  icon: '🖼️', desc: 'Visual art and photo collections' },
};

function getMeta(type) { return TYPE_META[type] || TYPE_META.all; }

/* ─── ESCAPE ─── */
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function typeLabel(type) {
  return CONTENT_TYPES.find(t => t.value === type)?.label || type;
}

/* ─── BUILD CARD ─── */
function buildCard(item, delay) {
  const hasPdf  = item.fileUrl && item.fileUrl !== '#';
  const readBtn = hasPdf
    ? `<a href="${esc(item.fileUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm" aria-label="Read ${esc(item.title)}">
         <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
           <path d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>Read
       </a>`
    : `<span class="btn btn--unavailable btn--sm">PDF Unavailable</span>`;
  const dlBtn = hasPdf
    ? `
         
           <path d="M6.5 1v7M3 6l3.5 3.5L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M1.5 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
         </svg>
       </a>`
    : '';

  return `
    <article class="card" style="animation-delay:${delay}ms" data-id="${item.id}">
      <div class="card__cover-wrap">
        <img class="card__cover"
             src="${esc(item.coverImage)}"
             alt="Cover: ${esc(item.title)}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover'"/>
        <span class="card__badge card__badge--${esc(item.type)}">${typeLabel(item.type)}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${esc(item.title)}</h3>
        <p  class="card__author">${esc(item.author)}</p>
        <div class="card__divider" aria-hidden="true"></div>
        <div class="card__actions">${readBtn}${dlBtn}</div>
      </div>
    </article>`;
}

/* ─── RENDER ─── */
function render() {
  const results = searchContent(searchQuery, activeType);

  // Update page meta
  const meta = getMeta(activeType);
  if (pageTitle)  pageTitle.textContent  = meta.label;
  if (pageSub)    pageSub.textContent    = meta.desc;
  if (breadcrumb) breadcrumb.textContent = meta.label;

  // Result hint
  if (resultHint) {
    const q = searchQuery.trim();
    if (q) {
      resultHint.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`;
    } else {
      resultHint.textContent = `${results.length} item${results.length !== 1 ? 's' : ''}`;
    }
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
  const types = [{ value:'all', label:'All' }, ...CONTENT_TYPES];
  filterWrap.innerHTML = types.map(t => `
    <button class="filter-tab${activeType === t.value ? ' active' : ''}"
            data-type="${t.value}"
            role="tab"
            aria-selected="${activeType === t.value}">
      ${t.label}
    </button>`).join('');

  filterWrap.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      filterWrap.querySelectorAll('.filter-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeType = btn.dataset.type;
      // update URL without reload
      const url = new URL(window.location);
      activeType === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', activeType);
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
    searchQuery ? url.searchParams.set('q', searchQuery) : url.searchParams.delete('q');
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
    activeType  = 'all';
    if (searchInput) searchInput.value = '';
    buildFilterTabs();
    render();
  });
}

/* ─── MOBILE NAV ─── */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav    = document.getElementById('mainNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ─── MARK ACTIVE NAV LINK ─── */
function markActiveNav() {
  document.querySelectorAll('.header__nav-link[data-type]').forEach(link => {
    link.classList.toggle('active', link.dataset.type === URL_TYPE);
  });
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  buildFilterTabs();
  initSearch();
  initReset();
  initMobileNav();
  markActiveNav();
  render();
});