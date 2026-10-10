const user = DS.user();
if (!user) location.href = 'auth.html?tab=login';
else document.getElementById('accountInfo').textContent = `${user.name} · ${user.email}`;
document.getElementById('deleteAccount').addEventListener('click', async () => {
  const password = document.getElementById('deletePassword').value;
  if (!password || !document.getElementById('confirmDelete').checked) { DS.toast('Enter your password and confirm account deletion'); return; }
  if (!confirm('Permanently delete this account and its content?')) return;
  const button = document.getElementById('deleteAccount'); button.disabled = true;
  try { await DS.request('/auth/me', { method: 'DELETE', body: JSON.stringify({ password }) }); DS.clearSession(); location.href = 'index.html'; }
  catch (error) { DS.toast(error.message); button.disabled = false; }
});
