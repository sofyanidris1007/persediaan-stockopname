/**
 * opname.js - Physical Stock Opname (Count vs System), Variance Calculation & Official BA
 * SMP Negeri 1 Penajam Paser Utara
 */

class OpnameController {
    constructor() {
        this.opnameItems = [];
    }

    render() {
        const year = window.Auth.currentYear;
        const headers = window.DB.getOpnameHeaders(year);

        // Sort descending
        headers.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

        const tbody = document.getElementById('opname-table-tbody');
        const countBadge = document.getElementById('opname-count-badge');
        if (countBadge) countBadge.textContent = `${headers.length} Sesi Opname`;

        if (!tbody) return;

        if (headers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 28px; color: var(--slate-400);">Belum ada sesi stok opname yang dibuat pada Tahun Anggaran ${year}</td></tr>`;
            return;
        }

        tbody.innerHTML = headers.map((h, idx) => {
            const details = window.DB.getOpnameDetailsByHeaderId(h.id);
            const totalSelisihQty = details.reduce((sum, d) => sum + Math.abs(d.selisih), 0);
            const totalSelisihNilai = details.reduce((sum, d) => sum + d.nilaiSelisih, 0);

            const isApproved = h.status === 'disetujui';
            const statusBadge = isApproved 
                ? '<span class="badge badge-success">Disetujui & Disesuaikan</span>' 
                : '<span class="badge badge-warning">Draft (Belum Disesuaikan)</span>';

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${window.FIFOEngine.formatTanggalIndo(h.tanggal)}</strong></td>
                    <td><code>${h.noBA}</code></td>
                    <td>
                        <strong>${h.keterangan || 'Stok Opname Persediaan'}</strong>
                        <div style="font-size: 11px; color: var(--slate-500);">${details.length} jenis barang diperiksa</div>
                    </td>
                    <td class="text-center">
                        ${totalSelisihQty === 0 
                            ? '<span class="badge badge-success">✓ 100% Sesuai</span>' 
                            : `<span class="badge badge-warning">Ada ${totalSelisihQty} Selisih Unit (${window.FIFOEngine.formatRupiah(totalSelisihNilai)})</span>`}
                    </td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-center no-print">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button class="btn btn-secondary btn-icon" title="Lihat Berita Acara" onclick="window.OpnameModule.viewBA('${h.id}')">
                                ${window.App.getIcon('eye', 14)}
                            </button>
                            <button class="btn btn-secondary btn-icon" title="Cetak Berita Acara Opname" onclick="window.OpnameModule.printBA('${h.id}')">
                                ${window.App.getIcon('printer', 14)}
                            </button>
                            <button class="btn btn-danger btn-icon" title="Hapus Opname" onclick="window.OpnameModule.deleteItem('${h.id}')">
                                ${window.App.getIcon('trash', 14)}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openCreateModal() {
        const year = window.Auth.currentYear;
        if (window.DB.isYearLocked(year)) {
            window.App.showToast('error', 'Tahun Terkunci', `Tahun anggaran ${year} sedang dikunci.`);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const rnd = String(window.DB.getOpnameHeaders(year).length + 1).padStart(2, '0');

        document.getElementById('opname-form-tanggal').value = today;
        document.getElementById('opname-form-noba').value = `BA-OPN/${year}/${rnd}`;
        document.getElementById('opname-form-keterangan').value = `Pemeriksaan Fisik Persediaan Barang Habis Pakai Triwulan TA ${year}`;

        // Populate items with current real-time system stock
        const state = window.FIFOEngine.calculateStockState(year, today);
        const activeBarang = window.DB.getBarangList(false);

        this.opnameItems = activeBarang.map(b => {
            const itemSummary = state.summary[b.id] || { currentQty: 0, currentNilai: 0 };
            const unitPrice = itemSummary.currentQty > 0 ? (itemSummary.currentNilai / itemSummary.currentQty) : 0;
            return {
                barangId: b.id,
                kode: b.kode,
                nama: b.nama,
                satuan: b.satuan,
                stokSistem: itemSummary.currentQty,
                stokFisik: itemSummary.currentQty, // Default match
                selisih: 0,
                unitPrice: unitPrice,
                nilaiSelisih: 0,
                keterangan: 'Sesuai'
            };
        });

        this.renderOpnameTableRows();
        window.App.openModal('modal-opname-form');
    }

    renderOpnameTableRows() {
        const tbody = document.getElementById('opname-form-detail-tbody');
        if (!tbody) return;

        let totalSistem = 0;
        let totalFisik = 0;
        let totalSelisihNilai = 0;

        tbody.innerHTML = this.opnameItems.map((item, idx) => {
            totalSistem += item.stokSistem;
            totalFisik += item.stokFisik;
            totalSelisihNilai += item.nilaiSelisih;

            let diffBadge = '<span class="badge badge-success">0 (Cocok)</span>';
            if (item.selisih > 0) {
                diffBadge = `<span class="badge badge-primary">+${item.selisih} (Lebih)</span>`;
            } else if (item.selisih < 0) {
                diffBadge = `<span class="badge badge-danger">${item.selisih} (Kurang)</span>`;
            }

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><code>${item.kode}</code></td>
                    <td><strong>${item.nama}</strong></td>
                    <td class="text-center font-bold" style="color: var(--slate-700);">${item.stokSistem}</td>
                    <td style="width: 130px;">
                        <input type="number" step="any" min="0" class="form-control text-center font-bold" value="${item.stokFisik}" oninput="window.OpnameModule.updatePhysicalStock(${idx}, this.value)">
                    </td>
                    <td class="text-center">${item.satuan}</td>
                    <td class="text-center font-bold">${diffBadge}</td>
                    <td class="text-right font-bold" style="color: ${item.nilaiSelisih < 0 ? 'var(--danger-600)' : (item.nilaiSelisih > 0 ? 'var(--primary-600)' : 'var(--slate-600)')};">
                        ${window.FIFOEngine.formatRupiah(item.nilaiSelisih)}
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm" value="${item.keterangan || ''}" placeholder="Catatan fisik..." onchange="window.OpnameModule.updateKeterangan(${idx}, this.value)">
                    </td>
                </tr>
            `;
        }).join('');

        const summaryEl = document.getElementById('opname-form-summary-text');
        if (summaryEl) {
            summaryEl.innerHTML = `Total Sistem: <strong>${totalSistem}</strong> | Total Fisik: <strong>${totalFisik}</strong> | Total Nilai Selisih: <strong>${window.FIFOEngine.formatRupiah(totalSelisihNilai)}</strong>`;
        }
    }

    updatePhysicalStock(index, val) {
        const item = this.opnameItems[index];
        if (!item) return;

        const fisik = Number(val) || 0;
        item.stokFisik = fisik;
        item.selisih = fisik - item.stokSistem;
        item.nilaiSelisih = item.selisih * (item.unitPrice || 0);

        if (item.selisih === 0) item.keterangan = 'Sesuai';
        else if (item.selisih > 0) item.keterangan = 'Selisih Lebih (Perlu Ditambahkan)';
        else item.keterangan = 'Selisih Kurang (Rusak / Hilang / Tidak Tercatat)';

        this.renderOpnameTableRows();
    }

    updateKeterangan(index, val) {
        if (this.opnameItems[index]) {
            this.opnameItems[index].keterangan = val;
        }
    }

    handleSave(isApproved) {
        const year = window.Auth.currentYear;
        const noBA = document.getElementById('opname-form-noba').value.trim();
        const tanggal = document.getElementById('opname-form-tanggal').value;
        const keterangan = document.getElementById('opname-form-keterangan').value.trim();

        if (!noBA) {
            window.App.showToast('error', 'Validasi Gagal', 'Nomor Berita Acara wajib diisi');
            return;
        }
        if (!tanggal) {
            window.App.showToast('error', 'Validasi Gagal', 'Tanggal Opname wajib diisi');
            return;
        }

        if (isApproved) {
            const hasVariance = this.opnameItems.some(i => i.selisih !== 0);
            const msg = hasVariance 
                ? 'Sistem akan otomatis mencatat Penyesuaian Masuk untuk selisih lebih dan Penyesuaian Keluar untuk selisih kurang agar catatan persediaan 100% cocok dengan fisik gudang.\n\nLanjutkan penyetujuan?'
                : 'Semua barang tercatat 100% cocok dengan fisik gudang.\n\nLanjutkan penyetujuan Berita Acara?';
            if (!confirm(msg)) return;
        }

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';

        try {
            window.DB.createOpname(
                { tahun: year, noBA, tanggal, keterangan },
                this.opnameItems,
                isApproved,
                user
            );
            window.App.showToast('success', isApproved ? 'Stok Opname Disetujui' : 'Draft Tersimpan', `Berita Acara ${noBA} berhasil diproses.`);
            window.App.closeActiveModal();
            this.render();
            if (window.DashboardModule) window.DashboardModule.render();
        } catch (err) {
            window.App.showToast('error', 'Gagal Memproses Opname', err.message);
        }
    }

    deleteItem(headerId) {
        const header = window.DB.getOpnameHeaderById(headerId);
        if (!header) return;

        if (confirm(`Hapus Berita Acara Stok Opname No. "${header.noBA}"?\n\nJika sudah disetujui, penyesuaian otomatis yang terkait juga akan dihapus.`)) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            try {
                window.DB.deleteOpname(headerId, user);
                window.App.showToast('success', 'Opname Dihapus', `Berita Acara ${header.noBA} berhasil dihapus.`);
                this.render();
                if (window.DashboardModule) window.DashboardModule.render();
            } catch (err) {
                window.App.showToast('error', 'Gagal Menghapus', err.message);
            }
        }
    }

    viewBA(headerId) {
        const header = window.DB.getOpnameHeaderById(headerId);
        if (!header) return;

        const details = window.DB.getOpnameDetailsByHeaderId(headerId);
        const settings = window.DB.getSettings();

        document.getElementById('modal-ba-noba').textContent = header.noBA;
        document.getElementById('modal-ba-tanggal').textContent = window.FIFOEngine.formatTanggalIndo(header.tanggal);
        document.getElementById('modal-ba-keterangan').textContent = header.keterangan || '-';
        document.getElementById('modal-ba-status').innerHTML = header.status === 'disetujui' 
            ? '<span class="badge badge-success">Telah Disesuaikan ke Pembukuan</span>' 
            : '<span class="badge badge-warning">Draft</span>';

        const tbody = document.getElementById('modal-ba-table-tbody');
        let grandSelisihNilai = 0;

        tbody.innerHTML = details.map((d, idx) => {
            const b = window.DB.getBarangById(d.barangId);
            grandSelisihNilai += d.nilaiSelisih;
            let diffBadge = '0 (Cocok)';
            if (d.selisih > 0) diffBadge = `+${d.selisih} (Lebih)`;
            else if (d.selisih < 0) diffBadge = `${d.selisih} (Kurang)`;

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><code>${b ? b.kode : '-'}</code></td>
                    <td><strong>${b ? b.nama : d.barangId}</strong></td>
                    <td class="text-center">${d.stokSistem}</td>
                    <td class="text-center font-bold">${d.stokFisik}</td>
                    <td class="text-center">${b ? b.satuan : ''}</td>
                    <td class="text-center font-bold">${diffBadge}</td>
                    <td class="text-right font-bold">${window.FIFOEngine.formatRupiah(d.nilaiSelisih)}</td>
                    <td>${d.keterangan || '-'}</td>
                </tr>
            `;
        }).join('');

        // Signatures
        document.getElementById('modal-ba-sign-city-date').textContent = `${settings.kotaTandaTangan}, ${window.FIFOEngine.formatTanggalIndo(header.tanggal)}`;
        document.getElementById('modal-ba-sign-kepsek-name').textContent = settings.kepalaSekolah;
        document.getElementById('modal-ba-sign-kepsek-nip').textContent = `NIP. ${settings.nipKepalaSekolah}`;
        document.getElementById('modal-ba-sign-pengurus-name').textContent = settings.pengurusBarang;
        document.getElementById('modal-ba-sign-pengurus-nip').textContent = `NIP. ${settings.nipPengurusBarang}`;

        window.App.openModal('modal-ba-view');
    }

    printBA(headerId) {
        this.viewBA(headerId);
        setTimeout(() => {
            window.print();
        }, 300);
    }
}

// Global Singleton
window.OpnameModule = new OpnameController();
