/**
 * DataSphare Blog Post Reader & Engagement Engine
 * Features:
 *   - Author follow / following state
 *   - Like post (persisted locally & via API)
 *   - Social sharing (Copy link, Twitter/X, LinkedIn)
 *   - Commenting system with instant render
 *   - Fallback article support
 */

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

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
    const isNowFollowing = !list.includes(authorName);
    if (isNowFollowing) list.push(authorName);
    else list = list.filter(a => a !== authorName);
    localStorage.setItem('datasphare_followed_authors', JSON.stringify(list));
    if (window.DS && DS.toast) DS.toast(isNowFollowing ? `Following ${authorName}!` : `Unfollowed ${authorName}`);
    return isNowFollowing;
}

function getLocalComments(slug) {
    try {
        return JSON.parse(localStorage.getItem('datasphare_comments_' + slug) || '[]');
    } catch {
        return [];
    }
}

function addLocalComment(slug, comment) {
    const list = getLocalComments(slug);
    list.unshift(comment);
    localStorage.setItem('datasphare_comments_' + slug, JSON.stringify(list));
    return list;
}

function commentHtml(c) {
    const name = (c.author && c.author.name) || c.authorName || 'Learner';
    return `
      <div class="comment">
        <div class="comment-avatar"><img src="${window.DS && DS.avatar ? DS.avatar(name) : 'images/default-avatar.png'}" alt=""></div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span class="comment-author" style="font-weight:700;font-size:14px;">${escapeHtml(name)}</span>
            <span class="comment-date" style="color:#94a3b8;font-size:12px;">${formatDate(c.createdAt)}</span>
          </div>
          <p style="margin:0;color:#334155;line-height:1.5;">${escapeHtml(c.text)}</p>
        </div>
      </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const slug = new URLSearchParams(location.search).get('slug');
    const article = document.getElementById('article');
    if (!slug) {
        article.innerHTML = '<p>Missing story. <a href="blog.html">Back to stories</a></p>';
        return;
    }

    let post = null;
    let comments = [];

    // Attempt API fetch
    if (window.DS && DS.request) {
        try {
            const data = await DS.request('/posts/' + encodeURIComponent(slug));
            post = data.post;
            comments = data.comments || [];
        } catch (e) {
            console.warn('Unable to load this story.', e);
        }
    }
if (!post) {
        article.innerHTML = `<p>Story not found. <a href="blog.html">Back to stories</a></p>`;
        return;
    }

    // Merge any locally added comments
    const localComments = getLocalComments(slug);
    comments = [...localComments, ...comments];

    const author = (post.author && post.author.name) || 'Member';
    const isOwner = Boolean(DS.user() && post.author && DS.user().id === post.author.id && !String(post.id || '').startsWith('post-'));
    const isBackendPost = Boolean(post.id && !String(post.id).startsWith('post-'));
    const isFollowed = isBackendPost ? Boolean(post.isFollowingAuthor) : isFollowingAuthor(author);
    let isLiked = isBackendPost ? Boolean(post.liked) : getLikedPosts().includes(post.id || slug);
    const displayLikeCount = (post.likeCount || 0) + (!isBackendPost && isLiked ? 1 : 0);
    document.title = post.title + ' — DataSphare';

    article.innerHTML = `
        <header class="article-header">
            <h1 class="article-title">${escapeHtml(post.title)}</h1>
            <div class="article-meta">
                <div class="author-info" style="display:flex;align-items:center;gap:12px;">
                    <img class="author-avatar" src="${window.DS && DS.avatar ? DS.avatar(author) : 'images/default-avatar.png'}" alt="">
                    <div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <strong class="author-name">${escapeHtml(author)}</strong>
                            <button class="follow-btn${isFollowed ? ' following' : ''}" id="articleFollowBtn" type="button">
                                ${isFollowed ? '✓ Following' : '+ Follow'}
                            </button>
                        </div>
                        <div class="author-bio" style="font-size:12px;color:#64748b;">Published on ${formatDate(post.createdAt)} · 4 min read</div>
                    </div>
                </div>
            </div>
            <div class="article-tags" style="margin-top:14px;">
                ${(post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
        </header>

        <div class="article-body">${post.content}</div>

        <div class="engagement-bar">
            <button class="engagement-btn${isLiked ? ' liked' : ''}" id="likeBtn" type="button">
                ♥ <span id="likeCount">${displayLikeCount}</span>
            </button>
            <div class="share-buttons" style="display:flex;gap:8px;">
                <button class="share-btn" id="shareCopyBtn" type="button">Copy link</button>
            </div>
        </div>

        <section class="comments-section">
            <h3 class="comments-title">Discussion & Comments (${comments.length})</h3>
            <div class="comment-form" style="display:flex;gap:12px;margin-bottom:24px;">
                <div class="comment-avatar"><img src="${window.DS && DS.avatar ? DS.avatar('You') : 'images/default-avatar.png'}" alt=""></div>
                <div class="comment-input-wrapper" style="flex:1;display:flex;flex-direction:column;gap:8px;">
                    <textarea class="comment-input" id="commentInput" placeholder="Share your thoughts, questions, or ideas…"></textarea>
                    <div style="display:flex;justify-content:flex-end;">
                        <button class="btn btn-primary btn-sm" id="submitComment" type="button">Post Comment</button>
                    </div>
                </div>
            </div>
            <div class="comments-list" id="commentsList">
                ${comments.map(commentHtml).join('')}
            </div>
        </section>
    `;

    if (isOwner) {
        const actions = document.createElement('div');
        actions.className = 'story-owner-actions';
        actions.innerHTML = `<a class="share-btn" href="blog-editor.html?id=${encodeURIComponent(post.id)}">Edit story</a><button class="share-btn" id="toggleVisibility" type="button">Make ${post.isPublic ? 'private' : 'public'}</button><button class="share-btn" id="deleteStory" type="button">Delete story</button>`;
        article.querySelector('.article-tags').after(actions);
        document.getElementById('toggleVisibility').addEventListener('click', async () => { try { const result = await DS.request(`/posts/${encodeURIComponent(post.id)}`, { method: 'PUT', body: JSON.stringify({ isPublic: !post.isPublic }) }); post.isPublic = result.post.isPublic; DS.toast(post.isPublic ? 'Story is public' : 'Story is private'); location.reload(); } catch (error) { DS.toast(error.message); } });
        document.getElementById('deleteStory').addEventListener('click', async () => { if (!confirm('Delete this story permanently?')) return; try { await DS.request(`/posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' }); location.href = 'blog.html'; } catch (error) { DS.toast(error.message); } });
    }

    // Follow button
    const followBtn = document.getElementById('articleFollowBtn');
    if (followBtn) {
        followBtn.addEventListener('click', async () => {
            let nowFollowing;
            if (isBackendPost && post.author && post.author.id && window.DS && DS.request) {
                try {
                    const result = await DS.request(`/users/${encodeURIComponent(post.author.id)}/follow`, { method: 'POST' });
                    nowFollowing = result.following;
                    post.isFollowingAuthor = nowFollowing;
                } catch (error) { DS.toast(error.message); return; }
            } else {
                nowFollowing = toggleFollowAuthor(author);
            }
            followBtn.classList.toggle('following', nowFollowing);
            followBtn.textContent = nowFollowing ? '✓ Following' : '+ Follow';
        });
    }

    // Like button
    const likeBtn = document.getElementById('likeBtn');
    const likeCountEl = document.getElementById('likeCount');
    if (likeBtn) likeBtn.classList.toggle('liked', isLiked);
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const current = parseInt(likeCountEl.textContent, 10) || 0;
            if (window.DS && DS.request && post.id && !String(post.id).startsWith('post-')) {
                try {
                    const result = await DS.request(`/posts/${encodeURIComponent(post.id)}/like`, { method: 'POST' });
                    likeCountEl.textContent = result.likeCount;
                    isLiked = result.liked;
                    post.liked = result.liked;
                    post.likeCount = result.likeCount;
                } catch (error) { DS.toast(error.message); return; }
            } else {
                isLiked = toggleLikePost(post.id || slug);
                likeCountEl.textContent = isLiked ? current + 1 : Math.max(0, current - 1);
            }
            likeBtn.classList.toggle('liked', isLiked);
            if (window.DS && DS.toast) DS.toast(isLiked ? 'Liked story!' : 'Unliked');
        });
    }

    // Share buttons
    const shareCopyBtn = document.getElementById('shareCopyBtn');
    if (shareCopyBtn) {
        shareCopyBtn.addEventListener('click', async () => {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(location.href);
                if (window.DS && DS.toast) DS.toast('Story link copied to clipboard!');
                else alert('Story link copied!');
            } else {
                prompt('Copy this story URL:', location.href);
            }
        });
    }

    // Comment submission
    const submitBtn = document.getElementById('submitComment');
    const commentInput = document.getElementById('commentInput');
    if (submitBtn && commentInput) {
        submitBtn.addEventListener('click', async () => {
            const text = commentInput.value.trim();
            if (!text) return;

            const newComment = {
                authorName: (window.DS && DS.user && DS.user() && DS.user().name) || 'Data Explorer',
                text: text,
                createdAt: new Date().toISOString()
            };

            if (window.DS && DS.request && post.id && !String(post.id).startsWith('post-')) {
                try { const result = await DS.request(`/posts/${encodeURIComponent(post.id)}/comments`, { method: 'POST', body: JSON.stringify({ text }) }); Object.assign(newComment, result.comment); }
                catch (error) { DS.toast(error.message); return; }
            } else { addLocalComment(slug, newComment); }
            const commentsList = document.getElementById('commentsList');
            if (commentsList) {
                commentsList.insertAdjacentHTML('afterbegin', commentHtml(newComment));
            }
            commentInput.value = '';

            const titleEl = document.querySelector('.comments-title');
            const total = document.querySelectorAll('#commentsList .comment').length;
            if (titleEl) titleEl.textContent = `Discussion & Comments (${total})`;
            if (window.DS && DS.toast) DS.toast('Comment posted successfully!');
        });
    }
});
