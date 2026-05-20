// ===== UPGRADED ISTIRAHAT JS =====
if (!api.requireAuth()) throw new Error('unauth');

let timerSec = 0, timerInterval = null;
const display = document.getElementById('timerDisplay');

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
  
  const res = await api.post('/istirahat', { 
    durasi: timerSec, 
    tanggal: today() 
  });
  
  if (res.ok) {
    showAlert(`✅ Istirahat ${formatDurasi(timerSec)} disimpan!`, 'success');
    timerSec = 0; display.textContent = '00:00:00';
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

document.getElementById('tanggalManual').value = today();

document.getElementById('istirahatForm').addEventListener('submit', async e => {
  e.preventDefault();
  const menit = parseInt(document.getElementById('durasiManual').value);
  
  const res = await api.post('/istirahat', { 
    durasi: menit * 60, 
    tanggal: document.getElementById('tanggalManual').value 
  });
  
  if (res.ok) {
    showAlert('✅ Sesi istirahat disimpan!', 'success');
    e.target.reset();
    document.getElementById('tanggalManual').value = today();
    
    await loadRiwayat();
    
    // Switch to summary tab automatically
    setTimeout(() => switchTab('ringkasan'), 800);
  } else {
    showAlert(res.data.message || 'Gagal menyimpan');
  }
});

async function hapus(id) {
  if (!confirm('Hapus sesi istirahat ini?')) return;
  const res = await api.del(`/istirahat/${id}`);
  if (res.ok) { 
    showAlert('Catatan berhasil dihapus', 'success'); 
    loadRiwayat(); 
  }
}

async function loadRiwayat() {
  const res = await api.get(`/istirahat/tanggal/${today()}`);
  const el = document.getElementById('riwayatIstirahat');
  const totalEl = document.getElementById('totalIstirahat');
  
  if (!res.ok || !res.data.data) { 
    el.innerHTML = '<p class="empty-state">Belum ada sesi istirahat hari ini.</p>'; 
    totalEl.textContent = '0 jam 0 menit';
    return; 
  }
  
  const { list, total_durasi } = res.data.data;
  
  // Set total header card (Screen 6 style)
  totalEl.innerHTML = `${formatJam(total_durasi || 0)} <span style="font-size: 13px; font-weight: 500; display:block; margin-top:4px;">Dari ${list ? list.length : 0} sesi istirahat</span>`;
  
  if (!list || list.length === 0) { 
    el.innerHTML = '<p class="empty-state">Belum ada sesi istirahat hari ini.</p>'; 
    return; 
  }
  
  // Render list
  el.innerHTML = list.map(i => `
    <div class="history-row">
      <div class="history-left">
        <span class="history-time">😴 Istirahat Mandiri</span>
        <span class="history-sub">Tanggal: ${i.tanggal}</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="history-right">${formatDurasi(i.durasi)}</span>
        <button class="btn-icon" onclick="hapus(${i.id_istirahat})">🗑️</button>
      </div>
    </div>
  `).join('');
}

loadRiwayat();
