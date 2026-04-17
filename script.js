/**
 * Karabakh University — Digital Book Download System
 * script.js - ONLY READ BUTTON (NO DOWNLOAD, NO BADGES)
 */

'use strict';

const BOOKS = [
  {
    id: 1,
    title: 'Following the Killer',
    author: 'Fidan',
    image: 'https://picsum.photos/seed/calc101/400/533',
    pdf: 'books/a-new-book.pdf',
    category: 'Mathematics',
  },
  {
    id: 2,
    title: 'Introduction to Algorithms',
    author: 'Cormen, Leiserson, Rivest & Stein',
    image: 'https://picsum.photos/seed/algo202/400/533',
    pdf: '#',
    category: 'Computer Science',
  },
  {
    id: 3,
    title: 'Half the Population, Half the Research: How Gender Inequality Shaped Medicine and Endangered Women',
    author: 'Mammadli Fatima',
    image: 'https://picsum.photos/seed/phys303/400/533',
    pdf: 'books/article-final.pdf',
    category: 'Physics',
  },
  {
    id: 4,
    title: 'The History of Azerbaijan',
    author: 'Audrey L. Altstadt',
    image: 'https://picsum.photos/seed/hist404/400/533',
    pdf: '#',
    category: 'History',
  },
  {
    id: 5,
    title: 'Linear Algebra and Its Applications',
    author: 'Gilbert Strang',
    image: 'https://picsum.photos/seed/linalg505/400/533',
    pdf: '#',
    category: 'Mathematics',
  },
  {
    id: 6,
    title: 'Computer Networks',
    author: 'Andrew S. Tanenbaum',
    image: 'https://picsum.photos/seed/netw606/400/533',
    pdf: '#',
    category: 'Computer Science',
  },
  {
    id: 7,
    title: 'Quantum Mechanics: Concepts and Applications',
    author: 'Nouredine Zettili',
    image: 'https://picsum.photos/seed/qm707/400/533',
    pdf: '#',
    category: 'Physics',
  },
  {
    id: 8,
    title: 'World History: The Human Journey',
    author: 'Holt McDougal',
    image: 'https://picsum.photos/seed/wh808/400/533',
    pdf: '#',
    category: 'History',
  },
];

const state = {
  query: '',
  activeFilter: 'all',
};

const booksGrid = document.getElementById('booksGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const searchHint = document.getElementById('searchHint');
const statCount = document.getElementById('statCount');
const filterTabs = document.querySelectorAll('.filter-tab');
const menuBtn = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');
const resetBtn = document.getElementById('resetSearch');
const footerYear = document.getElementById('footerYear');

// ========== PDF OXUMA FUNKSİYASI ==========
function readPDF(pdfUrl) {
  if (!pdfUrl || pdfUrl === '#') {
    alert('PDF faylı mövcud deyil.');
    return;
  }
  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}

function getFilteredBooks() {
  const q = state.query.trim().toLowerCase();

  return BOOKS.filter((book) => {
    const matchesCategory =
      state.activeFilter === 'all' || book.category === state.activeFilter;

    const matchesQuery =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });
}

function hasValidPdf(pdf) {
  return typeof pdf === 'string' && pdf.trim() !== '' && pdf.trim() !== '#';
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCardActions(book) {
  if (!hasValidPdf(book.pdf)) {
    return `
      <div class="book-card__actions">
        <span class="btn--disabled">📄 PDF unavailable</span>
      </div>
    `;
  }

  const escapedPdf = book.pdf;

  return `
    <div class="book-card__actions">
      <button 
        onclick="readPDF('${escapedPdf}')"
        class="btn--view"
      >
        📖 Read PDF
      </button>
    </div>
  `;
}

function buildCardHTML(book, index) {
  const delay = Math.min(index * 60, 400);

  return `
    <article
      class="book-card"
      data-id="${book.id}"
      style="animation-delay: ${delay}ms"
      aria-label="${escapeHTML(book.title)} by ${escapeHTML(book.author)}"
    >
      <div class="book-card__cover-wrap">
        <img
          class="book-card__cover"
          src="${book.image}"
          alt="Cover of ${escapeHTML(book.title)}"
          loading="lazy"
          width="400"
          height="533"
          onerror="this.src='https://via.placeholder.com/400x533/1a3d2e/ffffff?text=No+Cover'"
        />
      </div>

      <div class="book-card__body">
        <h3 class="book-card__title">${escapeHTML(book.title)}</h3>
        <p class="book-card__author">${escapeHTML(book.author)}</p>
      </div>

      ${buildCardActions(book)}
    </article>
  `;
}

function renderBooks() {
  const filtered = getFilteredBooks();

  if (filtered.length === 0) {
    if (booksGrid) booksGrid.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    updateSearchHint(0);
    return;
  }

  if (emptyState) emptyState.hidden = true;
  if (booksGrid) {
    booksGrid.innerHTML = filtered.map((book, i) => buildCardHTML(book, i)).join('');
  }
  updateSearchHint(filtered.length);
}

function updateSearchHint(count) {
  if (!searchHint) return;

  const q = state.query.trim();

  if (!q) {
    searchHint.textContent = '';
    return;
  }

  if (count === 0) {
    searchHint.textContent = 'No books found for your search.';
  } else {
    searchHint.textContent = `${count} book${count !== 1 ? 's' : ''} found`;
  }
}

window.readPDF = readPDF;

if (searchInput) {
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    renderBooks();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const booksSection = document.getElementById('books');
      if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

if (filterTabs.length) {
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.activeFilter = tab.dataset.filter;
      renderBooks();
    });
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.query = '';
    state.activeFilter = 'all';

    filterTabs.forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    if (filterTabs[0]) {
      filterTabs[0].classList.add('active');
      filterTabs[0].setAttribute('aria-selected', 'true');
    }

    renderBooks();

    if (searchInput) searchInput.focus();
  });
}

if (menuBtn && mainNav) {
  menuBtn.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('.header__nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

const sections = document.querySelectorAll('[id]');
const navLinks = document.querySelectorAll('.header__nav-link[href^="#"]');

if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: '-40% 0px -40% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

function init() {
  if (footerYear) footerYear.textContent = new Date().getFullYear();
  if (statCount) statCount.textContent = BOOKS.length;
  renderBooks();
}

document.addEventListener('DOMContentLoaded', init);