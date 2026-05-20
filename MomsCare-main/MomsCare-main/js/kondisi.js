// ===== UPGRADED KONDISI JS =====
if (!api.requireAuth()) throw new Error('unauth');

// Set default date
document.getElementById('tanggal').value = today();

const labelMap = {
  nyeri:    { ringan: '🟢 Ringan', sedang: '🟡 Sedang', berat: '🔴 Berat' },
  perdarahan: { normal: '🟢 Normal', banyak: '🔴 Banyak', tidak_ada: '⚪ Tidak Ada' },
  kondisi_luka: { baik: '🟢 Baik', bengkak: '🟡 Bengkak', bernanah: '🔴 Bernanah' },
  emosional: { baik: '🟢 Tenang', cemas: '🟡 Cemas', sedih: '🟡 Sedih', depresi: '🔴 Depresi' },
};

function getBadgeClass(val) {
  if (['berat', 'banyak', 'bernanah', 'depresi'].includes(val)) return 'badge-danger';
  if (['sedang', 'bengkak', 'cemas', 'sedih'].includes(val)) return 'badge-warning';
  return 'badge-success';
}

async function loadRiwayat() {
  const res = await api.get('/kondisi');
  const el = document.getElementById('riwayatKondisi');
  if (!res.ok || !res.data.data || res.data.data.length === 0) {
    el.innerHTML = `<p class="empty-state">Belum ada riwayat kondisi.</p>`;
    renderChart([]);
    return;
  }

  const list = res.data.data;
  el.innerHTML = list.map(k => `
    <div class="interactive-item" style="cursor: default; display:flex; flex-direction:column; align-items:flex-start; gap:8px;">
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <span class="item-name">📅 ${k.tanggal}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="badge badge-primary">Suhu: ${k.suhu}°C</span>
          <button onclick="hapusKondisi(${k.id_kondisi})" style="background:none; border:none; cursor:pointer; font-size:16px;">🗑️</button>
        </div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <span class="badge ${getBadgeClass(k.nyeri)}">Nyeri: ${k.nyeri}</span>
        <span class="badge ${getBadgeClass(k.perdarahan)}">Lochia: ${k.perdarahan}</span>
        <span class="badge ${getBadgeClass(k.kondisi_luka)}">Luka: ${k.kondisi_luka}</span>
        <span class="badge ${getBadgeClass(k.emosional)}">Emosi: ${k.emosional}</span>
      </div>
      ${k.catatan ? `<div style="font-size:12px; color:var(--gray-medium); border-left:2px solid var(--pink-primary); padding-left:8px; margin-top:4px;">📝 ${k.catatan}</div>` : ''}
    </div>
  `).join('');

  renderChart(list);
}

function renderChart(list) {
  const chartContainer = document.getElementById('chartContainer');
  if (!list || list.length === 0) {
    chartContainer.innerHTML = '<p class="empty-state" style="width:100%;">Belum ada data grafik.</p>';
    return;
  }

  // Take up to latest 5 items, reverse to show chronological left-to-right
  const items = list.slice(0, 5).reverse();
  
  chartContainer.innerHTML = items.map(k => {
    // Determine bar height by temperature mapping (36-40 scale)
    const baseTemp = 36.0;
    const maxTemp = 40.0;
    const rawVal = Math.max(baseTemp, Math.min(maxTemp, k.suhu));
    const pct = ((rawVal - baseTemp) / (maxTemp - baseTemp)) * 100;
    const height = Math.max(10, Math.min(100, pct)); // bound height between 10px and 100px

    // Determine bar color based on warning flags
    let color = 'linear-gradient(180deg, var(--pink-light) 0%, var(--pink-primary) 100%)';
    if (k.suhu >= 38.0 || k.perdarahan === 'banyak' || k.nyeri === 'berat') {
      color = 'linear-gradient(180deg, #fca5a5 0%, var(--red-danger) 100%)';
    }

    // Format date string to short label (e.g. "18 Mei")
    const d = new Date(k.tanggal);
    const dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return `
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="height: ${height}px; background: ${color};" title="Suhu: ${k.suhu}°C"></div>
        <span class="chart-label">${dateLabel}</span>
      </div>
    `;
  }).join('');
}

async function hapusKondisi(id) {
  if (!confirm('Hapus data kondisi ini?')) return;
  const res = await api.del(`/kondisi/${id}`);
  if (res.ok) {
    showAlert('Data berhasil dihapus', 'success');
    loadRiwayat();
  } else {
    showAlert(res.data.message || 'Gagal menghapus');
  }
}

document.getElementById('kondisiForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const res = await api.post('/kondisi', {
    nyeri: document.getElementById('nyeri').value,
    perdarahan: document.getElementById('perdarahan').value,
    suhu: parseFloat(document.getElementById('suhu').value),
    kondisi_luka: document.getElementById('kondisiLuka').value,
    emosional: document.getElementById('emosional').value,
    catatan: document.getElementById('catatan').value,
    tanggal: document.getElementById('tanggal').value,
  });
  
  if (res.ok) {
    showAlert('✅ Catatan kondisi berhasil disimpan!', 'success');
    e.target.reset();
    document.getElementById('tanggal').value = today();
    loadRiwayat();
    
    // Switch to history tab automatically to show the entry!
    setTimeout(() => switchTab('riwayat'), 800);
  } else {
    showAlert(res.data.message || 'Gagal menyimpan');
  }
});

loadRiwayat();
