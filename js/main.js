/**
 * main.js — Homepage Logic
 * index.html
 */

'use strict';

/* ─── DOM ─── */
const heroSearch    = document.getElementById('heroSearch');
const featuredGrid  = document.getElementById('featuredGrid');
const statTotal     = document.getElementById('statTotal');
const yearEl        = document.getElementById('footerYear');

/* ─── HELPERS ─── */
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function typeLabel(type) {
  return CONTENT_TYPES.find(t => t.value === type)?.label || type;
}

function buildCard(item, delay = 0) {
  const hasPdf   = item.fileUrl && item.fileUrl !== '#';
  const readBtn  = hasPdf
    ? `<a href="${escHtml(item.fileUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
         <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
           <path d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>Read
       </a>`
    : `<span class="btn btn--unavailable btn--sm">PDF Unavailable</span>`;
  const dlBtn = hasPdf
    ? `<a href="${escHtml(item.fileUrl)}" download class="btn btn--outline btn--sm btn--icon" title="Download PDF" aria-label="Download ${escHtml(item.title)}">
         <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
           <path d="M6.5 1v7M3 6l3.5 3.5L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M1.5 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
         </svg>
       </a>`
    : '';

  return `
    <article class="card" style="animation-delay:${delay}ms">
      <div class="card__cover-wrap">
        <img class="card__cover"
             src="${escHtml(item.coverImage)}"
             alt="Cover: ${escHtml(item.title)}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x560/1a3d2e/ffffff?text=No+Cover'"/>
        <span class="card__badge card__badge--${escHtml(item.type)}">${typeLabel(item.type)}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${escHtml(item.title)}</h3>
        <p  class="card__author">${escHtml(item.author)}</p>
        <div class="card__divider" aria-hidden="true"></div>
        <div class="card__actions">${readBtn}${dlBtn}</div>
      </div>
    </article>`;
}

/* ─── RENDER FEATURED ─── */
function renderFeatured() {
  const items = getFeatured(6);
  if (!featuredGrid) return;
  featuredGrid.innerHTML = items.length
    ? items.map((item, i) => buildCard(item, i * 60)).join('')
    : `<div class="empty"><div class="empty__icon">📚</div><p class="empty__title">No featured content yet.</p></div>`;
}

/* ─── HERO SEARCH — redirect to content.html ─── */
function initHeroSearch() {
  if (!heroSearch) return;
  heroSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = heroSearch.value.trim();
      if (q) window.location.href = `content.html?q=${encodeURIComponent(q)}`;
      else    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
    }
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

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  if (yearEl)    yearEl.textContent = new Date().getFullYear();
  if (statTotal) statTotal.textContent = CONTENT.length;
  renderFeatured();
  initHeroSearch();
  initMobileNav();
});