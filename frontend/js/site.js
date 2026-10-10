document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', () => header.classList.toggle('open'));
  }

  const slot = document.querySelector('[data-auth-slot]');
  if (slot) {
    renderAuth(slot);
    window.addEventListener('ds:session-expired', () => {
      renderAuth(slot);
      DS.toast('Your session expired. Please sign in again.');
    });
  }

  document.querySelectorAll('.site-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    const path = location.pathname.split('/').pop() || 'index.html';
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

function renderAuth(slot) {
  const user = DS.user();
  if (!user) {
    slot.innerHTML = `
      <a class="btn btn-ghost" href="auth.html">Sign in</a>
      <a class="btn btn-primary" href="auth.html?tab=register">Join</a>
    `;
    return;
  }
  slot.innerHTML = `
    <div class="user-chip">
      <img src="${DS.avatar(user.email || user.name)}" alt="">
      <span>${escapeHtml(user.name.split(' ')[0])}</span>
      <a href="account.html">Account</a>
      <button type="button" id="ds-logout">Sign out</button>
    </div>
  `;
  slot.querySelector('#ds-logout').addEventListener('click', () => {
    DS.clearSession();
    DS.toast('Signed out');
    renderAuth(slot);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.escapeHtml = escapeHtml;
