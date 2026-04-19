'use strict';

const heroSearch = document.getElementById('heroSearch');
const featuredGrid = document.getElementById('featuredGrid');
const statTotal = document.getElementById('statTotal');
const yearEl = document.getElementById('footerYear');
const supabaseDb = window.supabaseClient;

const CONTENT_TYPES = [
  { value: 'book', label: 'Book' },
  { value: 'article', label: 'Article' },
  { value: 'essay', label: 'Essay' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'story', label: 'Story' },
  { value: 'review', label: 'Review' },
  { value: 'art-photo', label: 'Art & Photo' }
];

function escHtml(s) {
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
    coverImage: row.cover_path || 'https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover',
    fileUrl: row.file_path || '#',
    createdAt: row.created_at || ''
  };
}

function buildCard(item, delay = 0) {
  const hasPdf = item.fileUrl && item.fileUrl !== '#';

  const readBtn = hasPdf
    ? `<a href="${escHtml(item.fileUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Read</a>`
    : `<span class="btn btn--unavailable btn--sm">PDF Unavailable</span>`;

  return `
    <article class="card" style="animation-delay:${delay}ms">
      <div class="card__cover-wrap">
        <img class="card__cover"
             src="${escHtml(item.coverImage)}"
             alt="Cover: ${escHtml(item.title)}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover'"/>
        <span class="card__badge card__badge--${escHtml(item.type)}">${escHtml(typeLabel(item.type))}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${escHtml(item.title)}</h3>
        <p class="card__author">${escHtml(item.author)}</p>
        <div class="card__divider" aria-hidden="true"></div>
        <div class="card__actions">${readBtn}</div>
      </div>
    </article>
  `;
}

async function loadHomepageContent() {
  if (!supabaseDb) {
    throw new Error('Supabase is not connected.');
  }

  const { data, error } = await supabaseDb
    .from('content_items')
    .select('*')
    .eq('type', 'book')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    throw error;
  }

  const latestBooks = (data || []).map(mapRow);

  const { count, error: countError } = await supabaseDb
    .from('content_items')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  return {
    total: count || 0,
    featured: latestBooks
  };
}

function renderFeatured(items) {
  if (!featuredGrid) return;

  featuredGrid.innerHTML = items.length
    ? items.map((item, index) => buildCard(item, index * 60)).join('')
    : `<div class="empty"><div class="empty__icon">📚</div><p class="empty__title">No books yet.</p></div>`;
}

function initHeroSearch() {
  if (!heroSearch) return;

  heroSearch.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const q = heroSearch.value.trim();
    if (q) {
      window.location.href = `content.html?q=${encodeURIComponent(q)}`;
      return;
    }

    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
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

document.addEventListener('DOMContentLoaded', async () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initHeroSearch();
  initMobileNav();

  try {
    const { total, featured } = await loadHomepageContent();
    if (statTotal) statTotal.textContent = total;
    renderFeatured(featured);
  } catch (error) {
    if (featuredGrid) {
      featuredGrid.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><p class="empty__title">Failed to load content.</p></div>`;
    }
    console.error(error);
  }
});
