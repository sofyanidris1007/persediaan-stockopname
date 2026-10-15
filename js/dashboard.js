/**
 * dashboard.js - Executive Overview & Analytics Dashboard
 * SMP Negeri 1 Penajam Paser Utara
 */

class DashboardController {
    constructor() {}

    render() {
        const year = window.Auth.currentYear;
        const state = window.FIFOEngine.calculateStockState(year);
        const barangList = window.DB.getBarangList(false);

        let totalNilai = 0;
        let totalItems = barangList.length;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const lowStockItems = [];

        // Category values
        const catMap = {};

        barangList.forEach(b => {
            const itemState = state.summary[b.id] || { currentQty: 0, currentNilai: 0 };
            totalNilai += itemState.currentNilai;

            if (itemState.currentQty === 0) {
                outOfStockCount++;
                lowStockItems.push({ barang: b, qty: 0, status: 'Habis' });
            } else if (b.stokMinimum > 0 && itemState.currentQty <= b.stokMinimum) {
                lowStockCount++;
                lowStockItems.push({ barang: b, qty: itemState.currentQty, status: 'Menipis' });
            }

            const cat = b.kategori || 'Lain-lain';
            catMap[cat] = (catMap[cat] || 0) + itemState.currentNilai;
        });

        const masukHeaders = window.DB.getMasukHeaders(year);
        const keluarHeaders = window.DB.getKeluarHeaders(year);

        // 1. Render Stats Grid
        const statsContainer = document.getElementById('dashboard-stats-grid');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Total Nilai Persediaan</div>
                        <div class="stat-value" style="color: var(--primary-600);">${window.FIFOEngine.formatRupiah(totalNilai)}</div>
                        <div class="stat-desc">Metode FIFO TA ${year}</div>
                    </div>
                    <div class="stat-icon primary">
                        ${window.App.getIcon('package', 24)}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Jumlah Master Barang</div>
                        <div class="stat-value">${totalItems} <span style="font-size: 13px; font-weight: normal; color: var(--slate-500);">Item</span></div>
                        <div class="stat-desc">${Object.keys(catMap).length} Kategori Barang Aktif</div>
                    </div>
                    <div class="stat-icon success">
                        ${window.App.getIcon('checkCircle', 24)}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Stok Kritis & Menipis</div>
                        <div class="stat-value" style="color: ${lowStockCount + outOfStockCount > 0 ? 'var(--warning-600)' : 'var(--slate-800)'};">
                            ${lowStockCount + outOfStockCount} <span style="font-size: 13px; font-weight: normal; color: var(--slate-500);">Item</span>
                        </div>
                        <div class="stat-desc">${outOfStockCount} Habis, ${lowStockCount} Di Bawah Batas Min</div>
                    </div>
                    <div class="stat-icon ${lowStockCount + outOfStockCount > 0 ? 'warning' : 'primary'}">
                        ${window.App.getIcon('alertTriangle', 24)}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Total Transaksi TA ${year}</div>
                        <div class="stat-value">${masukHeaders.length + keluarHeaders.length} <span style="font-size: 13px; font-weight: normal; color: var(--slate-500);">Dokumen</span></div>
                        <div class="stat-desc">${masukHeaders.length} Masuk, ${keluarHeaders.length} Pemakaian</div>
                    </div>
                    <div class="stat-icon primary">
                        ${window.App.getIcon('fileText', 24)}
                    </div>
                </div>
            `;
        }

        // 2. Render Low Stock Banner
        const alertBanner = document.getElementById('dashboard-low-stock-banner');
        if (alertBanner) {
            if (lowStockItems.length > 0) {
                alertBanner.style.display = 'flex';
                alertBanner.innerHTML = `
                    <div class="alert-banner-content">
                        ${window.App.getIcon('alertTriangle', 28)}
                        <div>
                            <h4>Peringatan: Terdapat ${lowStockItems.length} Barang Perlu Pengadaan / Restock Segera!</h4>
                            <p>Item: ${lowStockItems.slice(0, 3).map(i => `<strong>${i.barang.nama}</strong> (${i.qty} ${i.barang.satuan})`).join(', ')}${lowStockItems.length > 3 ? `, dan ${lowStockItems.length - 3} lainnya...` : ''}</p>
                        </div>
                    </div>
                    <button class="btn btn-warning btn-sm" onclick="window.App.navigateTo('barang')">
                        Lihat Data Barang
                    </button>
                `;
            } else {
                alertBanner.style.display = 'none';
            }
        }

        // 3. Render Category Breakdown
        const catChartContainer = document.getElementById('dashboard-category-chart');
        if (catChartContainer) {
            let catHtml = '';
            const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

            if (sortedCats.length === 0 || totalNilai === 0) {
                catHtml = '<div style="color: var(--slate-400); padding: 20px; text-align: center;">Belum ada persediaan aktif pada tahun ini</div>';
            } else {
                sortedCats.forEach(([cat, val]) => {
                    const pct = ((val / totalNilai) * 100).toFixed(1);
                    catHtml += `
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                                <span style="font-weight: 600; color: var(--slate-700);">${cat}</span>
                                <span style="font-weight: 700; color: var(--slate-900);">${window.FIFOEngine.formatRupiah(val)} <span style="color: var(--slate-500); font-weight: normal;">(${pct}%)</span></span>
                            </div>
                            <div style="height: 8px; background: var(--slate-200); border-radius: 999px; overflow: hidden;">
                                <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, var(--primary-500), var(--primary-700)); border-radius: 999px;"></div>
                            </div>
                        </div>
                    `;
                });
            }
            catChartContainer.innerHTML = catHtml;
        }

        // 4. Render Quick Financial Reconciliation Summary
        const summaryBox = document.getElementById('dashboard-reconciliation-summary');
        if (summaryBox) {
            const yearlyData = window.FIFOEngine.getYearlyInventorySummary(year);
            const gt = yearlyData.grandTotals;
            summaryBox.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
                    <div style="background: var(--slate-50); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--slate-200);">
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 600;">SALDO AWAL (1 JAN)</div>
                        <div style="font-size: 15px; font-weight: 700; color: var(--slate-800);">${window.FIFOEngine.formatRupiah(gt.saldoAwal)}</div>
                    </div>
                    <div style="background: var(--success-50); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid #a7f3d0;">
                        <div style="font-size: 11px; color: var(--success-700); font-weight: 600;">PENAMBAHAN (MASUK)</div>
                        <div style="font-size: 15px; font-weight: 700; color: var(--success-700);">+ ${window.FIFOEngine.formatRupiah(gt.penambahan)}</div>
                    </div>
                    <div style="background: var(--danger-50); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid #fecaca;">
                        <div style="font-size: 11px; color: var(--danger-600); font-weight: 600;">PENGURANGAN (PEMAKAIAN)</div>
                        <div style="font-size: 15px; font-weight: 700; color: var(--danger-600);">- ${window.FIFOEngine.formatRupiah(gt.pengurangan)}</div>
                    </div>
                    <div style="background: var(--primary-50); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--primary-200);">
                        <div style="font-size: 11px; color: var(--primary-700); font-weight: 600;">SALDO AKHIR (FIFO)</div>
                        <div style="font-size: 15px; font-weight: 800; color: var(--primary-700);">${window.FIFOEngine.formatRupiah(gt.saldoAkhir)}</div>
                    </div>
                </div>
                <div style="font-size: 11px; color: var(--slate-600); background: #f8fafc; padding: 8px 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--primary-600);">
                    <strong>Rumus Rekonsiliasi:</strong> Saldo Akhir = Saldo Awal (${window.FIFOEngine.formatRupiah(gt.saldoAwal)}) + Masuk (${window.FIFOEngine.formatRupiah(gt.penambahan)}) - Pemakaian (${window.FIFOEngine.formatRupiah(gt.pengurangan)}) = <strong>${window.FIFOEngine.formatRupiah(gt.saldoAkhir)}</strong> ${gt.isReconciled ? '✓ Valid (Seimbang)' : '⚠️ Selisih Terdeteksi'}
                </div>
            `;
        }

        // 5. Render Recent Transactions Table
        const recentTable = document.getElementById('dashboard-recent-transactions-tbody');
        if (recentTable) {
            const stream = [];

            masukHeaders.forEach(h => {
                const details = window.DB.getMasukDetailsByHeaderId(h.id);
                const tot = details.reduce((sum, d) => sum + d.total, 0);
                stream.push({
                    id: h.id,
                    type: 'masuk',
                    jenis: h.jenis,
                    noBast: h.noBast,
                    tanggal: h.tglBast,
                    uraian: h.keterangan || (h.jenis === 'saldo_awal' ? 'Saldo Awal' : 'Pembelian'),
                    partner: h.pemasok || 'Sekolah',
                    itemCount: details.length,
                    total: tot,
                    createdAt: h.createdAt
                });
            });

            keluarHeaders.forEach(h => {
                const details = window.DB.getKeluarDetailsByHeaderId(h.id);
                const tot = details.reduce((sum, d) => sum + d.total, 0);
                stream.push({
                    id: h.id,
                    type: 'keluar',
                    jenis: h.jenis,
                    noBast: h.noBast,
                    tanggal: h.tglBast,
                    uraian: h.keterangan || 'Pemakaian Barang',
                    partner: h.unitPeminta || 'Unit Sekolah',
                    itemCount: details.length,
                    total: tot,
                    createdAt: h.createdAt
                });
            });

            stream.sort((a, b) => {
                if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
                return (b.createdAt || '').localeCompare(a.createdAt || '');
            });

            const top8 = stream.slice(0, 8);

            if (top8.length === 0) {
                recentTable.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--slate-400);">Belum ada riwayat transaksi pada Tahun Anggaran ${year}</td></tr>`;
            } else {
                recentTable.innerHTML = top8.map((t, idx) => {
                    let badgeClass = 'badge-primary';
                    let typeText = 'Masuk';
                    if (t.jenis === 'saldo_awal') { badgeClass = 'badge-secondary'; typeText = 'Saldo Awal'; }
                    else if (t.jenis === 'pembelian') { badgeClass = 'badge-success'; typeText = 'Pembelian'; }
                    else if (t.type === 'keluar') { badgeClass = 'badge-danger'; typeText = 'Pemakaian'; }

                    return `
                        <tr>
                            <td class="text-center">${idx + 1}</td>
                            <td><strong>${window.FIFOEngine.formatTanggalIndo(t.tanggal)}</strong></td>
                            <td><code>${t.noBast}</code></td>
                            <td><span class="badge ${badgeClass}">${typeText}</span></td>
                            <td>
                                <div><strong>${t.partner}</strong></div>
                                <div style="font-size: 11px; color: var(--slate-500);">${t.uraian}</div>
                            </td>
                            <td class="text-center">${t.itemCount} item</td>
                            <td class="text-right" style="font-weight: 700; color: ${t.type === 'keluar' ? 'var(--danger-600)' : 'var(--primary-700)'};">
                                ${t.type === 'keluar' ? '-' : '+'} ${window.FIFOEngine.formatRupiah(t.total)}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }
}

// Global Singleton
window.DashboardModule = new DashboardController();
