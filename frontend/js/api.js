const DS = {
  apiBase() {
    if (window.DATASPHERE_API) return window.DATASPHERE_API;
    return '/api';
  },

  token() {
    return localStorage.getItem('ds_token');
  },

  setSession(token, user) {
    if (token) localStorage.setItem('ds_token', token);
    if (user) localStorage.setItem('ds_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('ds_token');
    localStorage.removeItem('ds_user');
  },

  user() {
    try {
      return JSON.parse(localStorage.getItem('ds_user') || 'null');
    } catch {
      return null;
    }
  },

  toast(message) {
    let el = document.getElementById('ds-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ds-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  },

  avatar(seed) {
    return '/favicon.svg';
  },

  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const token = DS.token();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(DS.apiBase() + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token && !path.startsWith('/auth/login')) {
        DS.clearSession();
        window.dispatchEvent(new Event('ds:session-expired'));
      }
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }
};

window.DS = DS;
