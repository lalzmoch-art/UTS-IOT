// ===== UPGRADED DASHBOARD JS =====
if (!api.requireAuth()) throw new Error('unauth');

async function loadDashboard() {
  const res = await api.get('/dashboard');
  if (!res.ok) return;
  const d = res.data.data;

  // Set greeting
  const user = api.getUser();
  document.getElementById('greetName').textContent = `Halo, ${user?.nama?.split(' ')[0] || 'Ibu'} 👋`;

  // Set hari nifas
  document.getElementById('hariNifasHeader').textContent = `Hari ke- ${d.hari_nifas || 1}`;

  // Update summary values
  const k = d.kondisi_terbaru;
  const kondisiValEl = document.getElementById('summaryKondisiVal');
  const kondisiIconEl = document.getElementById('summaryKondisiIcon');
  if (k) {
    let kondisiText = 'Baik';
    let isWarning = k.suhu >= 38.0 || k.perdarahan === 'banyak' || k.nyeri === 'berat' || k.kondisi_luka === 'bernanah' || k.emosional === 'depresi';
    
    if (isWarning) {
      kondisiText = 'Kurang';
      kondisiIconEl.textContent = '⚠️';
      kondisiIconEl.className = 'summary-status-badge';
      kondisiIconEl.style.background = '#fee2e2';
      kondisiIconEl.style.color = 'var(--red-danger)';
    } else {
      kondisiIconEl.textContent = '✔️';
      kondisiIconEl.className = 'summary-status-badge safe';
      kondisiIconEl.style.background = '#d1fae5';
      kondisiIconEl.style.color = 'var(--green-safe)';
    }
    kondisiValEl.textContent = kondisiText;
  } else {
    kondisiValEl.textContent = 'Belum dicatat';
    kondisiIconEl.textContent = '?';
    kondisiIconEl.className = 'summary-status-badge';
    kondisiIconEl.style.background = 'var(--gray-light)';
    kondisiIconEl.style.color = 'var(--gray-medium)';
  }

  // Menyusui summary
  document.getElementById('summaryMenyusuiVal').textContent = `${d.jumlah_menyusui || 0} kali hari ini`;

  // Istirahat summary
  document.getElementById('summaryIstirahatVal').textContent = formatJam(d.total_istirahat || 0);

  // Tanda bahaya summary
  const bahayaValEl = document.getElementById('summaryBahayaVal');
  const bahayaIconEl = document.getElementById('summaryBahayaIcon');
  if (d.has_warning) {
    bahayaValEl.textContent = 'Ada peringatan!';
    bahayaIconEl.textContent = '⚠️';
    bahayaIconEl.className = 'summary-status-badge';
    bahayaIconEl.style.background = '#fee2e2';
    bahayaIconEl.style.color = 'var(--red-danger)';
    
    // Show warning banner
    const banner = document.getElementById('warningBanner');
    if (banner) {
      document.getElementById('warningText').innerHTML = 
        `<strong>Deteksi Gejala:</strong> ${d.warning_messages.join(', ')}. Segera konsultasikan ke Bidan/Dokter.`;
      banner.classList.remove('hidden');
    }
  } else {
    bahayaValEl.textContent = 'Tidak ada';
    bahayaIconEl.textContent = '✔️';
    bahayaIconEl.className = 'summary-status-badge safe';
    bahayaIconEl.style.background = '#d1fae5';
    bahayaIconEl.style.color = 'var(--green-safe)';
    
    const banner = document.getElementById('warningBanner');
    if (banner) banner.classList.add('hidden');
  }
}

loadDashboard();
