/**
 * keluar.js - Persediaan Keluar (Pemakaian Barang) with Strict FIFO Cost Allocation
 * SMP Negeri 1 Penajam Paser Utara
 */

class KeluarController {
    constructor() {
        this.searchQuery = '';
        this.formItems = [];
    }

    render() {
        const year = window.Auth.currentYear;
        const allHeaders = window.DB.getKeluarHeaders(year);

        let filtered = allHeaders.filter(h => {
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const matchBast = h.noBast.toLowerCase().includes(q);
                const matchUnit = (h.unitPeminta || '').toLowerCase().includes(q);
                const matchKet = (h.keterangan || '').toLowerCase().includes(q);
                if (!matchBast && !matchUnit && !matchKet) return false;
            }
            return true;
        });

        // Sort chronologically descending
        filtered.sort((a, b) => {
            if (a.tglBast !== b.tglBast) return b.tglBast.localeCompare(a.tglBast);
            return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        const tbody = document.getElementById('keluar-table-tbody');
        const countBadge = document.getElementById('keluar-count-badge');
        if (countBadge) countBadge.textContent = `${filtered.length} Pemakaian`;

        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 28px; color: var(--slate-400);">Tidak ada catatan pengeluaran/pemakaian barang pada Tahun Anggaran ${year}</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((h, idx) => {
            const details = window.DB.getKeluarDetailsByHeaderId(h.id);
            const totalNilai = details.reduce((sum, d) => sum + d.total, 0);

            let typeBadge = '<span class="badge badge-primary">Pemakaian Unit</span>';
            if (h.jenis === 'penyesuaian') {
                typeBadge = '<span class="badge badge-warning">Penyesuaian Opname</span>';
            }

            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${window.FIFOEngine.formatTanggalIndo(h.tglBast)}</strong></td>
                    <td><code>${h.noBast}</code></td>
                    <td>${typeBadge}</td>
                    <td>
                        <strong style="color: var(--primary-700);">${h.unitPeminta || '-'}</strong>
                        <div style="font-size: 11.5px; color: var(--slate-500);">${h.keterangan || '-'}</div>
                    </td>
                    <td class="text-center">
                        <span class="badge badge-secondary">${details.length} Lapisan Alokasi</span>
                    </td>
                    <td class="text-right font-bold" style="color: var(--danger-600);">
                        - ${window.FIFOEngine.formatRupiah(totalNilai)}
                    </td>
                    <td class="text-center no-print">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button class="btn btn-secondary btn-icon" title="Lihat Rincian Alokasi FIFO" onclick="window.KeluarModule.viewDetail('${h.id}')">
                                ${window.App.getIcon('eye', 14)}
                            </button>
                            <button class="btn btn-secondary btn-icon" title="Cetak Bukti Pengeluaran" onclick="window.KeluarModule.printReceipt('${h.id}')">
                                ${window.App.getIcon('printer', 14)}
                            </button>
                            ${h.jenis !== 'penyesuaian' ? `
                                <button class="btn btn-danger btn-icon" title="Hapus Pemakaian" onclick="window.KeluarModule.deleteItem('${h.id}')">
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

    openCreateModal() {
        const year = window.Auth.currentYear;
        if (window.DB.isYearLocked(year)) {
            window.App.showToast('error', 'Tahun Terkunci', `Tahun anggaran ${year} sedang dikunci. Data tidak dapat ditambahkan.`);
            return;
        }

        document.getElementById('modal-keluar-title').textContent = 'Catat Pengeluaran / Pemakaian Barang';
        document.getElementById('keluar-form-tanggal').value = new Date().toISOString().split('T')[0];

        const rnd = Math.floor(100 + Math.random() * 900);
        document.getElementById('keluar-form-nobast').value = `BAST-PK/${year}/${rnd}`;
        document.getElementById('keluar-form-unit').value = 'Tata Usaha';
        document.getElementById('keluar-form-keterangan').value = 'Keperluan operasional dan administrasi';

        // Initialize 1 row
        const barangList = window.DB.getBarangList(false);
        const firstBarang = barangList.length > 0 ? barangList[0].id : '';

        this.formItems = [
            { id: Date.now(), barangId: firstBarang, qty: 1 }
        ];

        this.renderFormItems();
        window.App.openModal('modal-keluar-form');
    }

    addFormItem() {
        const barangList = window.DB.getBarangList(false);
        const firstBarang = barangList.length > 0 ? barangList[0].id : '';
        this.formItems.push({
            id: Date.now() + Math.random(),
            barangId: firstBarang,
            qty: 1
        });
        this.renderFormItems();
    }

    removeFormItem(index) {
        if (this.formItems.length <= 1) {
            window.App.showToast('warning', 'Peringatan', 'Minimal harus terdapat 1 barang yang dikeluarkan');
            return;
        }
        this.formItems.splice(index, 1);
        this.renderFormItems();
    }

    renderFormItems() {
        const year = window.Auth.currentYear;
        const tbody = document.getElementById('keluar-form-detail-tbody');
        const barangList = window.DB.getBarangList(false);
        const state = window.FIFOEngine.calculateStockState(year);

        if (!tbody) return;

        let hasError = false;
        let previewDetails = [];
        let grandTotal = 0;

        tbody.innerHTML = this.formItems.map((item, idx) => {
            const currentItem = window.DB.getBarangById(item.barangId);
            const stockSummary = state.summary[item.barangId] || { currentQty: 0, availableLayers: [] };
            const availableStock = stockSummary.currentQty;
            const satuan = currentItem ? currentItem.satuan : '-';
            const isExceeded = Number(item.qty) > availableStock;
            if (isExceeded) hasError = true;

            const optionsHtml = barangList.map(b => {
                const bStock = state.summary[b.id] ? state.summary[b.id].currentQty : 0;
                return `<option value="${b.id}" ${b.id === item.barangId ? 'selected' : ''}>[${b.kode}] ${b.nama} (Stok: ${bStock} ${b.satuan})</option>`;
            }).join('');

            return `
                <tr style="${isExceeded ? 'background: #fef2f2;' : ''}">
                    <td class="text-center">${idx + 1}</td>
                    <td>
                        <select class="form-control" style="font-size: 12.5px;" onchange="window.KeluarModule.updateItem(${idx}, 'barangId', this.value)">
                            ${optionsHtml}
                        </select>
                    </td>
                    <td class="text-center" style="width: 140px;">
                        <span class="badge ${availableStock === 0 ? 'badge-danger' : (availableStock <= (currentItem ? currentItem.stokMinimum : 0) ? 'badge-warning' : 'badge-success')}" style="font-size: 12px; padding: 4px 8px;">
                            ${availableStock} ${satuan}
                        </span>
                    </td>
                    <td style="width: 130px;">
                        <input type="number" step="any" min="0.01" max="${availableStock}" class="form-control text-center ${isExceeded ? 'border-danger' : ''}" value="${item.qty}" oninput="window.KeluarModule.updateItem(${idx}, 'qty', this.value)">
                        ${isExceeded ? `<div style="color: var(--danger-600); font-size: 10.5px; font-weight: 600; margin-top: 2px;">Melebihi Stok (${availableStock})!</div>` : ''}
                    </td>
                    <td class="text-center" style="width: 80px; font-weight: 600; color: var(--slate-600);">${satuan}</td>
                    <td class="text-center" style="width: 45px;">
                        <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="window.KeluarModule.removeFormItem(${idx})">
                            ${window.App.getIcon('trash', 14)}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Live preview of FIFO layers and cost
        const previewContainer = document.getElementById('keluar-form-fifo-preview');
        const tglBast = document.getElementById('keluar-form-tanggal') ? document.getElementById('keluar-form-tanggal').value : '';

        if (!hasError && this.formItems.length > 0 && tglBast) {
            try {
                const sim = window.FIFOEngine.allocateKeluar(year, tglBast, this.formItems);
                let previewHtml = `
                    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 12px; margin-top: 14px;">
                        <div style="font-weight: 700; font-size: 12.5px; color: var(--slate-800); margin-bottom: 8px; display: flex; justify-content: space-between;">
                            <span>Alokasi Lapisan Harga Otomatis (FIFO):</span>
                            <span style="color: var(--primary-700);">Estimasi Total Nilai: ${window.FIFOEngine.formatRupiah(sim.grandTotal)}</span>
                        </div>
                        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--slate-300); color: var(--slate-600); text-align: left;">
                                    <th style="padding: 4px;">Barang</th>
                                    <th style="padding: 4px;">Lapisan Asal & BAST</th>
                                    <th style="padding: 4px; text-align: center;">Qty Diambil</th>
                                    <th style="padding: 4px; text-align: right;">Harga Lapisan</th>
                                    <th style="padding: 4px; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                sim.details.forEach(d => {
                    const brg = window.DB.getBarangById(d.barangId);
                    previewHtml += `
                        <tr style="border-bottom: 1px dashed var(--slate-200);">
                            <td style="padding: 4px;"><strong>${brg ? brg.nama : '-'}</strong></td>
                            <td style="padding: 4px; color: var(--slate-500);">${d.catatanBatch || '-'}</td>
                            <td style="padding: 4px; text-align: center;"><strong>${d.qty}</strong> ${brg ? brg.satuan : ''}</td>
                            <td style="padding: 4px; text-align: right;">${window.FIFOEngine.formatRupiah(d.hargaSatuan)}</td>
                            <td style="padding: 4px; text-align: right; font-weight: 700;">${window.FIFOEngine.formatRupiah(d.total)}</td>
                        </tr>
                    `;
                });
                previewHtml += `
                            </tbody>
                        </table>
                    </div>
                `;
                if (previewContainer) previewContainer.innerHTML = previewHtml;
                const totalEl = document.getElementById('keluar-form-grand-total');
                if (totalEl) totalEl.textContent = window.FIFOEngine.formatRupiah(sim.grandTotal);
            } catch (e) {
                if (previewContainer) {
                    previewContainer.innerHTML = `<div style="color: var(--danger-600); font-size: 12px; padding: 10px; background: var(--danger-50); border-radius: var(--radius-sm); margin-top: 10px;">⚠️ ${e.message}</div>`;
                }
            }
        } else if (hasError && previewContainer) {
            previewContainer.innerHTML = `<div style="color: var(--danger-600); font-size: 12px; padding: 10px; background: var(--danger-50); border-radius: var(--radius-sm); margin-top: 10px;">⚠️ Permintaan melebihi stok yang tersedia. Harap kurangi jumlah permintaan barang.</div>`;
        }
    }

    updateItem(index, field, value) {
        if (!this.formItems[index]) return;
        this.formItems[index][field] = field === 'barangId' ? value : Number(value);
        this.renderFormItems();
    }

    handleFormSubmit() {
        const year = window.Auth.currentYear;
        const tglBast = document.getElementById('keluar-form-tanggal').value;
        const noBast = document.getElementById('keluar-form-nobast').value.trim();
        const unitPeminta = document.getElementById('keluar-form-unit').value.trim();
        const keterangan = document.getElementById('keluar-form-keterangan').value.trim();

        if (!noBast) {
            window.App.showToast('error', 'Validasi Gagal', 'Nomor Bukti / BAST Pengeluaran wajib diisi');
            return;
        }
        if (!tglBast) {
            window.App.showToast('error', 'Validasi Gagal', 'Tanggal Pengeluaran wajib diisi');
            return;
        }
        if (!unitPeminta) {
            window.App.showToast('error', 'Validasi Gagal', 'Unit Peminta / Penanggung Jawab wajib diisi');
            return;
        }

        // Validate items
        for (let i = 0; i < this.formItems.length; i++) {
            const itm = this.formItems[i];
            if (!itm.barangId) {
                window.App.showToast('error', 'Validasi Gagal', `Baris ke-${i + 1}: Silakan pilih barang`);
                return;
            }
            if (Number(itm.qty) <= 0) {
                window.App.showToast('error', 'Validasi Gagal', `Baris ke-${i + 1}: Jumlah pengeluaran harus lebih dari 0`);
                return;
            }
        }

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';

        try {
            window.DB.createKeluar(
                { tahun: year, jenis: 'pemakaian', noBast, tglBast, unitPeminta, keterangan },
                this.formItems,
                user
            );
            window.App.showToast('success', 'Pemakaian Berhasil Dicatat', `Pengeluaran ${noBast} untuk ${unitPeminta} berhasil dialokasikan secara FIFO.`);
            window.App.closeActiveModal();
            this.render();
            if (window.DashboardModule) window.DashboardModule.render();
        } catch (err) {
            alert('PENOLAKAN PENGELUARAN BARANG:\n\n' + err.message);
            window.App.showToast('error', 'Validasi Stok Gagal', err.message);
        }
    }

    deleteItem(headerId) {
        const header = window.DB.getKeluarHeaderById(headerId);
        if (!header) return;

        if (confirm(`Hapus catatan pemakaian No. "${header.noBast}"?\n\nAlokasi barang akan otomatis dikembalikan ke saldo stok FIFO.`)) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            try {
                window.DB.deleteKeluar(headerId, user);
                window.App.showToast('success', 'Pemakaian Dihapus', `Data pemakaian ${header.noBast} berhasil dihapus dan stok dipulihkan.`);
                this.render();
                if (window.DashboardModule) window.DashboardModule.render();
            } catch (err) {
                window.App.showToast('error', 'Gagal Menghapus', err.message);
            }
        }
    }

    viewDetail(headerId) {
        const header = window.DB.getKeluarHeaderById(headerId);
        if (!header) return;

        const details = window.DB.getKeluarDetailsByHeaderId(headerId);

        document.getElementById('modal-keluar-detail-nobast').textContent = header.noBast;
        document.getElementById('modal-keluar-detail-tanggal').textContent = window.FIFOEngine.formatTanggalIndo(header.tglBast);
        document.getElementById('modal-keluar-detail-unit').textContent = header.unitPeminta || '-';
        document.getElementById('modal-keluar-detail-keterangan').textContent = header.keterangan || '-';

        let grandTotal = 0;
        const rowsHtml = details.map((d, idx) => {
            const barang = window.DB.getBarangById(d.barangId);
            grandTotal += d.total;
            return `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><code>${barang ? barang.kode : '-'}</code></td>
                    <td>
                        <strong>${barang ? barang.nama : d.barangId}</strong>
                        ${d.catatanBatch ? `<div style="font-size: 11px; color: var(--slate-500);">${d.catatanBatch}</div>` : ''}
                    </td>
                    <td class="text-center font-bold">${d.qty}</td>
                    <td class="text-center">${barang ? barang.satuan : ''}</td>
                    <td class="text-right">${window.FIFOEngine.formatRupiah(d.hargaSatuan)}</td>
                    <td class="text-right font-bold" style="color: var(--danger-600);">- ${window.FIFOEngine.formatRupiah(d.total)}</td>
                </tr>
            `;
        }).join('');

        document.getElementById('modal-keluar-detail-tbody').innerHTML = rowsHtml;
        document.getElementById('modal-keluar-detail-total').textContent = window.FIFOEngine.formatRupiah(grandTotal);

        window.App.openModal('modal-keluar-detail');
    }

    printReceipt(headerId) {
        this.viewDetail(headerId);
        setTimeout(() => {
            window.print();
        }, 300);
    }
}

// Global Singleton
window.KeluarModule = new KeluarController();
