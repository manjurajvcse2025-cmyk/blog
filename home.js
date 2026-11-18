// ============================================================
//  BlogSpace — Home Page (Supabase-powered)
// ============================================================

let _allPosts = [];
let _activeFilter = 'all';
let _searchQuery  = '';
let _displayCount = 9;

/* ── Render Blog Card ───────────────────────────────────── */
const renderCard = (post) => {
  const imgEl = post.image
    ? `<img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />`
    : '';
  const emojiCover = `<div class="card-emoji-cover" style="display:${post.image ? 'none' : 'flex'}">${post.emoji || '📝'}</div>`;
  const tags = (post.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');
  return `
  <article class="post-card" data-id="${post.id}" onclick="openBlogDetail('${post.id}')">
    <div class="post-card-image">
      ${imgEl}${emojiCover}
      <span class="post-category-badge">${post.category}</span>
    </div>
    <div class="post-card-body">
      <h3 class="post-title">${post.title}</h3>
      <p class="post-excerpt">${post.excerpt || ''}</p>
      <div class="post-tags">${tags}</div>
      <div class="post-meta">
        <div class="post-author">
          <div class="avatar avatar-sm">${post.author_initial || (post.author_name?.[0] || 'A')}</div>
          <span>${post.author_name || 'Anonymous'}</span>
        </div>
        <div class="post-stats">
          <span>⏱ ${post.read_time || 1} min</span>
          <span>❤️ ${(post.likes_count || 0).toLocaleString()}</span>
          <span>👁 ${(post.views || 0).toLocaleString()}</span>
        </div>
      </div>
      <div class="post-date">${timeAgo(post.created_at)}</div>
    </div>
  </article>`;
};

/* ── Filter + Render ────────────────────────────────────── */
const getFilteredPosts = () => {
  let posts = _allPosts;
  if (_activeFilter !== 'all') {
    posts = posts.filter(p => p.category.toLowerCase() === _activeFilter.toLowerCase());
  }
  if (_searchQuery.trim()) {
    const q = _searchQuery.toLowerCase();
    posts = posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.author_name?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  return posts;
};

const renderGrid = () => {
  const grid      = document.getElementById('postsGrid');
  const noResults = document.getElementById('noResults');
  const loadMore  = document.getElementById('loadMoreBtn');
  if (!grid) return;

  const filtered = getFilteredPosts();
  const visible  = filtered.slice(0, _displayCount);

  if (!filtered.length) {
    grid.innerHTML = '';
    noResults.style.display = '';
    if (loadMore) loadMore.style.display = 'none';
    return;
  }

  noResults.style.display = 'none';
  grid.innerHTML = visible.map(renderCard).join('');

  if (loadMore) {
    loadMore.style.display = filtered.length > _displayCount ? '' : 'none';
  }

  // Animate cards
  grid.querySelectorAll('.post-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 60}ms`;
    card.classList.add('card-appear');
  });
};

/* ── Category Filter Tabs ───────────────────────────────── */
const initFilterTabs = () => {
  const tabs = document.getElementById('filterTabs');
  if (!tabs) return;
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    tabs.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _activeFilter = btn.dataset.filter;
    _displayCount = 9;
    renderGrid();
  });
};

/* ── Search ─────────────────────────────────────────────── */
const initSearch = () => {
  const input = document.getElementById('searchInput');
  if (!input) return;
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      _searchQuery  = input.value;
      _displayCount = 9;
      renderGrid();
    }, 300);
    // Show/hide clear button
    const cb = document.getElementById('homeClearBtn');
    if (cb) cb.style.display = input.value ? '' : 'none';
  });

  // Enter key → dedicated search page
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = `pages/search.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });

  // Create and inject a clear (×) button
  const clearBtn = document.createElement('button');
  clearBtn.id = 'homeClearBtn';
  clearBtn.className = 'search-clear-btn';
  clearBtn.title = 'Clear search';
  clearBtn.textContent = '✕';
  clearBtn.style.display = 'none';
  if (input.parentElement) {
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(clearBtn);
  }
  clearBtn.addEventListener('click', () => {
    input.value = '';
    _searchQuery  = '';
    _displayCount = 9;
    clearBtn.style.display = 'none';
    renderGrid();
    input.focus();
  });
};

/* ── Category Cards ─────────────────────────────────────── */
const CATEGORIES = [
  { name: 'Technology', emoji: '💻', color: '#6C63FF' },
  { name: 'Design',     emoji: '🎨', color: '#f97316' },
  { name: 'Programming',emoji: '⌨️', color: '#22c55e' },
  { name: 'Business',   emoji: '💼', color: '#3b82f6' },
  { name: 'Lifestyle',  emoji: '✨', color: '#ec4899' },
  { name: 'Science',    emoji: '🔬', color: '#8b5cf6' },
];

const renderCategories = () => {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => {
    const count = _allPosts.filter(p => p.category === cat.name).length;
    return `
      <div class="category-card" onclick="filterByCategory('${cat.name}')" style="--cat-color: ${cat.color}">
        <div class="category-icon">${cat.emoji}</div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${count} article${count !== 1 ? 's' : ''}</div>
      </div>`;
  }).join('');
};

window.filterByCategory = (name) => {
  _activeFilter = name;
  _displayCount = 9;
  document.querySelectorAll('.filter-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === name);
  });
  renderGrid();
  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
};

/* ── Open Blog Detail ───────────────────────────────────── */
window.openBlogDetail = (id) => {
  // Store the ID and redirect to blog-detail page
  sessionStorage.setItem('bv_detail_id', id);
  const isRoot = !window.location.pathname.includes('/pages/');
  window.location.href = isRoot ? 'pages/blog.html' : 'blog.html';
};

/* ── Load Posts from DB ─────────────────────────────────── */
const loadPosts = async () => {
  showLoader();
  const { data, error } = await DB.getPosts({ limit: 100 });
  hideLoader();

  if (error) {
    showToast('Failed to load posts. Please refresh.', 'error');
    return;
  }

  _allPosts = data || [];
  renderCategories();
  renderGrid();
};

/* ── Load More ──────────────────────────────────────────── */
const initLoadMore = () => {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    _displayCount += 6;
    renderGrid();
  });
};

/* ── Newsletter form ─────────────────────────────────────── */
const initNewsletter = () => {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('🎉 Subscribed! Welcome to the community.', 'success');
    form.reset();
  });
};

/* ── Hero CTA ───────────────────────────────────────────── */
const updateHeroCTA = () => {
  const btn = document.getElementById('heroStartBtn');
  if (!btn) return;
  if (Auth.isLoggedIn()) {
    btn.textContent = '✏️ Write a Post';
    btn.href = 'pages/create.html';
  }
};

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadPosts();
  initFilterTabs();
  initSearch();
  initLoadMore();
  initNewsletter();
  updateHeroCTA();
});
