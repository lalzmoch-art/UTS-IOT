// ===== UPGRADED MENYUSUI JS =====
if (!api.requireAuth()) throw new Error('unauth');

let timerSec = 0, timerInterval = null, activeSisi = 'kiri';
const display = document.getElementById('timerDisplay');

// Sisi selector
document.querySelectorAll('.sisi-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sisi-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeSisi = btn.dataset.sisi;
  });
});

document.getElementById('btnStart').addEventListener('click', () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSec++;
    display.textContent = timerStr(timerSec);
  }, 1000);
  document.getElementById('btnStart').disabled = true;
  document.getElementById('btnStop').disabled = false;
});

document.getElementById('btnStop').addEventListener('click', async () => {
  clearInterval(timerInterval); timerInterval = null;
  if (timerSec < 5) { showAlert('Durasi terlalu singkat'); return; }
  
  const now = new Date();
  const res = await api.post('/menyusui', {
    sisi: activeSisi,
    durasi: timerSec,
    waktu: now.toTimeString().slice(0, 5),
    tanggal: today(),
  });
  
  if (res.ok) {
    showAlert(`✅ Sesi menyusui ${formatDurasi(timerSec)} disimpan!`, 'success');
    timerSec = 0;
    display.textContent = '00:00:00';
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnStop').disabled = true;
    
    await loadRiwayat();
    
    // Switch to summary tab automatically
    setTimeout(() => switchTab('ringkasan'), 800);
  } else {
    showAlert(res.data.message || 'Gagal menyimpan');
  }
});

document.getElementById('btnReset').addEventListener('click', () => {
  clearInterval(timerInterval); timerInterval = null;
  timerSec = 0; display.textContent = '00:00:00';
  document.getElementById('btnStart').disabled = false;
  document.getElementById('btnStop').disabled = true;
});

// Set defaults for manual input
document.getElementById('waktuManual').value = nowTime();
document.getElementById('tanggalManual').value = today();

// Manual form submit
document.getElementById('menyusuiForm').addEventListener('submit', async e => {
  e.preventDefault();
  const durMenit = parseInt(document.getElementById('durasiManual').value);
  
  const res = await api.post('/menyusui', {
    sisi: document.getElementById('sisiManual').value,
    durasi: durMenit * 60,
    waktu: document.getElementById('waktuManual').value,
    tanggal: document.getElementById('tanggalManual').value,
  });
  
  if (res.ok) {
    showAlert('✅ Sesi menyusui berhasil disimpan!', 'success');
    e.target.reset();
    document.getElementById('waktuManual').value = nowTime();
    document.getElementById('tanggalManual').value = today();
    
    await loadRiwayat();
    
    // Switch to summary tab automatically
    setTimeout(() => switchTab('ringkasan'), 800);
  } else {
    showAlert(res.data.message || 'Gagal menyimpan');
  }
});

function sisiIcon(s) {
  return s === 'kiri' ? '👈' : s === 'kanan' ? '👉' : '🤱';
}

async function loadRiwayat() {
  const res = await api.get(`/menyusui/tanggal/${today()}`);
  const el = document.getElementById('riwayatMenyusui');
  const totalSesiEl = document.getElementById('totalSesiVal');
  const totalDurasiEl = document.getElementById('totalDurasiVal');

  if (!res.ok || !res.data.data || res.data.data.length === 0) {
    el.innerHTML = '<p class="empty-state">Belum ada sesi menyusui hari ini.</p>';
    totalSesiEl.textContent = '0';
    totalDurasiEl.textContent = '0 mnt';
    return;
  }

  const logs = res.data.data;
  
  // Calculate totals
  let totalSec = 0;
  logs.forEach(m => totalSec += m.durasi);
  
  totalSesiEl.textContent = logs.length;
  totalDurasiEl.textContent = formatJam(totalSec);

  // Render list
  el.innerHTML = logs.map(m => `
    <div class="history-row">
      <div class="history-left">
        <span class="history-time">${sisiIcon(m.sisi)} Sisi ${m.sisi} — ${m.waktu}</span>
        <span class="history-sub">Tanggal: ${m.tanggal}</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="history-right">${formatDurasi(m.durasi)}</span>
        <button class="btn-icon" onclick="hapus(${m.id_menyusui})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function hapus(id) {
  if (!confirm('Hapus sesi menyusui ini?')) return;
  const res = await api.del(`/menyusui/${id}`);
  if (res.ok) {
    showAlert('Catatan berhasil dihapus', 'success');
    loadRiwayat();
  }
}

loadRiwayat();
