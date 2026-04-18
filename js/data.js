/**
 * data.js — Universal Content Store
 * Karabakh University Digital Platform
 *
 * Single source of truth for all content types.
 * Replace with fetch('/api/content') when backend is ready.
 */

'use strict';

const CONTENT_TYPES = [
  { value: 'book',      label: 'Book' },
  { value: 'article',   label: 'Article' },
  { value: 'essay',     label: 'Essay' },
  { value: 'magazine',  label: 'Magazine' },
  { value: 'story',     label: 'Story' },
  { value: 'review',    label: 'Review' },
  { value: 'art-photo', label: 'Art & Photo' },
];

/* ─── Seeded with realistic demo content ─── */
let CONTENT = [
  {
    id: 1,
    type: 'book',
    title: 'Introduction to Linear Algebra',
    author: 'Gilbert Strang',
    category: 'Mathematics',
    description: 'A comprehensive introduction to linear algebra with applications in science and engineering.',
    coverImage: 'https://picsum.photos/seed/book001/400/560',
    fileUrl: '#',
    createdAt: '2026-03-10',
    featured: true,
  },
  {
    id: 2,
    type: 'book',
    title: 'Algorithms and Data Structures',
    author: 'Thomas H. Cormen',
    category: 'Computer Science',
    description: 'The definitive textbook on algorithms, used worldwide in undergraduate and graduate courses.',
    coverImage: 'https://picsum.photos/seed/book002/400/560',
    fileUrl: '#',
    createdAt: '2026-02-22',
    featured: true,
  },
  {
    id: 3,
    type: 'article',
    title: 'Artificial Intelligence in Modern Education',
    author: 'Leyla Mammadova',
    category: 'Technology',
    description: 'An exploration of how AI tools are reshaping learning environments at Azerbaijani universities.',
    coverImage: 'https://picsum.photos/seed/art001/400/560',
    fileUrl: '#',
    createdAt: '2026-04-01',
    featured: true,
  },
  {
    id: 4,
    type: 'essay',
    title: 'The Cultural Identity of Karabakh',
    author: 'Nigar Huseynova',
    category: 'History & Culture',
    description: 'A reflective essay on how Karabakh\'s rich cultural heritage shapes the identity of its people.',
    coverImage: 'https://picsum.photos/seed/essay001/400/560',
    fileUrl: '#',
    createdAt: '2026-03-28',
    featured: false,
  },
  {
    id: 5,
    type: 'magazine',
    title: 'Student Ink — Spring Edition',
    author: 'Editorial Board',
    category: 'Student Magazine',
    description: 'The spring issue of Karabakh University\'s student magazine featuring art, poetry, and academic reflections.',
    coverImage: 'https://picsum.photos/seed/mag001/400/560',
    fileUrl: '#',
    createdAt: '2026-04-10',
    featured: true,
    issueNumber: '12',
    publicationDate: '2026-04-10',
  },
  {
    id: 6,
    type: 'story',
    title: 'The Last Letter from Shusha',
    author: 'Aytac Quliyeva',
    category: 'Fiction',
    description: 'A short story of a young soldier\'s final letter home, set against the backdrop of the liberation of Karabakh.',
    coverImage: 'https://picsum.photos/seed/story001/400/560',
    fileUrl: '#',
    createdAt: '2026-01-15',
    featured: true,
  },
  {
    id: 7,
    type: 'review',
    title: 'Review: "Memories of Aghdam" Exhibition',
    author: 'Rashad Aliyev',
    category: 'Art Review',
    description: 'A critical review of the recent photo exhibition documenting the reconstruction of Aghdam city.',
    coverImage: 'https://picsum.photos/seed/rev001/400/560',
    fileUrl: '#',
    createdAt: '2026-03-05',
    featured: false,
    reviewedItem: 'Memories of Aghdam — Photo Exhibition',
    reviewerName: 'Rashad Aliyev',
  },
  {
    id: 8,
    type: 'art-photo',
    title: 'Reconstruction Through the Lens',
    author: 'Kamran Hasanov',
    category: 'Photography',
    description: 'A visual documentary of Karabakh\'s rebuilding process, captured between 2023 and 2026.',
    coverImage: 'https://picsum.photos/seed/photo001/400/560',
    fileUrl: '#',
    createdAt: '2026-04-05',
    featured: false,
  },
  {
    id: 9,
    type: 'book',
    title: 'Quantum Mechanics: Fundamentals',
    author: 'Nouredine Zettili',
    category: 'Physics',
    description: 'A clear and accessible introduction to quantum mechanics for undergraduate physics students.',
    coverImage: 'https://picsum.photos/seed/book003/400/560',
    fileUrl: '#',
    createdAt: '2026-02-05',
    featured: false,
  },
  {
    id: 10,
    type: 'article',
    title: 'Renewable Energy Prospects in Azerbaijan',
    author: 'Murad Ismayilov',
    category: 'Engineering',
    description: 'An analysis of Azerbaijan\'s potential to lead the Caucasus region in renewable energy adoption.',
    coverImage: 'https://picsum.photos/seed/art002/400/560',
    fileUrl: '#',
    createdAt: '2026-03-20',
    featured: false,
  },
  {
    id: 11,
    type: 'essay',
    title: 'Language, Power, and National Memory',
    author: 'Sevinj Rzayeva',
    category: 'Linguistics',
    description: 'How Azerbaijani language policy intertwines with national identity and post-conflict recovery.',
    coverImage: 'https://picsum.photos/seed/essay002/400/560',
    fileUrl: '#',
    createdAt: '2026-01-28',
    featured: false,
  },
  {
    id: 12,
    type: 'story',
    title: 'A Bridge Across Two Rivers',
    author: 'Fidan Abbasli',
    category: 'Fiction',
    description: 'A coming-of-age story set in the new Karabakh, exploring friendship across cultural divides.',
    coverImage: 'https://picsum.photos/seed/story002/400/560',
    fileUrl: '#',
    createdAt: '2026-02-14',
    featured: false,
  },
];

/* ─── Merge with localStorage (admin edits) ─── */
(function syncFromStorage() {
  try {
    const stored = localStorage.getItem('ku_content');
    if (stored) {
      CONTENT = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not load stored content:', e);
  }
})();

/* ─── CRUD helpers ─── */

function saveContent() {
  try {
    localStorage.setItem('ku_content', JSON.stringify(CONTENT));
  } catch (e) {
    console.warn('Could not persist content:', e);
  }
}

function getAllContent()           { return [...CONTENT]; }
function getByType(type)           { return CONTENT.filter(c => c.type === type); }
function getById(id)               { return CONTENT.find(c => c.id === id) || null; }
function getFeatured(limit = 6)    { return CONTENT.filter(c => c.featured).slice(0, limit); }

function addItem(item) {
  const newItem = { ...item, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] };
  CONTENT.unshift(newItem);
  saveContent();
  return newItem;
}

function updateItem(id, updates) {
  const idx = CONTENT.findIndex(c => c.id === id);
  if (idx === -1) return null;
  CONTENT[idx] = { ...CONTENT[idx], ...updates };
  saveContent();
  return CONTENT[idx];
}

function deleteItem(id) {
  const idx = CONTENT.findIndex(c => c.id === id);
  if (idx === -1) return false;
  CONTENT.splice(idx, 1);
  saveContent();
  return true;
}

function searchContent(query, type = 'all') {
  const q = query.trim().toLowerCase();
  return CONTENT.filter(item => {
    const matchType = type === 'all' || item.type === type;
    const matchQuery = !q || item.title.toLowerCase().includes(q) || item.author.toLowerCase().includes(q);
    return matchType && matchQuery;
  });
}

/* ─── Auth helpers (fake until backend) ─── */
const ADMIN_CREDENTIALS = { email: 'admin@karabakh.edu.az', password: 'admin123' };

function adminLogin(email, password) {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem('ku_admin', 'true');
    return true;
  }
  return false;
}

function isAdminLoggedIn() {
  return sessionStorage.getItem('ku_admin') === 'true';
}

function adminLogout() {
  sessionStorage.removeItem('ku_admin');
}