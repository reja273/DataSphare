const tagsInput = document.getElementById('tagsInput');
const selectedTagsContainer = document.getElementById('selectedTags');
const titleInput = document.getElementById('postTitle');
const editor = document.getElementById('editor');
let selectedTags = [];
let editPost = null;
const params = new URLSearchParams(location.search);
const editId = params.get('id');

if (!DS.token()) location.href = 'auth.html?tab=login';

titleInput.addEventListener('input', () => {
  document.getElementById('titleCount').textContent = `${titleInput.value.length} / 160`;
});
tagsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); const tag = tagsInput.value.trim();
    if (tag && !selectedTags.some(t => t.toLowerCase() === tag.toLowerCase()) && selectedTags.length < 8) { selectedTags.push(tag); renderTags(); tagsInput.value = ''; }
  }
});
function renderTags() {
  selectedTagsContainer.innerHTML = selectedTags.map((tag, i) => `<span class="selected-tag">${escapeHtml(tag)}<button type="button" class="remove-tag" data-index="${i}" aria-label="Remove ${escapeHtml(tag)}">×</button></span>`).join('');
  selectedTagsContainer.querySelectorAll('.remove-tag').forEach(el => el.addEventListener('click', () => { selectedTags.splice(Number(el.dataset.index), 1); renderTags(); }));
}
document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => btn.addEventListener('click', () => {
  editor.focus(); document.execCommand(btn.dataset.command, false, btn.dataset.value || null);
}));
document.getElementById('linkBtn').addEventListener('click', () => {
  const value = prompt('Paste a link (https://…)'); if (!value) return;
  try { const url = new URL(value); if (!['https:', 'http:'].includes(url.protocol)) throw Error(); editor.focus(); document.execCommand('createLink', false, url.href); }
  catch { DS.toast('Enter a valid http or https link'); }
});
function insertHtml(html) { editor.focus(); document.execCommand('insertHTML', false, html); }
document.getElementById('imageBtn').addEventListener('click', () => {
  const url = prompt('Paste an image URL, or choose Image upload to select a file.');
  if (url) { try { const parsed = new URL(url); if (!['https:', 'http:'].includes(parsed.protocol)) throw Error(); insertHtml(`<figure><img src="${escapeHtml(parsed.href)}" alt="Story image" loading="lazy"><figcaption>Image caption</figcaption></figure>`); } catch { DS.toast('Enter a valid http or https image URL'); } }
  else document.getElementById('imageFile').click();
});
document.getElementById('imageFile').addEventListener('change', async (event) => {
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 12 * 1024 * 1024) { DS.toast('Choose an image smaller than 12 MB'); event.target.value = ''; return; }
  try {
    const bitmap = await createImageBitmap(file); const scale = Math.min(1, 1500 / bitmap.width, 1200 / bitmap.height);
    const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    let quality = 0.82; let dataUrl = canvas.toDataURL('image/webp', quality);
    while (dataUrl.length > 580000 && quality > 0.4) { quality -= 0.1; dataUrl = canvas.toDataURL('image/webp', quality); }
    if (dataUrl.length > 580000) throw Error('Image is still too large after resizing');
    insertHtml(`<figure><img src="${dataUrl}" alt="${escapeHtml(file.name.replace(/\.[^.]+$/, ''))}" loading="lazy"><figcaption>Image caption</figcaption></figure>`);
  } catch (error) { DS.toast(error.message || 'Could not process this image'); }
  event.target.value = '';
});
document.getElementById('videoBtn').addEventListener('click', () => {
  const raw = prompt('Paste a YouTube, YouTube Shorts, or Vimeo video URL'); if (!raw) return;
  try {
    const u = new URL(raw); let src = '';
    if (['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname)) {
      let id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : (u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : u.searchParams.get('v'));
      if (!id || !/^[\w-]{6,20}$/.test(id)) throw Error(); src = `https://www.youtube-nocookie.com/embed/${id}`;
    } else if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop(); if (!/^\d+$/.test(id || '')) throw Error(); src = `https://player.vimeo.com/video/${id}`;
    } else throw Error();
    insertHtml(`<figure class="video-embed"><iframe src="${src}" title="Embedded video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><figcaption>Video</figcaption></figure>`);
  } catch { DS.toast('Use a valid YouTube or Vimeo video link'); }
});
function plainText(html) { const node = document.createElement('div'); node.innerHTML = html; return (node.innerText || node.textContent || '').replace(/\u00a0/g, ' ').trim(); }
async function loadEditPost() {
  try {
    const { posts } = await DS.request('/posts'); editPost = posts.find(p => p.id === editId);
    if (!editPost || editPost.author?.id !== DS.user()?.id) throw Error('Story not found or you do not own it');
    titleInput.value = editPost.title; titleInput.dispatchEvent(new Event('input')); editor.innerHTML = editPost.content;
    selectedTags = [...(editPost.tags || [])]; renderTags(); document.getElementById('makePublic').checked = editPost.isPublic !== false;
    document.getElementById('publishBtn').textContent = 'Save changes'; document.title = 'Edit story — DataSphare';
  } catch (err) { DS.toast(err.message); setTimeout(() => location.href = 'blog.html', 900); }
}
if (editId) loadEditPost();
document.getElementById('publishBtn').addEventListener('click', async () => {
  const title = titleInput.value.trim(); const content = editor.innerHTML;
  if (title.length < 4) { DS.toast('Title needs at least 4 characters. Click the title field and type a title.'); titleInput.focus(); return; }
  if (title.length > 160) { DS.toast('Title can be at most 160 characters'); titleInput.focus(); return; }
  if (plainText(content).length < 20) { DS.toast('Write at least 20 characters in your story before saving'); editor.focus(); return; }
  const button = document.getElementById('publishBtn'); button.disabled = true;
  try {
    const payload = { title, content, tags: selectedTags, isPublic: document.getElementById('makePublic').checked };
    const data = editPost
      ? await DS.request(`/posts/${encodeURIComponent(editPost.id)}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await DS.request('/posts', { method: 'POST', body: JSON.stringify(payload) });
    location.href = `blog-post.html?slug=${encodeURIComponent(data.post.slug)}`;
  } catch (err) { DS.toast(err.message); button.disabled = false; }
});
