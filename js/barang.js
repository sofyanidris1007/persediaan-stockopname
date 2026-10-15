/**
 * barang.js - Master Data Barang CRUD with Stock Status & Audit Validation
 * SMP Negeri 1 Penajam Paser Utara
 */

class BarangController {
    constructor() {
        this.searchQuery = '';
        this.categoryFilter = 'all';
        this.statusFilter = 'all';
        this.editingId = null;
    }

    render() {
        const year = window.Auth.currentYear;
        const state = window.FIFOEngine.calculateStockState(year);
        const allBarang = window.DB.getBarangList(true);

        // Populate Category Dropdown filter
        const categories = new Set(['ATK', 'Kebersihan', 'Kesehatan', 'Elektronik', 'Cetakan', 'Bahan Praktik', 'Lain-lain']);
        allBarang.forEach(b => { if (b.kategori) categories.add(b.kategori); });

        const catSelect = document.getElementById('barang-filter-category');
        if (catSelect && catSelect.children.length <= 1) {
            catSelect.innerHTML = '<option value="all">Semua Kategori</option>';
            Array.from(categories).sort().forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                catSelect.appendChild(opt);
            });
        }

        // Apply filters
        let filtered = allBarang.filter(b => {
            // Search query
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const matchKode = b.kode.toLowerCase().includes(q);
                const matchNama = b.nama.toLowerCase().includes(q);
                const matchSatuan = b.satuan.toLowerCase().includes(q);
                if (!matchKode && !matchNama && !matchSatuan) return false;
            }

            // Category filter
            if (this.categoryFilter !== 'all' && b.kategori !== this.categoryFilter) {
                return false;
            }

            // Status filter
            const itemState = state.summary[b.id] || { currentQty: 0, isLowStock: false, isOutOfStock: true };
            if (this.statusFilter === 'active' && !b.aktif) return false;
            if (this.statusFilter === 'inactive' && b.aktif) return false;
            if (this.statusFilter === 'low' && (!itemState.isLowStock || !b.aktif)) return false;
            if (this.statusFilter === 'out' && (!itemState.isOutOfStock || !b.aktif)) return false;

            return true;
        });

        // Sort by Kode
        filtered.sort((a, b) => a.kode.localeCompare(b.kode));

        const tbody = document.getElementById('barang-table-tbody');
        const countBadge = document.getElementById('barang-count-badge');
        if (countBadge) countBadge.textContent = `${filtered.length} dari ${allBarang.length} Barang`;

        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 28px; color: var(--slate-400);">Tidak ada barang yang cocok dengan filter yang dipilih</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((b, idx) => {
            const itemState = state.summary[b.id] || { currentQty: 0, currentNilai: 0, isLowStock: false, isOutOfStock: true };
            
            let statusBadge = '<span class="badge badge-success">Stok Aman</span>';
            if (!b.aktif) {
                statusBadge = '<span class="badge badge-secondary">Nonaktif</span>';
            } else if (itemState.currentQty === 0) {
                statusBadge = '<span class="badge badge-danger">Stok Habis</span>';
            } else if (itemState.isLowStock) {
                statusBadge = '<span class="badge badge-warning">Stok Menipis</span>';
            }

            return `
                <tr style="${!b.aktif ? 'opacity: 0.6; background: #f8fafc;' : ''}">
                    <td class="text-center">${idx + 1}</td>
                    <td><code>${b.kode}</code></td>
                    <td>
                        <strong>${b.nama}</strong>
                        ${!b.aktif ? '<span style="font-size: 11px; color: var(--slate-500); margin-left: 6px;">(Tidak Aktif)</span>' : ''}
                    </td>
                    <td><span class="badge badge-secondary">${b.kategori || 'Umum'}</span></td>
                    <td class="text-center">${b.satuan}</td>
                    <td class="text-center">${b.stokMinimum || 0}</td>
                    <td class="text-center font-bold" style="font-size: 14px; color: ${itemState.currentQty === 0 ? 'var(--danger-600)' : (itemState.isLowStock ? 'var(--warning-600)' : 'var(--slate-800)')};">
                        ${itemState.currentQty}
                    </td>
                    <td class="text-right font-bold" style="color: var(--primary-700);">
                        ${window.FIFOEngine.formatRupiah(itemState.currentNilai)}
                    </td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-center no-print">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button class="btn btn-secondary btn-icon" title="Ubah Data Barang" onclick="window.BarangModule.openEditModal('${b.id}')">
                                ${window.App.getIcon('edit', 14)}
                            </button>
                            <button class="btn ${b.aktif ? 'btn-secondary' : 'btn-success'} btn-icon" title="${b.aktif ? 'Nonaktifkan' : 'Aktifkan'}" onclick="window.BarangModule.toggleAktif('${b.id}', ${!b.aktif})">
                                ${window.App.getIcon(b.aktif ? 'lock' : 'unlock', 14)}
                            </button>
                            <button class="btn btn-danger btn-icon" title="Hapus Barang" onclick="window.BarangModule.deleteItem('${b.id}')">
                                ${window.App.getIcon('trash', 14)}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openCreateModal() {
        this.editingId = null;
        document.getElementById('modal-barang-title').textContent = 'Tambah Master Barang Baru';
        document.getElementById('barang-form-kode').value = window.DB.getNextBarangKode();
        document.getElementById('barang-form-nama').value = '';
        document.getElementById('barang-form-kategori').value = 'ATK';
        document.getElementById('barang-form-satuan').value = 'Rim';
        document.getElementById('barang-form-stok-min').value = '10';
        document.getElementById('barang-form-aktif').checked = true;
        window.App.openModal('modal-barang-form');
    }

    openEditModal(id) {
        const item = window.DB.getBarangById(id);
        if (!item) return;

        this.editingId = id;
        document.getElementById('modal-barang-title').textContent = 'Edit Data Barang: ' + item.nama;
        document.getElementById('barang-form-kode').value = item.kode;
        document.getElementById('barang-form-nama').value = item.nama;
        document.getElementById('barang-form-kategori').value = item.kategori || 'ATK';
        document.getElementById('barang-form-satuan').value = item.satuan;
        document.getElementById('barang-form-stok-min').value = item.stokMinimum || 0;
        document.getElementById('barang-form-aktif').checked = item.aktif !== false;
        window.App.openModal('modal-barang-form');
    }

    handleFormSubmit() {
        const kode = document.getElementById('barang-form-kode').value.trim();
        const nama = document.getElementById('barang-form-nama').value.trim();
        const kategori = document.getElementById('barang-form-kategori').value.trim();
        const satuan = document.getElementById('barang-form-satuan').value.trim();
        const stokMinimum = document.getElementById('barang-form-stok-min').value;
        const aktif = document.getElementById('barang-form-aktif').checked;

        if (!nama) {
            window.App.showToast('error', 'Validasi Gagal', 'Nama barang wajib diisi');
            return;
        }
        if (!satuan) {
            window.App.showToast('error', 'Validasi Gagal', 'Satuan barang wajib diisi (contoh: Rim, Pcs, Box)');
            return;
        }

        const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';

        try {
            if (this.editingId) {
                window.DB.updateBarang(this.editingId, { kode, nama, kategori, satuan, stokMinimum, aktif }, user);
                window.App.showToast('success', 'Barang Diperbarui', `Data barang [${kode}] ${nama} berhasil disimpan.`);
            } else {
                window.DB.createBarang({ kode, nama, kategori, satuan, stokMinimum, aktif }, user);
                window.App.showToast('success', 'Barang Ditambahkan', `Master barang baru [${kode}] ${nama} berhasil didaftarkan.`);
            }
            window.App.closeActiveModal();
            this.render();
        } catch (err) {
            window.App.showToast('error', 'Gagal Menyimpan', err.message);
        }
    }

    toggleAktif(id, newStatus) {
        const item = window.DB.getBarangById(id);
        if (!item) return;

        const actionText = newStatus ? 'mengaktifkan' : 'menonaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${actionText} barang "${item.nama}"?`)) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            window.DB.toggleBarangAktif(id, newStatus, user);
            window.App.showToast('success', 'Status Berubah', `Barang "${item.nama}" kini berstatus ${newStatus ? 'Aktif' : 'Nonaktif'}.`);
            this.render();
        }
    }

    deleteItem(id) {
        const item = window.DB.getBarangById(id);
        if (!item) return;

        if (confirm(`Hapus barang "${item.nama}" (${item.kode}) secara permanen?`)) {
            const user = window.Auth.currentUser ? window.Auth.currentUser.username : 'smpn1PPU';
            try {
                window.DB.deleteBarang(id, user);
                window.App.showToast('success', 'Barang Dihapus', `Barang [${item.kode}] berhasil dihapus dari master.`);
                this.render();
            } catch (err) {
                // If it fails because of transactions, offer deactivation
                if (confirm(`${err.message}\n\nApakah Anda ingin MENONAKTIFKAN barang ini sekarang sebagai gantinya?`)) {
                    window.DB.toggleBarangAktif(id, false, user);
                    window.App.showToast('info', 'Barang Dinonaktifkan', `Barang "${item.nama}" telah dialihkan menjadi Nonaktif.`);
                    this.render();
                }
            }
        }
    }
}

// Global Singleton
window.BarangModule = new BarangController();
