/**
 * pengaturan.js - School Profile, Signers, Year Lock/Rollover, Password, Backup & Audit Logs
 * SMP Negeri 1 Penajam Paser Utara
 */

class PengaturanController {
    constructor() {
        this.currentTab = 'sekolah'; // 'sekolah', 'pejabat', 'periode', 'keamanan', 'backup', 'log'
        this.logSearchQuery = '';
    }

    render() {
        const settings = window.DB.getSettings();
        const year = window.Auth.currentYear;

        // Populate School Profile fields
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('cfg-nama-sekolah', settings.namaSekolah);
        setVal('cfg-npsn', settings.npsn);
        setVal('cfg-alamat', settings.alamat);
        setVal('cfg-kabupaten', settings.kabupaten);
        setVal('cfg-provinsi', settings.provinsi);
        setVal('cfg-kodepos', settings.kodePos);
        setVal('cfg-telp', settings.telp);
        setVal('cfg-email', settings.email);
        setVal('cfg-website', settings.website);

        // Populate Signers fields
        setVal('cfg-kepsek-nama', settings.kepalaSekolah);
        setVal('cfg-kepsek-nip', settings.nipKepalaSekolah);
        setVal('cfg-kepsek-pangkat', settings.pangkatKepalaSekolah);
        setVal('cfg-pengurus-nama', settings.pengurusBarang);
        setVal('cfg-pengurus-nip', settings.nipPengurusBarang);
        setVal('cfg-pengurus-pangkat', settings.pangkatPengurusBarang);
        setVal('cfg-kota-ttd', settings.kotaTandaTangan);

        // Populate Year Lock status
        const isLocked = window.DB.isYearLocked(year);
        const lockStatusEl = document.getElementById('cfg-year-lock-status-badge');
        const lockBtn = document.getElementById('cfg-btn-toggle-lock');

        if (lockStatusEl) {
            lockStatusEl.className = isLocked ? 'badge badge-danger' : 'badge badge-success';
            lockStatusEl.textContent = isLocked ? `Tahun ${year} Terkunci (Read-Only)` : `Tahun ${year} Terbuka (Bisa Diedit)`;
        }
        if (lockBtn) {
            lockBtn.className = isLocked ? 'btn btn-success' : 'btn btn-danger';
            lockBtn.textContent = isLocked ? `Buka Kunci TA ${year}` : `Kunci TA ${year} (Read-Only)`;
        }

        // Render Activity Logs
        this.renderLogs();
    }

    setTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('#pengaturan-tabs-header .tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        document.querySelectorAll('.pengaturan-tab-content').forEach(panel => {
            if (panel.id === `tab-pane-${tab}`) {
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
            }
        });
    }

    saveProfile() {
        const getVal = (id) => document.getElementById(id).value.trim();

        const newSettings = {
            namaSekolah: getVal('cfg-nama-sekolah'),
            npsn: getVal('cfg-npsn'),
            alamat: getVal('cfg-alamat'),
            kabupaten: getVal('cfg-kabupaten'),
            provinsi: getVal('cfg-provinsi'),
            kodePos: getVal('cfg-kodepos'),
            telp: getVal('cfg-telp'),
            email: getVal('cfg-email'),
            website: getVal('cfg-website')
        };

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
        window.DB.updateSettings(newSettings, user);
        window.App.showToast('success', 'Pengaturan Tersimpan', 'Identitas sekolah berhasil diperbarui.');
    }

    saveSigners() {
        const getVal = (id) => document.getElementById(id).value.trim();

        const newSettings = {
            kepalaSekolah: getVal('cfg-kepsek-nama'),
            nipKepalaSekolah: getVal('cfg-kepsek-nip'),
            pangkatKepalaSekolah: getVal('cfg-kepsek-pangkat'),
            pengurusBarang: getVal('cfg-pengurus-nama'),
            nipPengurusBarang: getVal('cfg-pengurus-nip'),
            pangkatPengurusBarang: getVal('cfg-pengurus-pangkat'),
            kotaTandaTangan: getVal('cfg-kota-ttd')
        };

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
        window.DB.updateSettings(newSettings, user);
        window.App.showToast('success', 'Pejabat Tersimpan', 'Data pejabat penandatangan laporan berhasil diperbarui.');
    }

    toggleYearLock() {
        const year = window.Auth.currentYear;
        const currentLock = window.DB.isYearLocked(year);
        const action = currentLock ? 'membuka kunci' : 'mengunci';

        if (confirm(`Apakah Anda yakin ingin ${action} Tahun Anggaran ${year}?\n\nJika dikunci, transaksi tidak dapat ditambah, diubah, atau dihapus.`)) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            window.DB.toggleLockYear(year, !currentLock, user);
            window.App.updateHeaderYearStatus();
            this.render();
            window.App.showToast('success', 'Status Periode Berubah', `Tahun Anggaran ${year} sekarang ${!currentLock ? 'TERKUNCI' : 'TERBUKA'}.`);
        }
    }

    handleRolloverSaldo() {
        const fromYear = window.Auth.currentYear;
        const toYear = fromYear + 1;

        if (!confirm(`TUTUP BUKU & SALIN SALDO AWAL OTOMATIS\n\nSistem akan mengambil seluruh saldo akhir persediaan pada akhir tahun ${fromYear} (dengan metode FIFO) dan menyalinnya menjadi Saldo Awal pada Tahun Anggaran ${toYear}.\n\nLanjutkan proses salin saldo awal?`)) {
            return;
        }

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';

        try {
            const res = window.DB.rolloverToNextYear(fromYear, toYear, user);
            window.App.showToast('success', 'Rollover Saldo Berhasil', `Saldo Awal TA ${toYear} berhasil dibuat (${res.details.length} lapisan persediaan terbawa).`);
            
            if (confirm(`Saldo awal TA ${toYear} berhasil dibuat!\n\nApakah Anda ingin langsung beralih ke Tahun Anggaran ${toYear} sekarang?`)) {
                window.Auth.setYear(toYear);
            }
        } catch (err) {
            alert('GAGAL ROLLOVER SALDO:\n\n' + err.message);
            window.App.showToast('error', 'Gagal Rollover Saldo', err.message);
        }
    }

    async handleChangePassword() {
        const oldPass = document.getElementById('cfg-pass-old').value;
        const newPass = document.getElementById('cfg-pass-new').value;
        const confirmPass = document.getElementById('cfg-pass-confirm').value;

        if (!oldPass || !newPass || !confirmPass) {
            window.App.showToast('error', 'Validasi Gagal', 'Semua kolom kata sandi wajib diisi');
            return;
        }

        if (newPass.length < 6) {
            window.App.showToast('error', 'Validasi Gagal', 'Kata sandi baru minimal 6 karakter');
            return;
        }

        if (newPass !== confirmPass) {
            window.App.showToast('error', 'Validasi Gagal', 'Konfirmasi kata sandi baru tidak cocok');
            return;
        }

        const oldHash = await window.Auth.hashPassword(oldPass);
        const currentUser = window.DB.getUser();

        if (oldHash !== currentUser.passwordHash) {
            window.App.showToast('error', 'Verifikasi Gagal', 'Kata sandi saat ini yang Anda masukkan salah');
            return;
        }

        const newHash = await window.Auth.hashPassword(newPass);
        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
        window.DB.updateUserPassword(newHash, user);

        document.getElementById('cfg-pass-old').value = '';
        document.getElementById('cfg-pass-new').value = '';
        document.getElementById('cfg-pass-confirm').value = '';

        window.App.showToast('success', 'Password Berhasil Diubah', 'Kata sandi akun operator telah diperbarui dengan aman.');
    }

    downloadBackupJSON() {
        const jsonStr = window.DB.exportBackupJSON();
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `Backup_Persediaan_SMPN1PPU_${dateStr}.json`;

        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
        window.DB.logActivity('BACKUP_DATA', 'Backup & Pemulihan', `Mengunduh berkas cadangan data: ${fileName}`, user);
        window.App.showToast('success', 'Cadangan Diunduh', `Berkas ${fileName} berhasil disimpan ke komputer Anda.`);
    }

    handleRestoreFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm(`PERINGATAN PEMULIHAN DATA!\n\nMemulihkan data akan menggantikan data yang ada di sistem dengan data dari berkas cadangan "${file.name}".\n\nPastikan Anda sudah mengunduh cadangan saat ini terlebih dahulu.\n\nLanjutkan pemulihan?`)) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            try {
                window.DB.importBackupJSON(content, user);
                window.App.showToast('success', 'Pemulihan Berhasil', 'Data aplikasi persediaan berhasil dipulihkan!');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (err) {
                alert('GAGAL MEMULIHKAN DATA:\n\n' + err.message);
                window.App.showToast('error', 'Pemulihan Gagal', err.message);
            }
        };
        reader.readAsText(file);
    }

    handleResetDemo() {
        if (confirm('RESET KE DATA DEMO AWAL?\n\nSemua perubahan data yang pernah dibuat akan dikembalikan ke data demo awal SMPN 1 Penajam Paser Utara.\n\nApakah Anda yakin?')) {
            window.DB.resetToDefault();
            window.App.showToast('info', 'Data Direset', 'Data persediaan telah dikembalikan ke kondisi demo awal.');
            setTimeout(() => {
                window.location.reload();
            }, 800);
        }
    }

    renderLogs() {
        const tbody = document.getElementById('cfg-log-table-tbody');
        if (!tbody) return;

        let logs = window.DB.data.activityLog || [];
        if (this.logSearchQuery) {
            const q = this.logSearchQuery.toLowerCase();
            logs = logs.filter(l => 
                (l.detail || '').toLowerCase().includes(q) ||
                (l.aksi || '').toLowerCase().includes(q) ||
                (l.modul || '').toLowerCase().includes(q)
            );
        }

        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--slate-400);">Tidak ada catatan log aktivitas</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.slice(0, 100).map((l, idx) => {
            let badgeClass = 'badge-secondary';
            if (l.aksi.includes('TAMBAH') || l.aksi.includes('LOGIN_BERHASIL')) badgeClass = 'badge-success';
            else if (l.aksi.includes('UBAH')) badgeClass = 'badge-primary';
            else if (l.aksi.includes('HAPUS') || l.aksi.includes('GAGAL')) badgeClass = 'badge-danger';
            else if (l.aksi.includes('KUNCI') || l.aksi.includes('OPNAME')) badgeClass = 'badge-warning';

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td style="font-size: 11.5px; white-space: nowrap;">${new Date(l.waktu).toLocaleString('id-ID')}</td>
                    <td><code>${l.user}</code></td>
                    <td><span class="badge ${badgeClass}">${l.aksi}</span></td>
                    <td>
                        <strong style="color: var(--slate-800);">${l.modul}</strong>
                        <div style="font-size: 12px; color: var(--slate-600);">${l.detail}</div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    clearLogs() {
        if (confirm('Bersihkan seluruh riwayat log aktivitas sistem?')) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            window.DB.data.activityLog = [];
            window.DB.logActivity('BERSIHKAN_LOG', 'Log Sistem', 'Riwayat log aktivitas telah dibersihkan oleh pengguna', user);
            this.renderLogs();
            window.App.showToast('info', 'Log Dibersihkan', 'Riwayat log aktivitas telah dikosongkan.');
        }
    }
}

// Global Singleton
window.PengaturanModule = new PengaturanController();
