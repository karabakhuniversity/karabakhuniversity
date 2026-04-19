'use strict';

const supabaseDb = window.supabaseClient;

const params = new URLSearchParams(window.location.search);
const URL_TYPE = params.get('type') || 'all';
const URL_QUERY = params.get('q') || '';

let activeType = URL_TYPE;
let searchQuery = URL_QUERY;
let allContent = [];

const grid = document.getElementById('contentGrid');
const emptyEl = document.getElementById('emptyState');
const pageTitle = document.getElementById('pageTitle');
const pageSub = document.getElementById('pageSub');
const searchInput = document.getElementById('contentSearch');
const filterWrap = document.getElementById('filterTabs');
const resultHint = document.getElementById('resultHint');
const breadcrumb = document.getElementById('breadcrumbType');
const yearEl = document.getElementById('footerYear');

const CONTENT_TYPES = [
  { value: 'book', label: 'Books' },
  { value: 'article', label: 'Articles' },
  { value: 'essay', label: 'Essays' },
  { value: 'magazine', label: 'Magazines' },
  { value: 'story', label: 'Stories' },
  { value: 'review', label: 'Reviews' },
  { value: 'art-photo', label: 'Art & Photo' },
  { value: 'student-spotlight', label: 'Student Spotlight' }
];

const TYPE_META = {
  all: { label: 'All Content', desc: 'Browse the complete digital library' },
  book: { label: 'Books', desc: 'Academic textbooks and reference works' },
  article: { label: 'Articles', desc: 'Research and academic articles' },
  essay: { label: 'Essays', desc: 'Student and faculty essays' },
  magazine: { label: 'Magazines', desc: 'Student and departmental magazines' },
  story: { label: 'Stories', desc: 'Creative fiction and short stories' },
  review: { label: 'Reviews', desc: 'Critical reviews and evaluations' },
  'art-photo': { label: 'Art & Photo', desc: 'Visual art and photo collections' },
  'student-spotlight': { label: 'Student Spotlight', desc: 'Featured student profiles and achievements' }
};

function getMeta(type) {
  return TYPE_META[type] || TYPE_META.all;
}

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
    createdAt: row.created_at || '',
    studentName: row.student_name || '',
    department: row.department || '',
    achievement: row.achievement || ''
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
      item.category.toLowerCase().includes(q) ||
      (item.studentName && item.studentName.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q));

    return matchesType && matchesQuery;
  });
}

function buildCard(item, delay) {
  const hasPdf = item.fileUrl && item.fileUrl !== '#';

  if (item.type === 'student-spotlight') {
    return buildSpotlightCard(item, delay);
  }

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

function buildSpotlightCard(item, delay) {
  const hasPdf = item.fileUrl && item.fileUrl !== '#';

  const readBtn = hasPdf
    ? `<a href="${esc(item.fileUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm" aria-label="Read more about ${esc(item.title)}">Read More</a>`
    : '';

  const department = item.department
    ? `<p class="card__meta-line"><span class="card__meta-icon">🎓</span>${esc(item.department)}</p>`
    : '';

  const achievement = item.achievement
    ? `<p class="card__meta-line"><span class="card__meta-icon">🏆</span>${esc(item.achievement)}</p>`
    : '';

  return `
    <article class="card card--spotlight" style="animation-delay:${delay}ms" data-id="${esc(item.id)}">
      <div class="card__cover-wrap">
        <img class="card__cover card__cover--portrait"
             src="${esc(item.coverImage)}"
             alt="Photo of ${esc(item.title)}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x400/1a3d2e/ffffff?text=Student'"/>
        <span class="card__badge card__badge--student-spotlight">Student Spotlight</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${esc(item.title)}</h3>
        <p class="card__author">${esc(item.author)}</p>
        ${department}
        ${achievement}
        <div class="card__divider" aria-hidden="true"></div>
        <div class="card__actions">${readBtn}</div>
      </div>
    </article>
  `;
}

async function loadContent() {
  if (!supabaseDb) throw new Error('Supabase is not connected.');

  const { data, error } = await supabaseDb
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  allContent = (data || []).map(mapRow);
}

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

  if (results.length > 0) {
    grid.innerHTML = results.map((item, i) => buildCard(item, Math.min(i * 55, 440))).join('');
    if (emptyEl) {
      emptyEl.hidden = true;
      emptyEl.style.display = 'none';
    }
    return;
  }

  grid.innerHTML = '';
  if (emptyEl) {
    emptyEl.hidden = false;
    emptyEl.style.display = 'flex';
  }
}

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

function markActiveNav() {
  document.querySelectorAll('.header__nav-link[data-type]').forEach((link) => {
    link.classList.toggle('active', link.dataset.type === activeType);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.style.display = 'none';
  }

  initSearch();
  initMobileNav();

  try {
    await loadContent();
    markActiveNav();
    render();
  } catch (error) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.style.display = 'flex';
    }
    if (resultHint) resultHint.textContent = 'Failed to load content.';
    console.error(error);
  }
});