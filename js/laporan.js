/**
 * laporan.js - Laporan Persediaan & Laporan Rincian Kartu Stok (FIFO)
 * SMP Negeri 1 Penajam Paser Utara
 */

class LaporanController {
    constructor() {
        this.persediaanPeriodType = 'year'; // 'year', 'semester', 'quarter', 'month'
        this.persediaanPeriodValue = '1';
        this.rincianBarangId = 'all';
        this.rincianStartDate = '';
        this.rincianEndDate = '';
    }

    // Helper: calculate date range based on period picker
    getDateRangeForPeriod(year, periodType, periodVal) {
        let start = `${year}-01-01`;
        let end = `${year}-12-31`;
        let periodLabel = `Tahun Anggaran ${year}`;

        if (periodType === 'month') {
            const m = String(periodVal).padStart(2, '0');
            const lastDay = new Date(year, Number(periodVal), 0).getDate();
            start = `${year}-${m}-01`;
            end = `${year}-${m}-${lastDay}`;
            const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            periodLabel = `Bulan ${monthNames[Number(periodVal)]} ${year}`;
        } else if (periodType === 'semester') {
            if (periodVal === '1') {
                start = `${year}-01-01`;
                end = `${year}-06-30`;
                periodLabel = `Semester 1 (Januari - Juni) ${year}`;
            } else {
                start = `${year}-07-01`;
                end = `${year}-12-31`;
                periodLabel = `Semester 2 (Juli - Desember) ${year}`;
            }
        } else if (periodType === 'quarter') {
            const q = Number(periodVal);
            if (q === 1) { start = `${year}-01-01`; end = `${year}-03-31`; periodLabel = `Triwulan I ${year}`; }
            else if (q === 2) { start = `${year}-04-01`; end = `${year}-06-30`; periodLabel = `Triwulan II ${year}`; }
            else if (q === 3) { start = `${year}-07-01`; end = `${year}-09-30`; periodLabel = `Triwulan III ${year}`; }
            else { start = `${year}-10-01`; end = `${year}-12-31`; periodLabel = `Triwulan IV ${year}`; }
        }

        return { start, end, label: periodLabel };
    }

    renderPersediaan() {
        const year = window.Auth.currentYear;
        const periodTypeSelect = document.getElementById('lp-filter-period-type');
        const periodValSelect = document.getElementById('lp-filter-period-value');

        if (periodTypeSelect) this.persediaanPeriodType = periodTypeSelect.value;
        if (periodValSelect) this.persediaanPeriodValue = periodValSelect.value;

        const dateRange = this.getDateRangeForPeriod(year, this.persediaanPeriodType, this.persediaanPeriodValue);
        const settings = window.DB.getSettings();

        // Populate Letterhead & Meta
        const kopSchoolName = document.getElementById('lp-kop-school-name');
        const kopAddress = document.getElementById('lp-kop-address');
        const periodTitle = document.getElementById('lp-report-period-title');
        const printDateEl = document.getElementById('lp-print-date-meta');

        if (kopSchoolName) kopSchoolName.textContent = settings.namaSekolah;
        if (kopAddress) kopAddress.textContent = `${settings.alamat}, ${settings.kabupaten}, ${settings.provinsi} | NPSN: ${settings.npsn} | Telp: ${settings.telp}`;
        if (periodTitle) periodTitle.textContent = `Periode: ${dateRange.label}`;
        if (printDateEl) printDateEl.textContent = `Dicetak pada: ${window.FIFOEngine.formatTanggalIndo(new Date().toISOString().split('T')[0])}`;

        // Get Summary Data
        const reportData = window.FIFOEngine.getYearlyInventorySummary(year, dateRange.start, dateRange.end);
        const tbody = document.getElementById('lp-table-tbody');
        const tfoot = document.getElementById('lp-table-tfoot');
        const reconBox = document.getElementById('lp-reconciliation-box');

        if (!tbody) return;

        if (reportData.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 30px; color: var(--slate-400);">Tidak ada transaksi persediaan pada periode ${dateRange.label}</td></tr>`;
            if (tfoot) tfoot.innerHTML = '';
            if (reconBox) reconBox.innerHTML = '';
            return;
        }

        tbody.innerHTML = reportData.items.map(item => `
            <tr>
                <td class="text-center">${item.no}</td>
                <td><code>${item.kode}</code></td>
                <td><strong>${item.nama}</strong></td>
                <td class="text-center">${item.satuan}</td>
                <td class="text-center">${item.saldoAwal.qty}</td>
                <td class="text-right">${window.FIFOEngine.formatRupiah(item.saldoAwal.nilai)}</td>
                <td class="text-center font-bold" style="color: var(--success-700);">${item.penambahan.qty > 0 ? '+' + item.penambahan.qty : '-'}</td>
                <td class="text-right" style="color: var(--success-700);">${item.penambahan.nilai > 0 ? window.FIFOEngine.formatRupiah(item.penambahan.nilai) : '-'}</td>
                <td class="text-center font-bold" style="color: var(--danger-600);">${item.pengurangan.qty > 0 ? '-' + item.pengurangan.qty : '-'}</td>
                <td class="text-right" style="color: var(--danger-600);">${item.pengurangan.nilai > 0 ? window.FIFOEngine.formatRupiah(item.pengurangan.nilai) : '-'}</td>
                <td class="text-center font-bold" style="font-size: 13.5px; background: #f8fafc;">${item.saldoAkhir.qty}</td>
                <td class="text-right font-bold" style="background: #f8fafc; color: var(--primary-800);">${window.FIFOEngine.formatRupiah(item.saldoAkhir.nilai)}</td>
            </tr>
        `).join('');

        const gt = reportData.grandTotals;
        if (tfoot) {
            tfoot.innerHTML = `
                <tr class="total-row" style="background: var(--slate-100); font-weight: 800; font-size: 13px; border-top: 2px solid var(--slate-400);">
                    <td colspan="4" class="text-center">TOTAL NILAI PERSEDIAAN</td>
                    <td class="text-center">-</td>
                    <td class="text-right font-bold">${window.FIFOEngine.formatRupiah(gt.saldoAwal)}</td>
                    <td class="text-center">-</td>
                    <td class="text-right font-bold" style="color: var(--success-700);">${window.FIFOEngine.formatRupiah(gt.penambahan)}</td>
                    <td class="text-center">-</td>
                    <td class="text-right font-bold" style="color: var(--danger-600);">${window.FIFOEngine.formatRupiah(gt.pengurangan)}</td>
                    <td class="text-center">-</td>
                    <td class="text-right font-bold" style="color: var(--primary-700); font-size: 14px;">${window.FIFOEngine.formatRupiah(gt.saldoAkhir)}</td>
                </tr>
            `;
        }

        if (reconBox) {
            reconBox.innerHTML = `
                <div class="reconciliation-box">
                    <div style="font-weight: 700; font-size: 11pt; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>KOTAK REKONSILIASI PEMERIKSAAN KEUANGAN & PERSEDIAAN:</span>
                        <span style="color: ${gt.isReconciled ? 'green' : 'red'};">${gt.isReconciled ? '✓ REKONSILIASI COCOK & SEIMBANG' : '⚠️ SELISIH'}</span>
                    </div>
                    <div style="font-size: 9.5pt; color: #222;">
                        <strong>Rumus Saldo:</strong> Saldo Akhir = Saldo Awal (${window.FIFOEngine.formatRupiah(gt.saldoAwal)}) + Penambahan (${window.FIFOEngine.formatRupiah(gt.penambahan)}) - Pengurangan (${window.FIFOEngine.formatRupiah(gt.pengurangan)}) = <strong>${window.FIFOEngine.formatRupiah(gt.saldoAkhir)}</strong>.
                        <br>
                        <em>Catatan Metode Penilaian: First In, First Out (FIFO). Seluruh saldo akhir pada laporan ini sama persis dengan saldo akhir pada Laporan Rincian Persediaan (Kartu Mutasi).</em>
                    </div>
                </div>
            `;
        }

        // Signatures
        const todayIndo = window.FIFOEngine.formatTanggalIndo(new Date().toISOString().split('T')[0]);
        document.getElementById('lp-sign-city-date').textContent = `${settings.kotaTandaTangan}, ${todayIndo}`;
        document.getElementById('lp-sign-kepsek-name').textContent = settings.kepalaSekolah;
        document.getElementById('lp-sign-kepsek-nip').textContent = `NIP. ${settings.nipKepalaSekolah}`;
        document.getElementById('lp-sign-kepsek-pangkat').textContent = settings.pangkatKepalaSekolah || '';
        document.getElementById('lp-sign-pengurus-name').textContent = settings.pengurusBarang;
        document.getElementById('lp-sign-pengurus-nip').textContent = `NIP. ${settings.nipPengurusBarang}`;
        document.getElementById('lp-sign-pengurus-pangkat').textContent = settings.pangkatPengurusBarang || '';
    }

    renderRincian() {
        const year = window.Auth.currentYear;
        const settings = window.DB.getSettings();

        // Populate Barang selector
        const barangSelect = document.getElementById('lr-filter-barang');
        const activeBarang = window.DB.getBarangList(true);
        if (barangSelect && barangSelect.children.length <= 1) {
            barangSelect.innerHTML = '<option value="all">-- Semua Barang (Cetak Kolektif) --</option>';
            activeBarang.sort((a,b) => a.kode.localeCompare(b.kode)).forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = `[${b.kode}] ${b.nama} (${b.satuan})`;
                barangSelect.appendChild(opt);
            });
        }

        if (barangSelect) this.rincianBarangId = barangSelect.value || 'all';

        const startDateInput = document.getElementById('lr-filter-start-date');
        const endDateInput = document.getElementById('lr-filter-end-date');
        if (startDateInput && !startDateInput.value) startDateInput.value = `${year}-01-01`;
        if (endDateInput && !endDateInput.value) endDateInput.value = `${year}-12-31`;

        this.rincianStartDate = startDateInput ? startDateInput.value : `${year}-01-01`;
        this.rincianEndDate = endDateInput ? endDateInput.value : `${year}-12-31`;

        // Populate meta
        const kopSchoolName = document.getElementById('lr-kop-school-name');
        const kopAddress = document.getElementById('lr-kop-address');
        const periodTitle = document.getElementById('lr-report-period-title');

        if (kopSchoolName) kopSchoolName.textContent = settings.namaSekolah;
        if (kopAddress) kopAddress.textContent = `${settings.alamat}, ${settings.kabupaten}, ${settings.provinsi} | NPSN: ${settings.npsn}`;
        if (periodTitle) periodTitle.textContent = `Periode: ${window.FIFOEngine.formatTanggalIndo(this.rincianStartDate)} s.d. ${window.FIFOEngine.formatTanggalIndo(this.rincianEndDate)}`;

        const container = document.getElementById('lr-cards-container');
        if (!container) return;

        let targetBarang = activeBarang;
        if (this.rincianBarangId !== 'all') {
            targetBarang = activeBarang.filter(b => b.id === this.rincianBarangId);
        }

        let containerHtml = '';
        let totalAllEndingNilai = 0;

        targetBarang.forEach(brg => {
            const mutasi = window.FIFOEngine.getItemMutationHistory(year, brg.id, this.rincianStartDate, this.rincianEndDate);
            if (!mutasi) return;

            // Only display if there was opening balance or any movements
            if (mutasi.saldoAwal.qty === 0 && mutasi.rows.length === 0 && !brg.aktif) return;

            totalAllEndingNilai += mutasi.totals.saldoAkhirNilai;

            containerHtml += `
                <div class="card" style="margin-bottom: 24px; border: 1px solid var(--slate-300); page-break-inside: avoid;">
                    <div class="card-header" style="background: var(--slate-50); padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: 800; font-size: 14.5px; color: var(--slate-900);">[${brg.kode}] ${brg.nama}</span>
                            <span style="margin-left: 10px; font-size: 12px; color: var(--slate-600);">Satuan: <strong>${brg.satuan}</strong> | Kategori: <strong>${brg.kategori || 'Umum'}</strong></span>
                        </div>
                        <div style="font-size: 12.5px;">
                            Saldo Akhir: <strong style="color: var(--primary-700); font-size: 14px;">${mutasi.totals.saldoAkhirQty} ${brg.satuan}</strong> (${window.FIFOEngine.formatRupiah(mutasi.totals.saldoAkhirNilai)})
                        </div>
                    </div>
                    <div class="table-container" style="border: none; border-radius: 0;">
                        <table class="data-table audit-table">
                            <thead>
                                <tr>
                                    <th rowspan="2" class="text-center" style="width: 90px;">Tanggal</th>
                                    <th rowspan="2" style="width: 150px;">No. BAST / Dokumen</th>
                                    <th rowspan="2">Uraian / Keterangan</th>
                                    <th colspan="3" class="text-center" style="background: #ecfdf5; border-bottom: 1px solid var(--slate-300);">MASUK (PENAMBAHAN)</th>
                                    <th colspan="3" class="text-center" style="background: #fef2f2; border-bottom: 1px solid var(--slate-300);">KELUAR (PEMAKAIAN)</th>
                                    <th colspan="2" class="text-center" style="background: #eff6ff; border-bottom: 1px solid var(--slate-300);">SALDO BERJALAN</th>
                                </tr>
                                <tr>
                                    <th class="text-center" style="width: 50px;">Qty</th>
                                    <th class="text-right" style="width: 90px;">Harga (Rp)</th>
                                    <th class="text-right" style="width: 105px;">Total (Rp)</th>
                                    <th class="text-center" style="width: 50px;">Qty</th>
                                    <th class="text-right" style="width: 90px;">Harga (Rp)</th>
                                    <th class="text-right" style="width: 105px;">Total (Rp)</th>
                                    <th class="text-center" style="width: 55px;">Qty</th>
                                    <th class="text-right" style="width: 110px;">Nilai (Rp)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="background: #fafafa; font-weight: 600;">
                                    <td class="text-center">${window.FIFOEngine.formatTanggalIndo(this.rincianStartDate)}</td>
                                    <td><code>-</code></td>
                                    <td><strong>SALDO AWAL</strong></td>
                                    <td class="text-center">-</td>
                                    <td class="text-right">-</td>
                                    <td class="text-right">-</td>
                                    <td class="text-center">-</td>
                                    <td class="text-right">-</td>
                                    <td class="text-right">-</td>
                                    <td class="text-center font-bold">${mutasi.saldoAwal.qty}</td>
                                    <td class="text-right font-bold">${window.FIFOEngine.formatRupiah(mutasi.saldoAwal.nilai)}</td>
                                </tr>
                                ${mutasi.rows.map(r => `
                                    <tr>
                                        <td class="text-center">${window.FIFOEngine.formatTanggalIndo(r.tanggal)}</td>
                                        <td><code>${r.noBast}</code></td>
                                        <td>${r.uraian}</td>
                                        <td class="text-center">${r.masukQty > 0 ? r.masukQty : '-'}</td>
                                        <td class="text-right">${r.masukHarga > 0 ? window.FIFOEngine.formatRupiah(r.masukHarga) : '-'}</td>
                                        <td class="text-right font-bold" style="color: var(--success-700);">${r.masukTotal > 0 ? window.FIFOEngine.formatRupiah(r.masukTotal) : '-'}</td>
                                        <td class="text-center">${r.keluarQty > 0 ? r.keluarQty : '-'}</td>
                                        <td class="text-right">${r.keluarHarga > 0 ? window.FIFOEngine.formatRupiah(r.keluarHarga) : '-'}</td>
                                        <td class="text-right font-bold" style="color: var(--danger-600);">${r.keluarTotal > 0 ? window.FIFOEngine.formatRupiah(r.keluarTotal) : '-'}</td>
                                        <td class="text-center font-bold">${r.saldoQty}</td>
                                        <td class="text-right font-bold" style="color: var(--primary-800);">${window.FIFOEngine.formatRupiah(r.saldoNilai)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="total-row" style="background: var(--slate-100); font-weight: bold; border-top: 2px solid var(--slate-300);">
                                    <td colspan="3" class="text-center">SUBTOTAL MUTASI & SALDO AKHIR</td>
                                    <td class="text-center font-bold" style="color: var(--success-700);">${mutasi.totals.masukQty}</td>
                                    <td class="text-right">-</td>
                                    <td class="text-right font-bold" style="color: var(--success-700);">${window.FIFOEngine.formatRupiah(mutasi.totals.masukNilai)}</td>
                                    <td class="text-center font-bold" style="color: var(--danger-600);">${mutasi.totals.keluarQty}</td>
                                    <td class="text-right">-</td>
                                    <td class="text-right font-bold" style="color: var(--danger-600);">${window.FIFOEngine.formatRupiah(mutasi.totals.keluarNilai)}</td>
                                    <td class="text-center font-bold" style="font-size: 13.5px;">${mutasi.totals.saldoAkhirQty}</td>
                                    <td class="text-right font-bold" style="font-size: 13.5px; color: var(--primary-700);">${window.FIFOEngine.formatRupiah(mutasi.totals.saldoAkhirNilai)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        container.innerHTML = containerHtml || '<div style="padding: 30px; text-align: center; color: var(--slate-400);">Tidak ada transaksi untuk barang yang dipilih pada rentang tanggal ini</div>';

        // Signatures
        const todayIndo = window.FIFOEngine.formatTanggalIndo(new Date().toISOString().split('T')[0]);
        document.getElementById('lr-sign-city-date').textContent = `${settings.kotaTandaTangan}, ${todayIndo}`;
        document.getElementById('lr-sign-kepsek-name').textContent = settings.kepalaSekolah;
        document.getElementById('lr-sign-kepsek-nip').textContent = `NIP. ${settings.nipKepalaSekolah}`;
        document.getElementById('lr-sign-kepsek-pangkat').textContent = settings.pangkatKepalaSekolah || '';
        document.getElementById('lr-sign-pengurus-name').textContent = settings.pengurusBarang;
        document.getElementById('lr-sign-pengurus-nip').textContent = `NIP. ${settings.nipPengurusBarang}`;
        document.getElementById('lr-sign-pengurus-pangkat').textContent = settings.pangkatPengurusBarang || '';
    }

    printCurrent() {
        window.print();
    }

    exportExcelPersediaan() {
        const year = window.Auth.currentYear;
        const dateRange = this.getDateRangeForPeriod(year, this.persediaanPeriodType, this.persediaanPeriodValue);
        const reportData = window.FIFOEngine.getYearlyInventorySummary(year, dateRange.start, dateRange.end);
        const settings = window.DB.getSettings();

        let tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Persediaan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
                <style>
                    body { font-family: Calibri, Arial; font-size: 11pt; }
                    .header-title { font-size: 14pt; font-weight: bold; text-align: center; }
                    .header-sub { font-size: 11pt; text-align: center; }
                    th { background-color: #d9e1f2; font-weight: bold; border: 1px solid #000; text-align: center; }
                    td { border: 1px solid #000; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .total { font-weight: bold; background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header-title">${settings.namaSekolah.toUpperCase()}</div>
                <div class="header-sub">LAPORAN REKAPITULASI PERSEDIAAN BARANG HABIS PAKAI</div>
                <div class="header-sub">Periode: ${dateRange.label} (Metode FIFO)</div>
                <br/>
                <table border="1" cellspacing="0" cellpadding="4">
                    <thead>
                        <tr>
                            <th rowspan="2">No</th>
                            <th rowspan="2">Kode Barang</th>
                            <th rowspan="2">Nama Barang</th>
                            <th rowspan="2">Satuan</th>
                            <th colspan="2">Saldo Awal</th>
                            <th colspan="2">Penambahan</th>
                            <th colspan="2">Pengurangan</th>
                            <th colspan="2">Saldo Akhir</th>
                        </tr>
                        <tr>
                            <th>Qty</th>
                            <th>Nilai (Rp)</th>
                            <th>Qty</th>
                            <th>Nilai (Rp)</th>
                            <th>Qty</th>
                            <th>Nilai (Rp)</th>
                            <th>Qty</th>
                            <th>Nilai (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        reportData.items.forEach(item => {
            tableHtml += `
                <tr>
                    <td class="text-center">${item.no}</td>
                    <td>${item.kode}</td>
                    <td>${item.nama}</td>
                    <td class="text-center">${item.satuan}</td>
                    <td class="text-center">${item.saldoAwal.qty}</td>
                    <td class="text-right">${item.saldoAwal.nilai}</td>
                    <td class="text-center">${item.penambahan.qty}</td>
                    <td class="text-right">${item.penambahan.nilai}</td>
                    <td class="text-center">${item.pengurangan.qty}</td>
                    <td class="text-right">${item.pengurangan.nilai}</td>
                    <td class="text-center">${item.saldoAkhir.qty}</td>
                    <td class="text-right">${item.saldoAkhir.nilai}</td>
                </tr>
            `;
        });

        const gt = reportData.grandTotals;
        tableHtml += `
                    <tr class="total">
                        <td colspan="4" class="text-center">TOTAL NILAI PERSEDIAAN</td>
                        <td class="text-center">-</td>
                        <td class="text-right">${gt.saldoAwal}</td>
                        <td class="text-center">-</td>
                        <td class="text-right">${gt.penambahan}</td>
                        <td class="text-center">-</td>
                        <td class="text-right">${gt.pengurangan}</td>
                        <td class="text-center">-</td>
                        <td class="text-right">${gt.saldoAkhir}</td>
                    </tr>
                </tbody>
            </table>
            <br/>
            <div><strong>Rekonsiliasi:</strong> Saldo Akhir = Saldo Awal + Penambahan - Pengurangan (${gt.formulaCheck}) ${gt.isReconciled ? '✓ SEIMBANG' : '⚠️ SELISIH'}</div>
            <br/><br/>
            <table width="100%">
                <tr>
                    <td colspan="6" align="center" style="border: none;">
                        Mengetahui,<br/>Kepala Sekolah<br/><br/><br/><br/>
                        <strong><u>${settings.kepalaSekolah}</u></strong><br/>
                        NIP. ${settings.nipKepalaSekolah}
                    </td>
                    <td colspan="6" align="center" style="border: none;">
                        ${settings.kotaTandaTangan}, ${window.FIFOEngine.formatTanggalIndo(new Date().toISOString().split('T')[0])}<br/>
                        Pengurus Barang Habis Pakai<br/><br/><br/><br/>
                        <strong><u>${settings.pengurusBarang}</u></strong><br/>
                        NIP. ${settings.nipPengurusBarang}
                    </td>
                </tr>
            </table>
            </body>
            </html>
        `;

        this.downloadFile(tableHtml, `Laporan_Persediaan_${year}_${dateRange.start}_sd_${dateRange.end}.xls`, 'application/vnd.ms-excel');
    }

    exportExcelRincian() {
        const year = window.Auth.currentYear;
        const settings = window.DB.getSettings();
        const activeBarang = window.DB.getBarangList(true);
        let targetBarang = activeBarang;
        if (this.rincianBarangId !== 'all') {
            targetBarang = activeBarang.filter(b => b.id === this.rincianBarangId);
        }

        let tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Kartu Persediaan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
                <style>
                    body { font-family: Calibri, Arial; font-size: 10pt; }
                    th { background-color: #d9e1f2; font-weight: bold; border: 1px solid #000; text-align: center; }
                    td { border: 1px solid #000; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <div style="font-size: 14pt; font-weight: bold; text-align: center;">${settings.namaSekolah.toUpperCase()}</div>
                <div style="text-align: center; font-size: 11pt;">LAPORAN RINCIAN KARTU PERSEDIAAN BARANG (MUTASI FIFO)</div>
                <div style="text-align: center; font-size: 10pt;">Periode: ${window.FIFOEngine.formatTanggalIndo(this.rincianStartDate)} s.d. ${window.FIFOEngine.formatTanggalIndo(this.rincianEndDate)}</div>
                <br/>
        `;

        targetBarang.forEach(brg => {
            const mutasi = window.FIFOEngine.getItemMutationHistory(year, brg.id, this.rincianStartDate, this.rincianEndDate);
            if (!mutasi) return;

            tableHtml += `
                <table border="1" cellspacing="0" cellpadding="3" width="100%">
                    <tr style="background-color: #f2f2f2; font-weight: bold;">
                        <td colspan="11">Barang: [${brg.kode}] ${brg.nama} | Satuan: ${brg.satuan} | Kategori: ${brg.kategori || 'Umum'}</td>
                    </tr>
                    <thead>
                        <tr>
                            <th rowspan="2">Tanggal</th>
                            <th rowspan="2">No. BAST</th>
                            <th rowspan="2">Uraian / Keterangan</th>
                            <th colspan="3">Masuk</th>
                            <th colspan="3">Keluar</th>
                            <th colspan="2">Saldo Berjalan</th>
                        </tr>
                        <tr>
                            <th>Qty</th>
                            <th>Harga (Rp)</th>
                            <th>Total (Rp)</th>
                            <th>Qty</th>
                            <th>Harga (Rp)</th>
                            <th>Total (Rp)</th>
                            <th>Qty</th>
                            <th>Nilai (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="text-center">${window.FIFOEngine.formatTanggalIndo(this.rincianStartDate)}</td>
                            <td>-</td>
                            <td><strong>SALDO AWAL</strong></td>
                            <td class="text-center">-</td><td class="text-right">-</td><td class="text-right">-</td>
                            <td class="text-center">-</td><td class="text-right">-</td><td class="text-right">-</td>
                            <td class="text-center"><strong>${mutasi.saldoAwal.qty}</strong></td>
                            <td class="text-right"><strong>${mutasi.saldoAwal.nilai}</strong></td>
                        </tr>
            `;

            mutasi.rows.forEach(r => {
                tableHtml += `
                    <tr>
                        <td class="text-center">${window.FIFOEngine.formatTanggalIndo(r.tanggal)}</td>
                        <td>${r.noBast}</td>
                        <td>${r.uraian}</td>
                        <td class="text-center">${r.masukQty > 0 ? r.masukQty : '-'}</td>
                        <td class="text-right">${r.masukHarga > 0 ? r.masukHarga : '-'}</td>
                        <td class="text-right">${r.masukTotal > 0 ? r.masukTotal : '-'}</td>
                        <td class="text-center">${r.keluarQty > 0 ? r.keluarQty : '-'}</td>
                        <td class="text-right">${r.keluarHarga > 0 ? r.keluarHarga : '-'}</td>
                        <td class="text-right">${r.keluarTotal > 0 ? r.keluarTotal : '-'}</td>
                        <td class="text-center">${r.saldoQty}</td>
                        <td class="text-right">${r.saldoNilai}</td>
                    </tr>
                `;
            });

            tableHtml += `
                        <tr style="font-weight: bold; background-color: #e2e8f0;">
                            <td colspan="3" class="text-center">SUBTOTAL & SALDO AKHIR</td>
                            <td class="text-center">${mutasi.totals.masukQty}</td>
                            <td>-</td>
                            <td class="text-right">${mutasi.totals.masukNilai}</td>
                            <td class="text-center">${mutasi.totals.keluarQty}</td>
                            <td>-</td>
                            <td class="text-right">${mutasi.totals.keluarNilai}</td>
                            <td class="text-center">${mutasi.totals.saldoAkhirQty}</td>
                            <td class="text-right">${mutasi.totals.saldoAkhirNilai}</td>
                        </tr>
                    </tbody>
                </table>
                <br/>
            `;
        });

        tableHtml += `</body></html>`;
        this.downloadFile(tableHtml, `Kartu_Persediaan_Mutasi_${year}.xls`, 'application/vnd.ms-excel');
    }

    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.App.showToast('success', 'Ekspor Berhasil', `Berkas Excel "${fileName}" berhasil diunduh.`);
    }
}

// Global Singleton
window.LaporanModule = new LaporanController();
