/**
 * fifo.js - First In, First Out (FIFO) Valuation & Inventory Movement Engine
 * SMP Negeri 1 Penajam Paser Utara
 */

class FIFOEngineService {
    constructor() {
        // Dependencies to DB
    }

    /**
     * Helper to get chronological incoming batches for a given year and barang
     */
    getIncomingBatches(year, barangId = null, upToDate = null) {
        const headers = window.DB.getMasukHeaders(year);
        const headerMap = {};
        headers.forEach(h => { headerMap[h.id] = h; });

        let details = window.DB.data.masukDetail.filter(d => headerMap[d.headerId]);

        if (barangId) {
            details = details.filter(d => d.barangId === barangId);
        }

        let batches = details.map(d => {
            const h = headerMap[d.headerId];
            return {
                id: d.id,
                headerId: d.headerId,
                barangId: d.barangId,
                tahun: h.tahun,
                jenis: h.jenis,
                noBast: h.noBast,
                tglBast: h.tglBast,
                pemasok: h.pemasok,
                createdAt: h.createdAt || d.id,
                qtyOriginal: Number(d.qty),
                qtyRemaining: Number(d.qty),
                hargaSatuan: Number(d.hargaSatuan),
                totalOriginal: Number(d.total)
            };
        });

        // Filter by date if specified
        if (upToDate) {
            batches = batches.filter(b => b.tglBast <= upToDate);
        }

        // Sort strictly chronologically: Saldo Awal first, then by date, then by creation
        batches.sort((a, b) => {
            if (a.jenis === 'saldo_awal' && b.jenis !== 'saldo_awal') return -1;
            if (b.jenis === 'saldo_awal' && a.jenis !== 'saldo_awal') return 1;
            if (a.tglBast !== b.tglBast) return a.tglBast.localeCompare(b.tglBast);
            return (a.createdAt || '').localeCompare(b.createdAt || '');
        });

        return batches;
    }

    /**
     * Helper to get outgoing transactions for a given year and barang
     */
    getOutgoingDetails(year, barangId = null, upToDate = null) {
        const headers = window.DB.getKeluarHeaders(year);
        const headerMap = {};
        headers.forEach(h => { headerMap[h.id] = h; });

        let details = window.DB.data.keluarDetail.filter(d => headerMap[d.headerId]);

        if (barangId) {
            details = details.filter(d => d.barangId === barangId);
        }

        let outList = details.map(d => {
            const h = headerMap[d.headerId];
            return {
                id: d.id,
                headerId: d.headerId,
                barangId: d.barangId,
                tahun: h.tahun,
                jenis: h.jenis,
                noBast: h.noBast,
                tglBast: h.tglBast,
                unitPeminta: h.unitPeminta,
                keterangan: h.keterangan,
                createdAt: h.createdAt || d.id,
                qty: Number(d.qty),
                hargaSatuan: Number(d.hargaSatuan),
                total: Number(d.total),
                masukDetailId: d.masukDetailId
            };
        });

        if (upToDate) {
            outList = outList.filter(o => o.tglBast <= upToDate);
        }

        // Sort chronologically
        outList.sort((a, b) => {
            if (a.tglBast !== b.tglBast) return a.tglBast.localeCompare(b.tglBast);
            return (a.createdAt || '').localeCompare(b.createdAt || '');
        });

        return outList;
    }

    /**
     * Compute current stock and remaining FIFO layers for all active items or a specific item
     */
    calculateStockState(year, upToDate = null, barangId = null) {
        const batches = this.getIncomingBatches(year, barangId, upToDate);
        const outList = this.getOutgoingDetails(year, barangId, upToDate);

        // Group batches by barangId
        const barangBatches = {};
        batches.forEach(b => {
            if (!barangBatches[b.barangId]) barangBatches[b.barangId] = [];
            barangBatches[b.barangId].push({ ...b });
        });

        // Track consumption
        const batchConsumedMap = {}; // batchId -> qtyConsumed

        outList.forEach(out => {
            const list = barangBatches[out.barangId] || [];
            let needed = out.qty;

            // If out has specific masukDetailId recorded, try that first
            if (out.masukDetailId) {
                const targetBatch = list.find(b => b.id === out.masukDetailId);
                if (targetBatch && targetBatch.qtyRemaining > 0) {
                    const take = Math.min(needed, targetBatch.qtyRemaining);
                    targetBatch.qtyRemaining -= take;
                    needed -= take;
                    batchConsumedMap[targetBatch.id] = (batchConsumedMap[targetBatch.id] || 0) + take;
                }
            }

            // Consume remaining FIFO from oldest available
            for (let i = 0; i < list.length && needed > 0; i++) {
                const b = list[i];
                if (b.qtyRemaining > 0) {
                    const take = Math.min(needed, b.qtyRemaining);
                    b.qtyRemaining -= take;
                    needed -= take;
                    batchConsumedMap[b.id] = (batchConsumedMap[b.id] || 0) + take;
                }
            }
        });

        // Aggregate summary per barang
        const summary = {};
        const barangList = window.DB.getBarangList(true);

        barangList.forEach(brg => {
            if (barangId && brg.id !== barangId) return;

            const list = barangBatches[brg.id] || [];
            let currentQty = 0;
            let currentNilai = 0;
            const availableLayers = [];

            list.forEach(b => {
                if (b.qtyRemaining > 0) {
                    currentQty += b.qtyRemaining;
                    const layerVal = b.qtyRemaining * b.hargaSatuan;
                    currentNilai += layerVal;
                    availableLayers.push({
                        batchId: b.id,
                        headerId: b.headerId,
                        noBast: b.noBast,
                        tglBast: b.tglBast,
                        qtyRemaining: b.qtyRemaining,
                        hargaSatuan: b.hargaSatuan,
                        totalNilai: layerVal
                    });
                }
            });

            summary[brg.id] = {
                barang: brg,
                currentQty,
                currentNilai,
                availableLayers,
                isLowStock: brg.stokMinimum > 0 && currentQty <= brg.stokMinimum && currentQty > 0,
                isOutOfStock: currentQty === 0
            };
        });

        return {
            summary,
            barangBatches,
            batchConsumedMap
        };
    }

    /**
     * Get real-time available stock for a barang
     */
    getAvailableStock(year, barangId, upToDate = null) {
        const state = this.calculateStockState(year, upToDate, barangId);
        return state.summary[barangId] ? state.summary[barangId].currentQty : 0;
    }

    /**
     * Allocate items requested for Persediaan Keluar strictly by FIFO layers
     */
    allocateKeluar(year, tglBast, requestedItems) {
        const state = this.calculateStockState(year, tglBast);
        const details = [];
        let grandTotal = 0;

        for (const req of requestedItems) {
            const barang = window.DB.getBarangById(req.barangId);
            if (!barang) throw new Error('Barang tidak ditemukan: ' + req.barangId);

            const qtyReq = Number(req.qty);
            if (qtyReq <= 0) continue;

            const itemStock = state.summary[barang.id];
            const available = itemStock ? itemStock.currentQty : 0;

            if (qtyReq > available) {
                throw new Error(
                    `Stok tidak mencukupi untuk "${barang.nama}" (${barang.kode})!\n` +
                    `Stok tersedia pada ${this.formatTanggalIndo(tglBast)}: ${available} ${barang.satuan}.\n` +
                    `Jumlah yang diminta: ${qtyReq} ${barang.satuan}.`
                );
            }

            // Consume from layers
            let needed = qtyReq;
            const layers = itemStock.availableLayers;

            for (const layer of layers) {
                if (needed <= 0) break;
                if (layer.qtyRemaining <= 0) continue;

                const take = Math.min(needed, layer.qtyRemaining);
                const lineTotal = take * layer.hargaSatuan;

                details.push({
                    barangId: barang.id,
                    qty: take,
                    hargaSatuan: layer.hargaSatuan,
                    total: lineTotal,
                    masukDetailId: layer.batchId,
                    catatanBatch: `Lapisan BAST: ${layer.noBast} (${this.formatTanggalIndo(layer.tglBast)}) @ ${this.formatRupiah(layer.hargaSatuan)}`
                });

                layer.qtyRemaining -= take;
                itemStock.currentQty -= take;
                needed -= take;
                grandTotal += lineTotal;
            }
        }

        return { details, grandTotal };
    }

    /**
     * Validate whether modifying an incoming record will violate FIFO
     */
    validateModifyMasuk(headerId, newDetails) {
        const header = window.DB.getMasukHeaderById(headerId);
        if (!header) return;

        const state = this.calculateStockState(header.tahun);
        const oldDetails = window.DB.getMasukDetailsByHeaderId(headerId);

        for (const oldD of oldDetails) {
            const consumed = state.batchConsumedMap[oldD.id] || 0;
            const newD = newDetails.find(d => d.barangId === oldD.barangId);

            if (!newD && consumed > 0) {
                const barang = window.DB.getBarangById(oldD.barangId);
                throw new Error(
                    `Barang "${barang ? barang.nama : oldD.barangId}" tidak dapat dihapus dari BAST ini karena sebanyak ${consumed} ${barang ? barang.satuan : 'item'} telah terpakai pada transaksi pengeluaran.`
                );
            }

            if (newD && Number(newD.qty) < consumed) {
                const barang = window.DB.getBarangById(oldD.barangId);
                throw new Error(
                    `Kuantitas barang "${barang ? barang.nama : oldD.barangId}" tidak boleh kurang dari ${consumed} ${barang ? barang.satuan : 'item'} karena telah terpakai pada transaksi pengeluaran sebelumnya.`
                );
            }
        }
    }

    /**
     * Validate whether deleting an incoming record will violate FIFO
     */
    validateDeleteMasuk(headerId) {
        const header = window.DB.getMasukHeaderById(headerId);
        if (!header) return;

        const state = this.calculateStockState(header.tahun);
        const oldDetails = window.DB.getMasukDetailsByHeaderId(headerId);

        for (const oldD of oldDetails) {
            const consumed = state.batchConsumedMap[oldD.id] || 0;
            if (consumed > 0) {
                const barang = window.DB.getBarangById(oldD.barangId);
                throw new Error(
                    `Transaksi masuk BAST "${header.noBast}" tidak dapat dihapus!\n` +
                    `Barang "${barang ? barang.nama : oldD.barangId}" sebanyak ${consumed} ${barang ? barang.satuan : 'item'} dari transaksi ini telah dialokasikan pada transaksi pengeluaran/pemakaian.\n` +
                    `Harap batalkan/hapus transaksi pengeluaran terkait terlebih dahulu.`
                );
            }
        }
    }

    /**
     * Generate Kartu Rincian Persediaan (Mutasi) per barang
     */
    getItemMutationHistory(year, barangId, startDate = null, endDate = null) {
        const barang = window.DB.getBarangById(barangId);
        if (!barang) return null;

        const yStr = String(year);
        const actualStartDate = startDate || `${yStr}-01-01`;
        const actualEndDate = endDate || `${yStr}-12-31`;

        // 1. Calculate Saldo Awal at actualStartDate
        // Saldo Awal Qty & Nilai = incoming up to < actualStartDate minus outgoing up to < actualStartDate
        let saQty = 0;
        let saNilai = 0;

        if (actualStartDate > `${yStr}-01-01`) {
            // Day before actualStartDate
            const priorDate = this.getPreviousDate(actualStartDate);
            const priorState = this.calculateStockState(year, priorDate, barangId);
            const sumItem = priorState.summary[barangId];
            if (sumItem) {
                saQty = sumItem.currentQty;
                saNilai = sumItem.currentNilai;
            }
        } else {
            // Beginning of year: find all incoming with type 'saldo_awal'
            const saBatches = this.getIncomingBatches(year, barangId).filter(b => b.jenis === 'saldo_awal');
            saBatches.forEach(b => {
                saQty += b.qtyOriginal;
                saNilai += b.totalOriginal;
            });
        }

        // 2. Collect all transactions within [actualStartDate, actualEndDate]
        const incoming = this.getIncomingBatches(year, barangId).filter(b => {
            if (actualStartDate <= `${yStr}-01-01` && b.jenis === 'saldo_awal') {
                return false; // Handled as opening balance row
            }
            return b.tglBast >= actualStartDate && b.tglBast <= actualEndDate;
        });

        const outgoing = this.getOutgoingDetails(year, barangId).filter(o => 
            o.tglBast >= actualStartDate && o.tglBast <= actualEndDate
        );

        // Combine into unified chronological stream
        const stream = [];

        incoming.forEach(inc => {
            let uraian = inc.keterangan || (inc.jenis === 'pembelian' ? 'Pembelian Barang' : 'Penyesuaian Masuk');
            if (inc.pemasok) uraian += ` (${inc.pemasok})`;
            stream.push({
                type: 'masuk',
                jenis: inc.jenis,
                tanggal: inc.tglBast,
                noBast: inc.noBast,
                uraian: uraian,
                createdAt: inc.createdAt,
                masukQty: inc.qtyOriginal,
                masukHarga: inc.hargaSatuan,
                masukTotal: inc.totalOriginal,
                keluarQty: 0,
                keluarHarga: 0,
                keluarTotal: 0
            });
        });

        outgoing.forEach(out => {
            let uraian = out.keterangan || (out.jenis === 'pemakaian' ? 'Pemakaian' : 'Penyesuaian Keluar');
            if (out.unitPeminta) uraian = `[${out.unitPeminta}] ${uraian}`;
            stream.push({
                type: 'keluar',
                jenis: out.jenis,
                tanggal: out.tglBast,
                noBast: out.noBast,
                uraian: uraian,
                createdAt: out.createdAt,
                masukQty: 0,
                masukHarga: 0,
                masukTotal: 0,
                keluarQty: out.qty,
                keluarHarga: out.hargaSatuan,
                keluarTotal: out.total
            });
        });

        // Sort stream
        stream.sort((a, b) => {
            if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
            if (a.type !== b.type) {
                // Incoming comes before outgoing on the same date
                return a.type === 'masuk' ? -1 : 1;
            }
            return (a.createdAt || '').localeCompare(b.createdAt || '');
        });

        // 3. Compute running balance
        let runningQty = saQty;
        let runningNilai = saNilai;

        let totMasukQty = 0;
        let totMasukNilai = 0;
        let totKeluarQty = 0;
        let totKeluarNilai = 0;

        const rows = stream.map(s => {
            if (s.type === 'masuk') {
                runningQty += s.masukQty;
                runningNilai += s.masukTotal;
                totMasukQty += s.masukQty;
                totMasukNilai += s.masukTotal;
            } else {
                runningQty -= s.keluarQty;
                runningNilai -= s.keluarTotal;
                totKeluarQty += s.keluarQty;
                totKeluarNilai += s.keluarTotal;
            }

            return {
                ...s,
                saldoQty: runningQty,
                saldoNilai: runningNilai
            };
        });

        return {
            barang,
            startDate: actualStartDate,
            endDate: actualEndDate,
            saldoAwal: {
                qty: saQty,
                nilai: saNilai
            },
            rows,
            totals: {
                masukQty: totMasukQty,
                masukNilai: totMasukNilai,
                keluarQty: totKeluarQty,
                keluarNilai: totKeluarNilai,
                saldoAkhirQty: runningQty,
                saldoAkhirNilai: runningNilai
            }
        };
    }

    /**
     * Generate Laporan Rekapitulasi Persediaan (PRD 5.6)
     */
    getYearlyInventorySummary(year, startDate = null, endDate = null, kategoriFilter = 'all') {
        const yStr = String(year);
        const actualStartDate = startDate || `${yStr}-01-01`;
        const actualEndDate = endDate || `${yStr}-12-31`;

        let barangList = window.DB.getBarangList(true);
        if (kategoriFilter && kategoriFilter !== 'all') {
            barangList = barangList.filter(b => b.kategori === kategoriFilter);
        }

        const items = [];
        let grandTotalSA = 0;
        let grandTotalMasuk = 0;
        let grandTotalKeluar = 0;
        let grandTotalAkhir = 0;

        barangList.forEach((brg, index) => {
            const mutasi = this.getItemMutationHistory(year, brg.id, actualStartDate, actualEndDate);
            if (!mutasi) return;

            const saQty = mutasi.saldoAwal.qty;
            const saNilai = mutasi.saldoAwal.nilai;
            const mskQty = mutasi.totals.masukQty;
            const mskNilai = mutasi.totals.masukNilai;
            const klrQty = mutasi.totals.keluarQty;
            const klrNilai = mutasi.totals.keluarNilai;
            const akrQty = mutasi.totals.saldoAkhirQty;
            const akrNilai = mutasi.totals.saldoAkhirNilai;

            // Only display items that have activity or non-zero stock
            if (saQty > 0 || mskQty > 0 || klrQty > 0 || akrQty > 0 || brg.aktif) {
                items.push({
                    no: items.length + 1,
                    barangId: brg.id,
                    kode: brg.kode,
                    nama: brg.nama,
                    satuan: brg.satuan,
                    kategori: brg.kategori,
                    saldoAwal: { qty: saQty, nilai: saNilai },
                    penambahan: { qty: mskQty, nilai: mskNilai },
                    pengurangan: { qty: klrQty, nilai: klrNilai },
                    saldoAkhir: { qty: akrQty, nilai: akrNilai }
                });

                grandTotalSA += saNilai;
                grandTotalMasuk += mskNilai;
                grandTotalKeluar += klrNilai;
                grandTotalAkhir += akrNilai;
            }
        });

        const isReconciled = (grandTotalSA + grandTotalMasuk - grandTotalKeluar) === grandTotalAkhir;

        return {
            year,
            startDate: actualStartDate,
            endDate: actualEndDate,
            items,
            grandTotals: {
                saldoAwal: grandTotalSA,
                penambahan: grandTotalMasuk,
                pengurangan: grandTotalKeluar,
                saldoAkhir: grandTotalAkhir,
                isReconciled,
                formulaCheck: `${grandTotalSA.toLocaleString('id-ID')} + ${grandTotalMasuk.toLocaleString('id-ID')} - ${grandTotalKeluar.toLocaleString('id-ID')} = ${(grandTotalSA + grandTotalMasuk - grandTotalKeluar).toLocaleString('id-ID')}`
            }
        };
    }

    /**
     * Get unconsumed ending inventory layers at end of year
     */
    getEndingInventoryLayers(year) {
        const state = this.calculateStockState(year, `${year}-12-31`);
        const result = [];

        Object.keys(state.summary).forEach(bId => {
            const item = state.summary[bId];
            if (item && item.currentQty > 0) {
                item.availableLayers.forEach(l => {
                    if (l.qtyRemaining > 0) {
                        result.push({
                            barangId: bId,
                            qty: l.qtyRemaining,
                            hargaSatuan: l.hargaSatuan,
                            total: l.qtyRemaining * l.hargaSatuan,
                            noBastAsal: l.noBast
                        });
                    }
                });
            }
        });

        return result;
    }

    getPreviousDate(dateStr) {
        const d = new Date(dateStr);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }

    formatRupiah(number) {
        return 'Rp ' + Number(number || 0).toLocaleString('id-ID');
    }

    formatTanggalIndo(dateStr) {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }
}

// Global Singleton
window.FIFOEngine = new FIFOEngineService();
