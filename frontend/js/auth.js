document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') === 'register' ? 'register' : 'login';
  showTab(tab);

  document.getElementById('tab-login').addEventListener('click', () => showTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => showTab('register'));
  document.getElementById('login-form').addEventListener('submit', onLogin);
  document.getElementById('register-form').addEventListener('submit', onRegister);
});

function showTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').hidden = tab !== 'login';
  document.getElementById('register-form').hidden = tab !== 'register';
}

async function onLogin(e) {
  e.preventDefault();
  const error = document.getElementById('auth-error');
  error.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await DS.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    DS.setSession(data.token, data.user);
    location.href = 'index.html';
  } catch (err) {
    error.textContent = err.message;
  }
}

async function onRegister(e) {
  e.preventDefault();
  const error = document.getElementById('auth-error');
  error.textContent = '';
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  try {
    const data = await DS.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    DS.setSession(data.token, data.user);
    location.href = 'index.html';
  } catch (err) {
    error.textContent = err.message;
  }
}
