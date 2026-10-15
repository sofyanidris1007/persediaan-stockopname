/**
 * masuk.js - Persediaan Masuk (Saldo Awal, Pembelian, Penyesuaian) Header-Detail Engine
 * SMP Negeri 1 Penajam Paser Utara
 */

class MasukController {
    constructor() {
        this.currentTab = 'all'; // 'all', 'saldo_awal', 'pembelian', 'penyesuaian'
        this.searchQuery = '';
        this.editingHeaderId = null;
        this.formDetailRows = [];
    }

    render() {
        const year = window.Auth.currentYear;
        const allHeaders = window.DB.getMasukHeaders(year);

        // Filter by tab
        let filtered = allHeaders.filter(h => {
            if (this.currentTab !== 'all' && h.jenis !== this.currentTab) return false;
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const matchBast = h.noBast.toLowerCase().includes(q);
                const matchPemasok = (h.pemasok || '').toLowerCase().includes(q);
                const matchKet = (h.keterangan || '').toLowerCase().includes(q);
                if (!matchBast && !matchPemasok && !matchKet) return false;
            }
            return true;
        });

        // Sort by Tanggal BAST descending, then id descending
        filtered.sort((a, b) => {
            if (a.tglBast !== b.tglBast) return b.tglBast.localeCompare(a.tglBast);
            return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        const tbody = document.getElementById('masuk-table-tbody');
        const countBadge = document.getElementById('masuk-count-badge');
        if (countBadge) countBadge.textContent = `${filtered.length} Transaksi`;

        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 28px; color: var(--slate-400);">Tidak ada transaksi persediaan masuk yang sesuai filter</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((h, idx) => {
            const details = window.DB.getMasukDetailsByHeaderId(h.id);
            const totalNilai = details.reduce((sum, d) => sum + d.total, 0);

            let typeBadge = '<span class="badge badge-success">Pembelian</span>';
            if (h.jenis === 'saldo_awal') {
                typeBadge = '<span class="badge badge-secondary">Saldo Awal</span>';
            } else if (h.jenis === 'penyesuaian') {
                typeBadge = '<span class="badge badge-warning">Penyesuaian Opname</span>';
            }

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${window.FIFOEngine.formatTanggalIndo(h.tglBast)}</strong></td>
                    <td><code>${h.noBast}</code></td>
                    <td>${typeBadge}</td>
                    <td>
                        <strong>${h.pemasok || '-'}</strong>
                        <div style="font-size: 11.5px; color: var(--slate-500);">${h.keterangan || '-'}</div>
                    </td>
                    <td class="text-center">
                        <span class="badge badge-primary">${details.length} Barang</span>
                    </td>
                    <td class="text-right font-bold" style="color: var(--primary-700);">
                        ${window.FIFOEngine.formatRupiah(totalNilai)}
                    </td>
                    <td class="text-center no-print">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button class="btn btn-secondary btn-icon" title="Lihat Detail Transaksi" onclick="window.MasukModule.viewDetail('${h.id}')">
                                ${window.App.getIcon('eye', 14)}
                            </button>
                            <button class="btn btn-secondary btn-icon" title="Cetak Bukti Penerimaan" onclick="window.MasukModule.printReceipt('${h.id}')">
                                ${window.App.getIcon('printer', 14)}
                            </button>
                            ${h.jenis !== 'penyesuaian' ? `
                                <button class="btn btn-secondary btn-icon" title="Edit Transaksi" onclick="window.MasukModule.openEditModal('${h.id}')">
                                    ${window.App.getIcon('edit', 14)}
                                </button>
                                <button class="btn btn-danger btn-icon" title="Hapus Transaksi" onclick="window.MasukModule.deleteItem('${h.id}')">
                                    ${window.App.getIcon('trash', 14)}
                                </button>
                            ` : `
                                <span style="font-size: 10px; color: var(--slate-400); padding: 4px;">(Dari Opname)</span>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    setTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('#masuk-tabs-header .tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        this.render();
    }

    openCreateModal(defaultType = 'pembelian') {
        const year = window.Auth.currentYear;
        if (window.DB.isYearLocked(year)) {
            window.App.showToast('error', 'Tahun Terkunci', `Tahun anggaran ${year} sedang dikunci. Data tidak dapat ditambahkan.`);
            return;
        }

        this.editingHeaderId = null;
        document.getElementById('modal-masuk-title').textContent = 'Tambah Persediaan Masuk';
        document.getElementById('masuk-form-jenis').value = defaultType;

        const defaultDate = defaultType === 'saldo_awal' ? `${year}-01-02` : new Date().toISOString().split('T')[0];
        document.getElementById('masuk-form-tanggal').value = defaultDate;

        const rnd = Math.floor(100 + Math.random() * 900);
        document.getElementById('masuk-form-nobast').value = defaultType === 'saldo_awal' 
            ? `BAST-SA/${year}/${rnd}` 
            : `BAST-BL/${year}/${rnd}`;

        document.getElementById('masuk-form-pemasok').value = defaultType === 'saldo_awal' ? 'Inventaris Terbawa Sekolah' : '';
        document.getElementById('masuk-form-keterangan').value = defaultType === 'saldo_awal' ? 'Saldo Awal Awal Tahun Anggaran' : 'Pengadaan ATK KBM';

        // Start with 1 empty item row
        const barangList = window.DB.getBarangList(false);
        const firstBarang = barangList.length > 0 ? barangList[0].id : '';

        this.formDetailRows = [
            { id: Date.now(), barangId: firstBarang, qty: 10, hargaSatuan: 50000, total: 500000 }
        ];

        this.renderFormDetailRows();
        window.App.openModal('modal-masuk-form');
    }

    openEditModal(headerId) {
        const year = window.Auth.currentYear;
        if (window.DB.isYearLocked(year)) {
            window.App.showToast('error', 'Tahun Terkunci', `Tahun anggaran ${year} sedang dikunci.`);
            return;
        }

        const header = window.DB.getMasukHeaderById(headerId);
        if (!header) return;

        this.editingHeaderId = headerId;
        document.getElementById('modal-masuk-title').textContent = `Ubah Persediaan Masuk: ${header.noBast}`;
        document.getElementById('masuk-form-jenis').value = header.jenis;
        document.getElementById('masuk-form-tanggal').value = header.tglBast;
        document.getElementById('masuk-form-nobast').value = header.noBast;
        document.getElementById('masuk-form-pemasok').value = header.pemasok || '';
        document.getElementById('masuk-form-keterangan').value = header.keterangan || '';

        const details = window.DB.getMasukDetailsByHeaderId(headerId);
        this.formDetailRows = details.map(d => ({
            id: d.id,
            barangId: d.barangId,
            qty: d.qty,
            hargaSatuan: d.hargaSatuan,
            total: d.total
        }));

        this.renderFormDetailRows();
        window.App.openModal('modal-masuk-form');
    }

    addFormDetailRow() {
        const barangList = window.DB.getBarangList(false);
        const firstBarang = barangList.length > 0 ? barangList[0].id : '';
        this.formDetailRows.push({
            id: Date.now() + Math.random(),
            barangId: firstBarang,
            qty: 1,
            hargaSatuan: 0,
            total: 0
        });
        this.renderFormDetailRows();
    }

    removeFormDetailRow(index) {
        if (this.formDetailRows.length <= 1) {
            window.App.showToast('warning', 'Peringatan', 'Minimal harus terdapat 1 barang dalam transaksi');
            return;
        }
        this.formDetailRows.splice(index, 1);
        this.renderFormDetailRows();
    }

    renderFormDetailRows() {
        const tbody = document.getElementById('masuk-form-detail-tbody');
        const barangList = window.DB.getBarangList(false);
        let grandTotal = 0;

        if (!tbody) return;

        tbody.innerHTML = this.formDetailRows.map((row, idx) => {
            const currentItem = window.DB.getBarangById(row.barangId);
            const satuan = currentItem ? currentItem.satuan : '-';
            const rowTot = (Number(row.qty) || 0) * (Number(row.hargaSatuan) || 0);
            grandTotal += rowTot;

            const optionsHtml = barangList.map(b => 
                `<option value="${b.id}" ${b.id === row.barangId ? 'selected' : ''}>[${b.kode}] ${b.nama} (${b.satuan})</option>`
            ).join('');

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td>
                        <select class="form-control" style="font-size: 12.5px;" onchange="window.MasukModule.updateRowItem(${idx}, 'barangId', this.value)">
                            ${optionsHtml}
                        </select>
                    </td>
                    <td style="width: 110px;">
                        <input type="number" step="any" min="0.01" class="form-control text-center" value="${row.qty}" oninput="window.MasukModule.updateRowItem(${idx}, 'qty', this.value)">
                    </td>
                    <td class="text-center" style="width: 80px; font-weight: 600; color: var(--slate-600);">${satuan}</td>
                    <td style="width: 160px;">
                        <input type="number" min="0" step="100" class="form-control text-right" value="${row.hargaSatuan}" oninput="window.MasukModule.updateRowItem(${idx}, 'hargaSatuan', this.value)">
                    </td>
                    <td class="text-right font-bold row-total-display" style="width: 150px;">
                        ${window.FIFOEngine.formatRupiah(rowTot)}
                    </td>
                    <td class="text-center" style="width: 45px;">
                        <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="window.MasukModule.removeFormDetailRow(${idx})">
                            ${window.App.getIcon('trash', 14)}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        const totalEl = document.getElementById('masuk-form-grand-total');
        if (totalEl) totalEl.textContent = window.FIFOEngine.formatRupiah(grandTotal);
    }

    updateRowItem(index, field, value) {
        if (!this.formDetailRows[index]) return;
        this.formDetailRows[index][field] = field === 'barangId' ? value : Number(value);
        this.renderFormDetailRows();
    }

    handleFormSubmit() {
        const year = window.Auth.currentYear;
        const jenis = document.getElementById('masuk-form-jenis').value;
        const tglBast = document.getElementById('masuk-form-tanggal').value;
        const noBast = document.getElementById('masuk-form-nobast').value.trim();
        const pemasok = document.getElementById('masuk-form-pemasok').value.trim();
        const keterangan = document.getElementById('masuk-form-keterangan').value.trim();

        if (!noBast) {
            window.App.showToast('error', 'Validasi Gagal', 'Nomor BAST wajib diisi');
            return;
        }
        if (!tglBast) {
            window.App.showToast('error', 'Validasi Gagal', 'Tanggal BAST wajib diisi');
            return;
        }

        // Validate items
        for (let i = 0; i < this.formDetailRows.length; i++) {
            const r = this.formDetailRows[i];
            if (!r.barangId) {
                window.App.showToast('error', 'Validasi Gagal', `Baris ke-${i + 1}: Silakan pilih barang`);
                return;
            }
            if (Number(r.qty) <= 0) {
                window.App.showToast('error', 'Validasi Gagal', `Baris ke-${i + 1}: Kuantitas barang harus lebih dari 0`);
                return;
            }
            if (Number(r.hargaSatuan) < 0) {
                window.App.showToast('error', 'Validasi Gagal', `Baris ke-${i + 1}: Harga satuan tidak boleh negatif`);
                return;
            }
        }

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';

        try {
            if (this.editingHeaderId) {
                window.DB.updateMasuk(
                    this.editingHeaderId,
                    { tahun: year, jenis, noBast, tglBast, pemasok, keterangan },
                    this.formDetailRows,
                    user
                );
                window.App.showToast('success', 'Persediaan Masuk Disimpan', `Transaksi ${noBast} berhasil diperbarui.`);
            } else {
                window.DB.createMasuk(
                    { tahun: year, jenis, noBast, tglBast, pemasok, keterangan },
                    this.formDetailRows,
                    user
                );
                window.App.showToast('success', 'Persediaan Masuk Ditambahkan', `Penerimaan barang ${noBast} berhasil dicatat.`);
            }
            window.App.closeActiveModal();
            this.render();
            if (window.DashboardModule) window.DashboardModule.render();
        } catch (err) {
            window.App.showToast('error', 'Gagal Menyimpan', err.message);
        }
    }

    deleteItem(headerId) {
        const header = window.DB.getMasukHeaderById(headerId);
        if (!header) return;

        if (confirm(`Hapus transaksi masuk No. "${header.noBast}"?\n\nPerhatian: Sistem akan memvalidasi apakah ada barang yang sudah dipakai pada transaksi pengeluaran FIFO.`)) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            try {
                window.DB.deleteMasuk(headerId, user);
                window.App.showToast('success', 'Transaksi Dihapus', `Persediaan masuk ${header.noBast} berhasil dihapus.`);
                this.render();
                if (window.DashboardModule) window.DashboardModule.render();
            } catch (err) {
                alert(`GAGAL MENGHAPUS:\n\n${err.message}`);
                window.App.showToast('error', 'Ditolak Integritas FIFO', err.message);
            }
        }
    }

    viewDetail(headerId) {
        const header = window.DB.getMasukHeaderById(headerId);
        if (!header) return;

        const details = window.DB.getMasukDetailsByHeaderId(headerId);
        const settings = window.DB.getSettings();

        document.getElementById('modal-masuk-detail-nobast').textContent = header.noBast;
        document.getElementById('modal-masuk-detail-tanggal').textContent = window.FIFOEngine.formatTanggalIndo(header.tglBast);
        document.getElementById('modal-masuk-detail-jenis').textContent = header.jenis.toUpperCase().replace('_', ' ');
        document.getElementById('modal-masuk-detail-pemasok').textContent = header.pemasok || '-';
        document.getElementById('modal-masuk-detail-keterangan').textContent = header.keterangan || '-';

        let grandTotal = 0;
        const rowsHtml = details.map((d, idx) => {
            const barang = window.DB.getBarangById(d.barangId);
            grandTotal += d.total;
            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><code>${barang ? barang.kode : '-'}</code></td>
                    <td><strong>${barang ? barang.nama : d.barangId}</strong></td>
                    <td class="text-center">${d.qty}</td>
                    <td class="text-center">${barang ? barang.satuan : ''}</td>
                    <td class="text-right">${window.FIFOEngine.formatRupiah(d.hargaSatuan)}</td>
                    <td class="text-right font-bold" style="color: var(--primary-700);">${window.FIFOEngine.formatRupiah(d.total)}</td>
                </tr>
            `;
        }).join('');

        document.getElementById('modal-masuk-detail-tbody').innerHTML = rowsHtml;
        document.getElementById('modal-masuk-detail-total').textContent = window.FIFOEngine.formatRupiah(grandTotal);

        window.App.openModal('modal-masuk-detail');
    }

    printReceipt(headerId) {
        this.viewDetail(headerId);
        setTimeout(() => {
            window.print();
        }, 300);
    }
}

// Global Singleton
window.MasukModule = new MasukController();
