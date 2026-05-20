// ===== REMINDER PAGE =====
if (!api.requireAuth()) throw new Error('unauth');
initSidebar();

const jenisIcon = { menyusui:'🤱', obat:'💊', istirahat:'😴', kontrol:'🏥' };
const jenisLabel = { menyusui:'Menyusui', obat:'Minum Obat/Vitamin', istirahat:'Istirahat', kontrol:'Jadwal Kontrol' };

document.getElementById('reminderForm').addEventListener('submit', async e => {
  e.preventDefault();
  const res = await api.post('/reminder', {
    jenis_reminder: document.getElementById('jenisReminder').value,
    label: document.getElementById('labelReminder').value,
    waktu: document.getElementById('waktuReminder').value,
    status: true,
  });
  if (res.ok) {
    showAlert('🔔 Reminder ditambahkan!', 'success');
    e.target.reset();
    loadReminders();
  } else showAlert(res.data.message || 'Gagal menyimpan');
});

async function toggleStatus(id) {
  await api.patch(`/reminder/${id}/toggle`, {});
  loadReminders();
}

async function hapus(id) {
  if (!confirm('Hapus reminder ini?')) return;
  const res = await api.del(`/reminder/${id}`);
  if (res.ok) { showAlert('Dihapus', 'success'); loadReminders(); }
}

async function loadReminders() {
  const res = await api.get('/reminder');
  const el = document.getElementById('reminderList');
  if (!res.ok || !res.data.data || res.data.data.length === 0) {
    el.innerHTML = '<p class="empty-state">Belum ada reminder. Tambahkan di atas!</p>'; return;
  }
  el.innerHTML = res.data.data.map(r => `
    <div class="reminder-item ${r.status ? '' : 'inactive'}">
      <label class="reminder-toggle">
        <input type="checkbox" ${r.status ? 'checked' : ''} onchange="toggleStatus(${r.id_reminder})" />
        <span class="toggle-slider"></span>
      </label>
      <div class="riwayat-info">
        <div class="riwayat-title">${jenisIcon[r.jenis_reminder]||'🔔'} ${jenisLabel[r.jenis_reminder]||r.jenis_reminder} — ${r.waktu}</div>
        ${r.label ? `<div class="riwayat-sub">${r.label}</div>` : ''}
      </div>
      <button class="btn-icon" onclick="hapus(${r.id_reminder})">🗑️</button>
    </div>
  `).join('');
}

loadReminders();
