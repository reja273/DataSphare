/**
 * DataSphare Blog Engine
 * Features:
 *   - Topic search & tag filtering
 *   - Follow / unfollow system
 *   - Interactive like, comment count, and social share
 *   - Offline/fallback post persistence
 */

// Storage helpers for Follow and Likes
function getFollowedAuthors() {
    try {
        return JSON.parse(localStorage.getItem('datasphare_followed_authors') || '[]');
    } catch {
        return [];
    }
}

function isFollowingAuthor(authorName) {
    return getFollowedAuthors().includes(authorName);
}

function toggleFollowAuthor(authorName) {
    let list = getFollowedAuthors();
    if (list.includes(authorName)) {
        list = list.filter(a => a !== authorName);
        localStorage.setItem('datasphare_followed_authors', JSON.stringify(list));
        if (window.DS && DS.toast) DS.toast(`Unfollowed ${authorName}`);
        return false;
    } else {
        list.push(authorName);
        localStorage.setItem('datasphare_followed_authors', JSON.stringify(list));
        if (window.DS && DS.toast) DS.toast(`Now following ${authorName}!`);
        return true;
    }
}

function getLikedPosts() {
    try {
        return JSON.parse(localStorage.getItem('datasphare_liked_posts') || '[]');
    } catch {
        return [];
    }
}

function toggleLikePost(postId) {
    let list = getLikedPosts();
    const liked = list.includes(postId);
    if (liked) list = list.filter(id => id !== postId);
    else list.push(postId);
    localStorage.setItem('datasphare_liked_posts', JSON.stringify(list));
    return !liked;
}

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

let allPostsCache = [];
let activeTag = 'All';
let searchQuery = '';

function renderPosts(posts) {
    const feed = document.getElementById('blogFeed');
    if (!feed) return;

    if (!posts.length) {
        feed.innerHTML = `
            <div class="empty-feed">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom:8px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <p>No stories found matching your search.</p>
                <button class="btn btn-secondary btn-sm" id="resetSearchBtn" style="margin-top:10px;">Clear Filters</button>
            </div>
        `;
        const resetBtn = document.getElementById('resetSearchBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const searchInp = document.getElementById('blogSearchInput');
                if (searchInp) searchInp.value = '';
                searchQuery = '';
                document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.tag-btn[data-tag="All"]');
                if (allBtn) allBtn.classList.add('active');
                activeTag = 'All';
                filterAndRender();
            });
        }
        return;
    }

    const likedList = getLikedPosts();

    feed.innerHTML = posts.map((post, i) => {
        const featured = i === 0 && !searchQuery ? ' featured' : '';
        const initial = (post.title || '?').slice(0, 2).toUpperCase();
        const author = post.author && post.author.name ? post.author.name : 'Member';
        const isBackendPost = Boolean(post.id && !String(post.id).startsWith('post-'));
        const isFollowed = isBackendPost ? Boolean(post.isFollowingAuthor) : isFollowingAuthor(author);
        const isLiked = isBackendPost ? Boolean(post.liked) : likedList.includes(post.id || post.slug);
        const likeCount = (post.likeCount || 0) + (!isBackendPost && isLiked ? 1 : 0);

        return `
        <article class="blog-post${featured}" data-slug="${escapeHtml(post.slug)}">
            <div class="post-image"><div class="placeholder-image">${escapeHtml(initial)}</div></div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="author">
                        <img class="author-avatar" src="${window.DS && DS.avatar ? DS.avatar(author) : 'images/default-avatar.png'}" alt="">
                        <strong>${escapeHtml(author)}</strong>
                        <button class="follow-btn${isFollowed ? ' following' : ''}" data-author="${escapeHtml(author)}" data-author-id="${escapeHtml(post.author && post.author.id || '')}" type="button" title="Follow author">
                            ${isFollowed ? '✓ Following' : '+ Follow'}
                        </button>
                    </span>
                    <span>${formatDate(post.createdAt)}</span>
                </div>
                <h2 class="post-title">${escapeHtml(post.title)}</h2>
                <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
                <div class="post-tags">
                    ${(post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
                <div class="post-footer">
                    <div class="post-actions">
                        <button class="action-btn card-like-btn${isLiked ? ' liked' : ''}" data-id="${escapeHtml(post.id || post.slug)}" type="button">
                            ♥ <span class="like-cnt">${likeCount}</span>
                        </button>
                        <span class="action-btn">💬 ${post.commentCount || 0}</span>
                        <div class="share-menu-dropdown">
                            <button class="action-btn card-share-btn" data-slug="${escapeHtml(post.slug)}" data-title="${escapeHtml(post.title)}" type="button">🔗 Share</button>
                        </div>
                    </div>
                    ${post.isPublic ? '' : '<span class="badge">Private</span>'}
                </div>
            </div>
        </article>`;
    }).join('');

    // Click on post to read
    feed.querySelectorAll('.blog-post').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.follow-btn') || e.target.closest('.card-like-btn') || e.target.closest('.card-share-btn')) {
                return; // don't open post if clicking button
            }
            location.href = `blog-post.html?slug=${encodeURIComponent(el.dataset.slug)}`;
        });
    });

    // Follow button click
    feed.querySelectorAll('.follow-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const author = btn.dataset.author;
            const authorId = btn.dataset.authorId;
            let nowFollowing;
            if (authorId && window.DS && DS.request) {
                try {
                    const result = await DS.request(`/users/${encodeURIComponent(authorId)}/follow`, { method: 'POST' });
                    nowFollowing = result.following;
                } catch (error) { DS.toast(error.message); return; }
            } else {
                nowFollowing = toggleFollowAuthor(author);
            }
            feed.querySelectorAll('.follow-btn').forEach(button => {
                if ((authorId && button.dataset.authorId === authorId) || (!authorId && button.dataset.author === author)) {
                    button.classList.toggle('following', nowFollowing);
                    button.textContent = nowFollowing ? '✓ Following' : '+ Follow';
                }
            });
        });
    });

    // Like button click
    feed.querySelectorAll('.card-like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const countEl = btn.querySelector('.like-cnt');
            let liked;
            if (window.DS && DS.request && !String(id).startsWith('post-')) {
                try {
                    const result = await DS.request(`/posts/${encodeURIComponent(id)}/like`, { method: 'POST' });
                    liked = result.liked;
                    const post = allPostsCache.find(item => String(item.id) === String(id));
                    if (post) { post.liked = result.liked; post.likeCount = result.likeCount; }
                    if (countEl) countEl.textContent = result.likeCount;
                } catch (error) { DS.toast(error.message); return; }
            } else {
                liked = toggleLikePost(id);
                if (countEl) {
                    const count = parseInt(countEl.textContent, 10) || 0;
                    countEl.textContent = liked ? count + 1 : Math.max(0, count - 1);
                }
            }
            btn.classList.toggle('liked', liked);
            if (window.DS && DS.toast) DS.toast(liked ? 'Liked story!' : 'Unliked');
        });
    });

    // Share button click
    feed.querySelectorAll('.card-share-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const slug = btn.dataset.slug;
            const title = btn.dataset.title;
            const url = `${location.origin}${location.pathname.replace('blog.html', '')}blog-post.html?slug=${encodeURIComponent(slug)}`;
            
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                if (window.DS && DS.toast) DS.toast('Link copied to clipboard!');
                else alert('Link copied to clipboard!');
            } else {
                prompt('Copy this link:', url);
            }
        });
    });
}

function filterAndRender() {
    let filtered = [...allPostsCache];

    // Filter by tag
    if (activeTag && activeTag !== 'All') {
        filtered = filtered.filter(p => (p.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase()));
    }

    // Filter by search query (topic, title, author, excerpt)
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p => {
            const inTitle = (p.title || '').toLowerCase().includes(q);
            const inExcerpt = (p.excerpt || '').toLowerCase().includes(q);
            const inAuthor = (p.author && p.author.name ? p.author.name : '').toLowerCase().includes(q);
            const inTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
            return inTitle || inExcerpt || inAuthor || inTags;
        });
    }

    renderPosts(filtered);
}

async function loadPosts() {
    const feed = document.getElementById('blogFeed');
    if (feed) feed.innerHTML = '<p class="empty-feed">Loading stories…</p>';

    try {
        const data = await DS.request('/posts');
        allPostsCache = data.posts || [];
        filterAndRender();
    } catch (err) {
        console.warn('Could not load stories from the server.', err);
        allPostsCache = [];
        filterAndRender();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Search input listener
    const searchInput = document.getElementById('blogSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';
            filterAndRender();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            filterAndRender();
        });
    }

    // Tag filtering listeners
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTag = btn.dataset.tag;
            filterAndRender();
        });
    });

    loadPosts();
});
