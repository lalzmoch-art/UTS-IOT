// ===== MOCK API HELPER (STANDALONE / OFFLINE) =====

// Initialize Mock Store
function initMockStore() {
  const tglMelahirkan = "2026-05-07"; // 12 days before 2026-05-18

  // Default Users
  if (!localStorage.getItem('momcare_users')) {
    const defaultUsers = [
      { id_user: 1, nama: "Ibu Sehat", email: "ibu@email.com", password: "password123", tanggal_melahirkan: tglMelahirkan, role: "user" },
      { id_user: 2, nama: "Admin MomCare", email: "admin@momcare.com", password: "adminpassword", tanggal_melahirkan: "2000-01-01", role: "admin" }
    ];
    localStorage.setItem('momcare_users', JSON.stringify(defaultUsers));
  }

  // Pre-populate Health Conditions
  if (!localStorage.getItem('momcare_kondisi')) {
    const defaultKondisi = [
      { id_kondisi: 1, id_user: 1, nyeri: "ringan", perdarahan: "normal", suhu: 36.7, kondisi_luka: "baik", emosional: "baik", catatan: "Kondisi sangat membaik, luka jahitan sudah kering.", tanggal: "2026-05-18" },
      { id_kondisi: 2, id_user: 1, nyeri: "sedang", perdarahan: "normal", suhu: 36.9, kondisi_luka: "baik", emosional: "cemas", catatan: "Sedikit lelah karena kurang tidur malam.", tanggal: "2026-05-17" },
      { id_kondisi: 3, id_user: 1, nyeri: "ringan", perdarahan: "normal", suhu: 36.5, kondisi_luka: "baik", emosional: "baik", catatan: "Bayi menyusu dengan sangat lancar hari ini.", tanggal: "2026-05-16" }
    ];
    localStorage.setItem('momcare_kondisi', JSON.stringify(defaultKondisi));
  }

  // Pre-populate Breastfeeding Sessions
  if (!localStorage.getItem('momcare_menyusui')) {
    const defaultMenyusui = [
      { id_menyusui: 1, id_user: 1, sisi: "kanan", durasi: 1200, waktu: "09:00", tanggal: "2026-05-18" },
      { id_menyusui: 2, id_user: 1, sisi: "kiri", durasi: 1500, waktu: "11:30", tanggal: "2026-05-18" },
      { id_menyusui: 3, id_user: 1, sisi: "kanan", durasi: 900, waktu: "14:00", tanggal: "2026-05-18" },
      { id_menyusui: 4, id_user: 1, sisi: "kiri", durasi: 1200, waktu: "16:30", tanggal: "2026-05-18" }
    ];
    localStorage.setItem('momcare_menyusui', JSON.stringify(defaultMenyusui));
  }

  // Pre-populate Sleep/Rest Sessions
  if (!localStorage.getItem('momcare_istirahat')) {
    const defaultIstirahat = [
      { id_istirahat: 1, id_user: 1, durasi: 18000, tanggal: "2026-05-18" }, // 5 hours
      { id_istirahat: 2, id_user: 1, durasi: 8400, tanggal: "2026-05-18" }   // 2 hours 20 min
    ];
    localStorage.setItem('momcare_istirahat', JSON.stringify(defaultIstirahat));
  }

  // Pre-populate Reminders
  if (!localStorage.getItem('momcare_reminders')) {
    const defaultReminders = [
      { id_reminder: 1, id_user: 1, jenis_reminder: "menyusui", label: "Menyusui Si Kecil", waktu: "10:00", status: true },
      { id_reminder: 2, id_user: 1, jenis_reminder: "obat", label: "Tablet Tambah Darah", waktu: "07:00", status: true },
      { id_reminder: 3, id_user: 1, jenis_reminder: "istirahat", label: "Waktu Tidur Siang Ibu", waktu: "13:00", status: false }
    ];
    localStorage.setItem('momcare_reminders', JSON.stringify(defaultReminders));
  }

  // Auto-login Default Patient disabled to allow native login & register
}

// Execute Mock Data Setup
initMockStore();

const BACKEND_URL = 'http://localhost:8080/api';
let API_MODE = localStorage.getItem('momcare_api_mode') || 'real';

const api = {
  getToken() { return localStorage.getItem('momcare_token'); },
  getUser()  { return JSON.parse(localStorage.getItem('momcare_user') || 'null'); },
  setAuth(token, user) {
    localStorage.setItem('momcare_token', token);
    localStorage.setItem('momcare_user', JSON.stringify(user));
  },
  clearAuth() {
    localStorage.removeItem('momcare_token');
    localStorage.removeItem('momcare_user');
  },
  requireAuth() {
    // If no token exists, redirect to login page (index.html)
    if (!this.getToken()) {
      const path = window.location.pathname;
      if (!path.endsWith('index.html') && !path.endsWith('register.html') && path !== '/' && path !== '') {
        window.location.href = 'index.html';
        return false;
      }
    }
    return true;
  },

  // Dual-Engine HTTP Request (Real Go backend via native Fetch API with Offline Mock Fallback)
  async request(method, path, body = null) {
    if (API_MODE === 'real') {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        const token = this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchOptions = {
          method: method,
          headers: headers
        };
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${BACKEND_URL}${path}`, fetchOptions);
        
        // Handle unauthorized token expiration
        if (response.status === 401 && path !== '/auth/login') {
          this.clearAuth();
          const p = window.location.pathname;
          if (!p.endsWith('index.html') && !p.endsWith('register.html')) {
            window.location.href = 'index.html';
          }
          return { ok: false, status: 401, data: { success: false, message: 'Sesi habis, silakan login kembali' } };
        }

        let responseData = null;
        try {
          responseData = await response.json();
        } catch (e) {
          // not JSON
        }

        return {
          ok: response.ok,
          status: response.status,
          data: responseData || { success: response.ok, message: response.statusText }
        };
      } catch (error) {
        console.warn(`[MomCare] Gagal menghubungi Go backend di ${BACKEND_URL}. Menggunakan fallback OFFLINE (Mock localStorage).`, error);
        // Fallback to local storage mock by letting the execution proceed below
      }
    }

    // ----- OFFLINE MOCK MODE (FALLBACK) -----
    const currentUser = this.getUser() || { id_user: 1 };
    const uid = currentUser.id_user;

    // Parse URL params
    const parts = path.split('/');
    
    // AUTH LOGIC
    if (path === '/auth/login') {
      const users = JSON.parse(localStorage.getItem('momcare_users') || '[]');
      const match = users.find(u => u.email === body.email && u.password === body.password);
      if (match) {
        return { ok: true, status: 200, data: { success: true, data: { token: 'mock_token_' + match.id_user, user: match } } };
      }
      return { ok: false, status: 401, data: { success: false, message: 'Email atau password salah' } };
    }

    if (path === '/auth/register') {
      const users = JSON.parse(localStorage.getItem('momcare_users') || '[]');
      const id = users.length + 1;
      const newUser = { id_user: id, ...body, role: body.role || 'user' };
      users.push(newUser);
      localStorage.setItem('momcare_users', JSON.stringify(users));
      return { ok: true, status: 201, data: { success: true, data: { id_user: id } } };
    }

    // PROFILE LOGIC
    if (path === '/profile') {
      if (method === 'GET') {
        return { ok: true, status: 200, data: { success: true, data: currentUser } };
      }
      if (method === 'PUT') {
        const users = JSON.parse(localStorage.getItem('momcare_users'));
        const idx = users.findIndex(u => u.id_user === uid);
        if (idx !== -1) {
          users[idx].nama = body.nama;
          users[idx].tanggal_melahirkan = body.tanggal_melahirkan;
          localStorage.setItem('momcare_users', JSON.stringify(users));
          localStorage.setItem('momcare_user', JSON.stringify(users[idx]));
        }
        return { ok: true, status: 200, data: { success: true, message: 'Profil diperbarui' } };
      }
    }

    // DASHBOARD LOGIC
    if (path === '/dashboard') {
      const tglMelahirkan = new Date(currentUser.tanggal_melahirkan);
      const hariNifas = Math.max(1, Math.floor((Date.now() - tglMelahirkan.getTime()) / 86400000) + 1);

      const kondisi = JSON.parse(localStorage.getItem('momcare_kondisi') || '[]');
      const userKondisi = kondisi.filter(k => k.id_user === uid);
      const latestK = userKondisi.length > 0 ? userKondisi[userKondisi.length - 1] : null;

      const menyusui = JSON.parse(localStorage.getItem('momcare_menyusui') || '[]');
      const userMenyusuiToday = menyusui.filter(m => m.id_user === uid && m.tanggal === today());

      const istirahat = JSON.parse(localStorage.getItem('momcare_istirahat') || '[]');
      const userIstirahatToday = istirahat.filter(i => i.id_user === uid && i.tanggal === today());
      let totalIstirahat = 0;
      userIstirahatToday.forEach(i => totalIstirahat += i.durasi);

      // Warning detection
      let hasWarning = false;
      let warningMessages = [];
      if (latestK) {
        if (latestK.suhu >= 38.0) { warningMessages.push("Demam Tinggi (\u226538\u00B0C)"); hasWarning = true; }
        if (latestK.perdarahan === 'banyak') { warningMessages.push("Perdarahan berlebihan (Lochia)"); hasWarning = true; }
        if (latestK.nyeri === 'berat') { warningMessages.push("Nyeri hebat"); hasWarning = true; }
        if (latestK.kondisi_luka === 'bernanah') { warningMessages.push("Luka bernanah/infeksi"); hasWarning = true; }
        if (latestK.emosional === 'depresi') { warningMessages.push("Indikasi depresi berat"); hasWarning = true; }
      }

      return {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            hari_nifas: hariNifas,
            kondisi_terbaru: latestK,
            jumlah_menyusui: userMenyusuiToday.length,
            total_istirahat: totalIstirahat,
            has_warning: hasWarning,
            warning_messages: warningMessages
          }
        }
      };
    }

    // KONDISI LOGIC
    if (path === '/kondisi') {
      const kondisi = JSON.parse(localStorage.getItem('momcare_kondisi') || '[]');
      if (method === 'GET') {
        const userK = kondisi.filter(k => k.id_user === uid).sort((a,b) => b.tanggal.localeCompare(a.tanggal));
        return { ok: true, status: 200, data: { success: true, data: userK } };
      }
      if (method === 'POST') {
        const id = kondisi.length + 1;
        const newK = { id_kondisi: id, id_user: uid, ...body };
        kondisi.push(newK);
        localStorage.setItem('momcare_kondisi', JSON.stringify(kondisi));
        return { ok: true, status: 201, data: { success: true, data: newK } };
      }
    }
    if (parts[1] === 'kondisi' && method === 'DELETE') {
      const id = parseInt(parts[2]);
      let kondisi = JSON.parse(localStorage.getItem('momcare_kondisi') || '[]');
      kondisi = kondisi.filter(k => k.id_kondisi !== id);
      localStorage.setItem('momcare_kondisi', JSON.stringify(kondisi));
      return { ok: true, status: 200, data: { success: true, message: 'Dihapus' } };
    }

    // MENYUSUI LOGIC
    if (parts[1] === 'menyusui') {
      const menyusui = JSON.parse(localStorage.getItem('momcare_menyusui') || '[]');
      if (method === 'POST') {
        const id = menyusui.length + 1;
        const newM = { id_menyusui: id, id_user: uid, ...body };
        menyusui.push(newM);
        localStorage.setItem('momcare_menyusui', JSON.stringify(menyusui));
        return { ok: true, status: 201, data: { success: true, data: newM } };
      }
      if (parts[2] === 'tanggal') {
        const tgl = parts[3];
        const filtered = menyusui.filter(m => m.id_user === uid && m.tanggal === tgl);
        return { ok: true, status: 200, data: { success: true, data: filtered } };
      }
      if (method === 'DELETE') {
        const id = parseInt(parts[2]);
        const updated = menyusui.filter(m => m.id_menyusui !== id);
        localStorage.setItem('momcare_menyusui', JSON.stringify(updated));
        return { ok: true, status: 200, data: { success: true, message: 'Dihapus' } };
      }
    }

    // ISTIRAHAT LOGIC
    if (parts[1] === 'istirahat') {
      const istirahat = JSON.parse(localStorage.getItem('momcare_istirahat') || '[]');
      if (method === 'POST') {
        const id = istirahat.length + 1;
        const newI = { id_istirahat: id, id_user: uid, ...body };
        istirahat.push(newI);
        localStorage.setItem('momcare_istirahat', JSON.stringify(istirahat));
        return { ok: true, status: 201, data: { success: true, data: newI } };
      }
      if (parts[2] === 'tanggal') {
        const tgl = parts[3];
        const filtered = istirahat.filter(i => i.id_user === uid && i.tanggal === tgl);
        let total = 0;
        filtered.forEach(i => total += i.durasi);
        return { ok: true, status: 200, data: { success: true, data: { list: filtered, total_durasi: total } } };
      }
      if (method === 'DELETE') {
        const id = parseInt(parts[2]);
        const updated = istirahat.filter(i => i.id_istirahat !== id);
        localStorage.setItem('momcare_istirahat', JSON.stringify(updated));
        return { ok: true, status: 200, data: { success: true, message: 'Dihapus' } };
      }
    }

    // REMINDER LOGIC
    if (parts[1] === 'reminder') {
      const reminders = JSON.parse(localStorage.getItem('momcare_reminders') || '[]');
      if (method === 'GET') {
        const userR = reminders.filter(r => r.id_user === uid);
        return { ok: true, status: 200, data: { success: true, data: userR } };
      }
      if (method === 'POST') {
        const id = reminders.length + 1;
        const newR = { id_reminder: id, id_user: uid, ...body };
        reminders.push(newR);
        localStorage.setItem('momcare_reminders', JSON.stringify(reminders));
        return { ok: true, status: 201, data: { success: true, data: newR } };
      }
      if (parts[3] === 'toggle') {
        const id = parseInt(parts[2]);
        const idx = reminders.findIndex(r => r.id_reminder === id);
        if (idx !== -1) {
          reminders[idx].status = !reminders[idx].status;
          localStorage.setItem('momcare_reminders', JSON.stringify(reminders));
        }
        return { ok: true, status: 200, data: { success: true, message: 'Toggled' } };
      }
      if (method === 'DELETE') {
        const id = parseInt(parts[2]);
        const updated = reminders.filter(r => r.id_reminder !== id);
        localStorage.setItem('momcare_reminders', JSON.stringify(updated));
        return { ok: true, status: 200, data: { success: true, message: 'Dihapus' } };
      }
    }

    // ADMIN DIRECT ACCESS SIMULATOR
    if (parts[1] === 'admin') {
      const users = JSON.parse(localStorage.getItem('momcare_users') || '[]');
      
      if (parts[2] === 'users') {
        if (!parts[3]) {
          // GET ALL PATIENTS FOR ADMIN
          const patients = users.filter(u => u.role === 'user');
          const resList = patients.map(p => {
            const tgl = new Date(p.tanggal_melahirkan);
            const hariNifas = Math.max(1, Math.floor((Date.now() - tgl.getTime()) / 86400000) + 1);

            const kondisi = JSON.parse(localStorage.getItem('momcare_kondisi') || '[]');
            const userKondisi = kondisi.filter(k => k.id_user === p.id_user);
            const latestK = userKondisi.length > 0 ? userKondisi[userKondisi.length - 1] : null;

            let hasWarning = false;
            let warningMessages = [];
            if (latestK) {
              if (latestK.suhu >= 38.0) { warningMessages.push("Suhu tinggi"); hasWarning = true; }
              if (latestK.perdarahan === 'banyak') { warningMessages.push("Perdarahan banyak"); hasWarning = true; }
              if (latestK.nyeri === 'berat') { warningMessages.push("Nyeri hebat"); hasWarning = true; }
              if (latestK.kondisi_luka === 'bernanah') { warningMessages.push("Luka bernanah"); hasWarning = true; }
              if (latestK.emosional === 'depresi') { warningMessages.push("Depresi berat"); hasWarning = true; }
            }

            return {
              id_user: p.id_user,
              nama: p.nama,
              email: p.email,
              tanggal_melahirkan: p.tanggal_melahirkan,
              hari_nifas: hariNifas,
              has_warning: hasWarning,
              warning_messages: warningMessages,
              kondisi_terbaru: latestK
            };
          });
          return { ok: true, status: 200, data: { success: true, data: resList } };
        } else {
          // GET SPECIFIC PATIENT DETAILS FOR ADMIN
          const pid = parseInt(parts[3]);
          const targetUser = users.find(u => u.id_user === pid);
          if (!targetUser) return { ok: false, status: 404, data: { message: 'Not Found' } };

          const kondisi = JSON.parse(localStorage.getItem('momcare_kondisi') || '[]');
          const menyusui = JSON.parse(localStorage.getItem('momcare_menyusui') || '[]');
          const istirahat = JSON.parse(localStorage.getItem('momcare_istirahat') || '[]');

          const uKondisi = kondisi.filter(k => k.id_user === pid);
          const uMenyusui = menyusui.filter(m => m.id_user === pid);
          const uIstirahat = istirahat.filter(i => i.id_user === pid);

          return {
            ok: true,
            status: 200,
            data: {
              success: true,
              data: {
                user: targetUser,
                kondisi_logs: uKondisi,
                menyusui_logs: uMenyusui,
                istirahat_logs: uIstirahat
              }
            }
          };
        }
      }
    }

    return { ok: false, status: 404, data: { success: false, message: 'Endpoint tidak ditemukan' } };
  },

  get(path)         { return this.request('GET', path); },
  post(path, body)  { return this.request('POST', path, body); },
  put(path, body)   { return this.request('PUT', path, body); },
  patch(path, body) { return this.request('PATCH', path, body); },
  del(path)         { return this.request('DELETE', path); },
};

// ===== UI HELPERS =====
function showAlert(msg, type = 'error') {
  const el = document.getElementById('alertBox');
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (text) text.classList.toggle('hidden', loading);
  if (loader) loader.classList.toggle('hidden', !loading);
}

function formatDurasi(detik) {
  const h = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const s = detik % 60;
  if (h > 0) return `${h} jam ${m} menit`;
  if (m > 0) return `${m} menit ${s} detik`;
  return `${s} detik`;
}

function formatJam(detik) {
  const h = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function padTwo(n) {
  return String(n).padStart(2, '0');
}

function timerStr(sec) {
  return `${padTwo(Math.floor(sec/3600))}:${padTwo(Math.floor((sec%3600)/60))}:${padTwo(sec%60)}`;
}

function initSidebar() {
  // Mock native: no sidebar needed since bottom nav handles navigation perfectly
}
