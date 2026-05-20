// ===== PROFIL PAGE =====
if (!api.requireAuth()) throw new Error('unauth');
initSidebar();

async function loadProfil() {
  const res = await api.get('/profile');
  if (!res.ok) return;
  const u = res.data.data;
  document.getElementById('profileNama').textContent = u.nama;
  document.getElementById('profileEmail').textContent = u.email;
  document.getElementById('editNama').value = u.nama;
  document.getElementById('editTanggal').value = u.tanggal_melahirkan;

  // Hitung hari nifas
  const tgl = new Date(u.tanggal_melahirkan);
  const hari = Math.max(0, Math.floor((Date.now() - tgl.getTime()) / 86400000) + 1);
  document.getElementById('profileHari').textContent = `Hari ke-${hari} masa nifas`;
}

document.getElementById('profilForm').addEventListener('submit', async e => {
  e.preventDefault();
  const res = await api.put('/profile', {
    nama: document.getElementById('editNama').value,
    tanggal_melahirkan: document.getElementById('editTanggal').value,
  });
  if (res.ok) {
    // Update local storage
    const user = api.getUser();
    if (user) {
      user.nama = document.getElementById('editNama').value;
      user.tanggal_melahirkan = document.getElementById('editTanggal').value;
      localStorage.setItem('momcare_user', JSON.stringify(user));
    }
    showAlert('✅ Profil diperbarui!', 'success');
    loadProfil();
  } else showAlert(res.data.message || 'Gagal update profil');
});

document.getElementById('logoutBtnMain')?.addEventListener('click', () => {
  api.clearAuth();
  window.location.href = 'index.html';
});

loadProfil();
