// ===== AUTH PAGE LOGIC =====
const isLogin = document.getElementById('loginForm') !== null;

// Toggle password visibility
const togglePwd = document.getElementById('togglePwd');
if (togglePwd) {
  togglePwd.addEventListener('click', () => {
    const pwd = document.getElementById('password');
    pwd.type = pwd.type === 'password' ? 'text' : 'password';
  });
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // Redirect if already logged in
  if (api.getToken()) window.location.href = 'dashboard.html';

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    setLoading('loginBtn', true);
    const res = await api.post('/auth/login', {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
    });
    setLoading('loginBtn', false);
    if (res.ok) {
      api.setAuth(res.data.data.token, res.data.data.user);
      window.location.href = 'dashboard.html';
    } else {
      showAlert(res.data.message || 'Login gagal');
    }
  });
}

// REGISTER
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  if (api.getToken()) window.location.href = 'dashboard.html';

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    setLoading('registerBtn', true);
    const res = await api.post('/auth/register', {
      nama: document.getElementById('nama').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      tanggal_melahirkan: document.getElementById('tanggalMelahirkan').value,
    });
    setLoading('registerBtn', false);
    if (res.ok) {
      showAlert('Registrasi berhasil! Silakan login.', 'success');
      setTimeout(() => window.location.href = 'index.html', 1500);
    } else {
      showAlert(res.data.message || 'Registrasi gagal');
    }
  });
}
