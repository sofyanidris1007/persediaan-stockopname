/**
 * db.js - Database & Persistence Layer for Aplikasi Persediaan Barang Habis Pakai
 * SMP Negeri 1 Penajam Paser Utara
 */

const DB_KEY = 'smpn1ppu_persediaan_v1';
const AUTH_KEY = 'smpn1ppu_persediaan_auth';

// Initial Seed Data
const DEFAULT_SETTINGS = {
    namaSekolah: 'SMP Negeri 1 Penajam Paser Utara',
    npsn: '30402057',
    alamat: 'Jl. Propinsi Km. 1, Kel. Nenang, Kec. Penajam',
    kabupaten: 'Kab. Penajam Paser Utara',
    provinsi: 'Kalimantan Timur',
    kodePos: '76141',
    telp: '(0542) 7211234',
    email: 'smpn1ppu@yahoo.co.id',
    website: 'https://smpn1ppu.sch.id',
    kepalaSekolah: 'Drs. H. Syamsuddin, M.Pd.',
    nipKepalaSekolah: '19680512 199412 1 002',
    pangkatKepalaSekolah: 'Pembina Utama Muda / IV c',
    pengurusBarang: 'Rahmawati, S.Pd.',
    nipPengurusBarang: '19820315 200902 2 004',
    pangkatPengurusBarang: 'Penata Tk. I / III d',
    kotaTandaTangan: 'Penajam'
};

// SHA-256 for default password '30402057':
// def7d5e96d67aa4a1560ecdc30d1fbae3172fd6d1e70fe789d920f5f656c9fbc
const DEFAULT_USER = {
    username: 'smpn1PPU',
    passwordHash: 'def7d5e96d67aa4a1560ecdc30d1fbae3172fd6d1e70fe789d920f5f656c9fbc',
    nama: 'Operator Pengurus Barang',
    role: 'Pengurus Barang'
};

const SEED_BARANG = [
    { id: 'B001', kode: 'BRG-001', nama: 'Kertas HVS A4 70gr Sinar Dunia', kategori: 'ATK', satuan: 'Rim', stokMinimum: 10, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B002', kode: 'BRG-002', nama: 'Kertas HVS F4 70gr Sinar Dunia', kategori: 'ATK', satuan: 'Rim', stokMinimum: 10, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B003', kode: 'BRG-003', nama: 'Spidol Whiteboard Hitam Snowman BG-12', kategori: 'ATK', satuan: 'Pcs', stokMinimum: 24, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B004', kode: 'BRG-004', nama: 'Spidol Whiteboard Biru Snowman BG-12', kategori: 'ATK', satuan: 'Pcs', stokMinimum: 12, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B005', kode: 'BRG-005', nama: 'Tinta Refill Spidol Whiteboard Hitam 20ml', kategori: 'ATK', satuan: 'Botol', stokMinimum: 6, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B006', kode: 'BRG-006', nama: 'Penghapus Papan Tulis Whiteboard Magnet', kategori: 'ATK', satuan: 'Pcs', stokMinimum: 6, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B007', kode: 'BRG-007', nama: 'Pulpen Standard AE7 Hitam 0.5mm', kategori: 'ATK', satuan: 'Lusin', stokMinimum: 5, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B008', kode: 'BRG-008', nama: 'Map Kertas Snelhechter Folio Diamond', kategori: 'ATK', satuan: 'Lembar', stokMinimum: 50, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B009', kode: 'BRG-009', nama: 'Binder Clip No. 107 Joyko', kategori: 'ATK', satuan: 'Kotak', stokMinimum: 8, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B010', kode: 'BRG-010', nama: 'Stapler HD-10 Kangaro', kategori: 'ATK', satuan: 'Pcs', stokMinimum: 5, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B011', kode: 'BRG-011', nama: 'Isi Staples No. 10 Max', kategori: 'ATK', satuan: 'Kotak', stokMinimum: 15, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B012', kode: 'BRG-012', nama: 'Lakban Hitam 2 Inch Nachi Tape', kategori: 'ATK', satuan: 'Roll', stokMinimum: 5, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B013', kode: 'BRG-013', nama: 'Sabun Cuci Tangan Cair Anti Bakteri 500ml', kategori: 'Kebersihan', satuan: 'Botol', stokMinimum: 8, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B014', kode: 'BRG-014', nama: 'Cairan Pembersih Lantai Lavender 800ml', kategori: 'Kebersihan', satuan: 'Pouch', stokMinimum: 10, aktif: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'B015', kode: 'BRG-015', nama: 'Baterai Alkaline AA Isi 2 Pcs', kategori: 'Elektronik', satuan: 'Pak', stokMinimum: 6, aktif: true, createdAt: '2026-01-01T08:00:00Z' }
];

// Initial Seed Transactions for 2026:
// 1. Saldo Awal (1 Jan 2026)
const SEED_MASUK_HEADER = [
    {
        id: 'MSK-2026-001',
        tahun: 2026,
        jenis: 'saldo_awal',
        noBast: 'BAST-SA/2026/001',
        tglBast: '2026-01-02',
        keterangan: 'Saldo Awal Persediaan Tahun Anggaran 2026',
        pemasok: 'Persediaan Terbawa TA 2025',
        createdAt: '2026-01-02T08:00:00Z'
    },
    {
        id: 'MSK-2026-002',
        tahun: 2026,
        jenis: 'pembelian',
        noBast: 'BAST-BL/2026/014',
        tglBast: '2026-02-10',
        keterangan: 'Pengadaan ATK Kegiatan Belajar Mengajar BOS Reguler Tahap 1',
        pemasok: 'CV. Pena Harapan Balikpapan',
        createdAt: '2026-02-10T10:30:00Z'
    }
];

const SEED_MASUK_DETAIL = [
    // Saldo Awal details
    { id: 'MSKD-001-1', headerId: 'MSK-2026-001', barangId: 'B001', qty: 20, hargaSatuan: 48000, total: 960000 },
    { id: 'MSKD-001-2', headerId: 'MSK-2026-001', barangId: 'B002', qty: 15, hargaSatuan: 53000, total: 795000 },
    { id: 'MSKD-001-3', headerId: 'MSK-2026-001', barangId: 'B003', qty: 36, hargaSatuan: 8500, total: 306000 },
    { id: 'MSKD-001-4', headerId: 'MSK-2026-001', barangId: 'B004', qty: 24, hargaSatuan: 8500, total: 204000 },
    { id: 'MSKD-001-5', headerId: 'MSK-2026-001', barangId: 'B005', qty: 10, hargaSatuan: 16500, total: 165000 },
    { id: 'MSKD-001-6', headerId: 'MSK-2026-001', barangId: 'B006', qty: 8, hargaSatuan: 12000, total: 96000 },
    { id: 'MSKD-001-7', headerId: 'MSK-2026-001', barangId: 'B007', qty: 8, hargaSatuan: 27500, total: 220000 },
    { id: 'MSKD-001-8', headerId: 'MSK-2026-001', barangId: 'B008', qty: 100, hargaSatuan: 1500, total: 150000 },
    { id: 'MSKD-001-9', headerId: 'MSK-2026-001', barangId: 'B010', qty: 6, hargaSatuan: 18500, total: 111000 },
    { id: 'MSKD-001-10', headerId: 'MSK-2026-001', barangId: 'B011', qty: 20, hargaSatuan: 4000, total: 80000 },
    { id: 'MSKD-001-11', headerId: 'MSK-2026-001', barangId: 'B013', qty: 12, hargaSatuan: 14500, total: 174000 },
    { id: 'MSKD-001-12', headerId: 'MSK-2026-001', barangId: 'B014', qty: 15, hargaSatuan: 13500, total: 202500 },

    // Pembelian Feb 2026 details (Note: Harga HVS A4 sedikit naik menjadi 50.000 untuk simulasi FIFO multi-tier)
    { id: 'MSKD-002-1', headerId: 'MSK-2026-002', barangId: 'B001', qty: 25, hargaSatuan: 50000, total: 1250000 },
    { id: 'MSKD-002-2', headerId: 'MSK-2026-002', barangId: 'B003', qty: 24, hargaSatuan: 9000, total: 216000 },
    { id: 'MSKD-002-3', headerId: 'MSK-2026-002', barangId: 'B008', qty: 150, hargaSatuan: 1500, total: 225000 },
    { id: 'MSKD-002-4', headerId: 'MSK-2026-002', barangId: 'B009', qty: 10, hargaSatuan: 12500, total: 125000 },
    { id: 'MSKD-002-5', headerId: 'MSK-2026-002', barangId: 'B012', qty: 8, hargaSatuan: 17500, total: 140000 }
];

// Initial Pemakaian (Keluar)
const SEED_KELUAR_HEADER = [
    {
        id: 'KLR-2026-001',
        tahun: 2026,
        jenis: 'pemakaian',
        noBast: 'BAST-PK/2026/003',
        tglBast: '2026-01-20',
        unitPeminta: 'Sub Bagian Tata Usaha',
        keterangan: 'Kebutuhan administrasi surat-menyurat dan kepegawaian',
        createdAt: '2026-01-20T09:15:00Z'
    },
    {
        id: 'KLR-2026-002',
        tahun: 2026,
        jenis: 'pemakaian',
        noBast: 'BAST-PK/2026/011',
        tglBast: '2026-03-05',
        unitPeminta: 'Tim Kurikulum & Pembelajaran',
        keterangan: 'Pelaksanaan Asesmen Sumatif Tengah Semester Genap (Memerlukan 25 Rim HVS A4)',
        createdAt: '2026-03-05T08:45:00Z'
    }
];

const SEED_KELUAR_DETAIL = [
    // Pemakaian 1:
    { id: 'KLRD-001-1', headerId: 'KLR-2026-001', barangId: 'B001', qty: 5, hargaSatuan: 48000, total: 240000, masukDetailId: 'MSKD-001-1' },
    { id: 'KLRD-001-2', headerId: 'KLR-2026-001', barangId: 'B007', qty: 2, hargaSatuan: 27500, total: 55000, masukDetailId: 'MSKD-001-7' },
    { id: 'KLRD-001-3', headerId: 'KLR-2026-001', barangId: 'B008', qty: 30, hargaSatuan: 1500, total: 45000, masukDetailId: 'MSKD-001-8' },
    
    // Pemakaian 2: (Demonstrates FIFO split! Sisa Saldo Awal HVS A4 adalah 15 rim @48.000, 10 rim sisanya diambil dari Pembelian @50.000)
    { id: 'KLRD-002-1', headerId: 'KLR-2026-002', barangId: 'B001', qty: 15, hargaSatuan: 48000, total: 720000, masukDetailId: 'MSKD-001-1', catatanBatch: 'Lapisan Saldo Awal' },
    { id: 'KLRD-002-2', headerId: 'KLR-2026-002', barangId: 'B001', qty: 10, hargaSatuan: 50000, total: 500000, masukDetailId: 'MSKD-002-1', catatanBatch: 'Lapisan Pembelian BAST-BL/2026/014' },
    { id: 'KLRD-002-3', headerId: 'KLR-2026-002', barangId: 'B003', qty: 18, hargaSatuan: 8500, total: 153000, masukDetailId: 'MSKD-001-3' }
];

const SEED_OPNAME_HEADER = [];
const SEED_OPNAME_DETAIL = [];

const SEED_LOGS = [
    { id: 'LOG-001', waktu: '2026-01-02T08:00:00Z', user: 'smpn1PPU', aksi: 'SISTEM_INIT', modul: 'Inisialisasi', detail: 'Sistem persediaan SMPN 1 PPU berhasil disiapkan untuk Tahun Anggaran 2026' },
    { id: 'LOG-002', waktu: '2026-01-02T08:30:00Z', user: 'smpn1PPU', aksi: 'TAMBAH', modul: 'Persediaan Masuk', detail: 'Input Saldo Awal BAST-SA/2026/001' },
    { id: 'LOG-003', waktu: '2026-02-10T10:30:00Z', user: 'smpn1PPU', aksi: 'TAMBAH', modul: 'Persediaan Masuk', detail: 'Input Pembelian BOS Reguler BAST-BL/2026/014' },
    { id: 'LOG-004', waktu: '2026-03-05T09:00:00Z', user: 'smpn1PPU', aksi: 'TAMBAH', modul: 'Persediaan Keluar', detail: 'Input Pemakaian BAST-PK/2026/011 (Asesmen Sumatif)' }
];

class DBService {
    constructor() {
        this.data = null;
        this.load();
    }

    load() {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            try {
                this.data = JSON.parse(raw);
            } catch (e) {
                console.error('Failed to parse DB, reseeding:', e);
                this.resetToDefault();
            }
        } else {
            this.resetToDefault();
        }
    }

    save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }

    resetToDefault() {
        this.data = {
            version: 1,
            settings: { ...DEFAULT_SETTINGS },
            user: { ...DEFAULT_USER },
            yearsStatus: {
                '2026': { locked: false, closed: false }
            },
            barang: JSON.parse(JSON.stringify(SEED_BARANG)),
            masukHeader: JSON.parse(JSON.stringify(SEED_MASUK_HEADER)),
            masukDetail: JSON.parse(JSON.stringify(SEED_MASUK_DETAIL)),
            keluarHeader: JSON.parse(JSON.stringify(SEED_KELUAR_HEADER)),
            keluarDetail: JSON.parse(JSON.stringify(SEED_KELUAR_DETAIL)),
            opnameHeader: JSON.parse(JSON.stringify(SEED_OPNAME_HEADER)),
            opnameDetail: JSON.parse(JSON.stringify(SEED_OPNAME_DETAIL)),
            activityLog: JSON.parse(JSON.stringify(SEED_LOGS))
        };
        this.save();
    }

    // Logger
    logActivity(aksi, modul, detail, user = 'smpn1PPU') {
        const entry = {
            id: 'LOG-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
            waktu: new Date().toISOString(),
            user,
            aksi,
            modul,
            detail
        };
        this.data.activityLog.unshift(entry);
        if (this.data.activityLog.length > 2000) {
            this.data.activityLog.pop();
        }
        this.save();
    }

    // Settings
    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings, user) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.logActivity('UBAH_PENGATURAN', 'Pengaturan', 'Memperbarui data identitas sekolah dan pejabat penandatangan', user);
        this.save();
        return this.data.settings;
    }

    // User & Password
    getUser() {
        return this.data.user;
    }

    updateUserPassword(newHash, user) {
        this.data.user.passwordHash = newHash;
        this.logActivity('GANTI_PASSWORD', 'Keamanan', 'Berhasil memperbarui password akun operator', user);
        this.save();
    }

    // Year Status
    isYearLocked(year) {
        const yStr = String(year);
        return !!(this.data.yearsStatus && this.data.yearsStatus[yStr] && this.data.yearsStatus[yStr].locked);
    }

    toggleLockYear(year, lock, user) {
        const yStr = String(year);
        if (!this.data.yearsStatus) this.data.yearsStatus = {};
        if (!this.data.yearsStatus[yStr]) this.data.yearsStatus[yStr] = { locked: false, closed: false };
        this.data.yearsStatus[yStr].locked = lock;
        this.data.yearsStatus[yStr].lockedAt = lock ? new Date().toISOString() : null;
        this.data.yearsStatus[yStr].lockedBy = lock ? user : null;
        this.logActivity(lock ? 'KUNCI_TAHUN' : 'BUKA_KUNCI_TAHUN', 'Pengaturan Periode', `${lock ? 'Mengunci' : 'Membuka kunci'} tahun anggaran ${year}`, user);
        this.save();
    }

    // Master Barang CRUD
    getBarangList(includeInactive = false) {
        if (includeInactive) return this.data.barang;
        return this.data.barang.filter(b => b.aktif !== false);
    }

    getBarangById(id) {
        return this.data.barang.find(b => b.id === id);
    }

    getBarangByKode(kode) {
        return this.data.barang.find(b => b.kode.trim().toUpperCase() === kode.trim().toUpperCase());
    }

    getBarangByNama(nama) {
        return this.data.barang.find(b => b.nama.trim().toLowerCase() === nama.trim().toLowerCase());
    }

    getNextBarangKode() {
        let maxNum = 0;
        this.data.barang.forEach(b => {
            const m = b.kode.match(/BRG-(\d+)/i);
            if (m) {
                const n = parseInt(m[1], 10);
                if (n > maxNum) maxNum = n;
            }
        });
        return 'BRG-' + String(maxNum + 1).padStart(3, '0');
    }

    createBarang(data, user) {
        // Validation
        const existName = this.getBarangByNama(data.nama);
        if (existName) {
            throw new Error(`Nama barang "${data.nama}" sudah terdaftar dengan kode ${existName.kode}`);
        }
        if (data.kode) {
            const existKode = this.getBarangByKode(data.kode);
            if (existKode) {
                throw new Error(`Kode barang "${data.kode}" sudah digunakan untuk barang "${existKode.nama}"`);
            }
        } else {
            data.kode = this.getNextBarangKode();
        }

        const id = 'B' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
        const item = {
            id,
            kode: data.kode.trim(),
            nama: data.nama.trim(),
            kategori: data.kategori || 'Umum',
            satuan: data.satuan.trim(),
            stokMinimum: Number(data.stokMinimum) || 0,
            aktif: true,
            createdAt: new Date().toISOString()
        };
        this.data.barang.push(item);
        this.logActivity('TAMBAH', 'Master Barang', `Menambah barang baru: [${item.kode}] ${item.nama}`, user);
        this.save();
        return item;
    }

    updateBarang(id, data, user) {
        const item = this.getBarangById(id);
        if (!item) throw new Error('Barang tidak ditemukan');

        if (data.nama && data.nama.trim().toLowerCase() !== item.nama.toLowerCase()) {
            const existName = this.getBarangByNama(data.nama);
            if (existName && existName.id !== id) {
                throw new Error(`Nama barang "${data.nama}" sudah digunakan`);
            }
        }
        if (data.kode && data.kode.trim().toUpperCase() !== item.kode.toUpperCase()) {
            const existKode = this.getBarangByKode(data.kode);
            if (existKode && existKode.id !== id) {
                throw new Error(`Kode barang "${data.kode}" sudah digunakan`);
            }
        }

        item.kode = data.kode ? data.kode.trim() : item.kode;
        item.nama = data.nama ? data.nama.trim() : item.nama;
        item.kategori = data.kategori || item.kategori;
        item.satuan = data.satuan ? data.satuan.trim() : item.satuan;
        item.stokMinimum = data.stokMinimum !== undefined ? Number(data.stokMinimum) : item.stokMinimum;
        if (data.aktif !== undefined) item.aktif = !!data.aktif;

        this.logActivity('UBAH', 'Master Barang', `Memperbarui data barang: [${item.kode}] ${item.nama}`, user);
        this.save();
        return item;
    }

    toggleBarangAktif(id, aktif, user) {
        const item = this.getBarangById(id);
        if (!item) throw new Error('Barang tidak ditemukan');
        item.aktif = !!aktif;
        this.logActivity('UBAH_STATUS', 'Master Barang', `${aktif ? 'Mengaktifkan' : 'Menonaktifkan'} barang: [${item.kode}] ${item.nama}`, user);
        this.save();
        return item;
    }

    deleteBarang(id, user) {
        const item = this.getBarangById(id);
        if (!item) throw new Error('Barang tidak ditemukan');

        // Check if there are any transactions
        const hasMasuk = this.data.masukDetail.some(d => d.barangId === id);
        const hasKeluar = this.data.keluarDetail.some(d => d.barangId === id);
        const hasOpname = this.data.opnameDetail.some(d => d.barangId === id);

        if (hasMasuk || hasKeluar || hasOpname) {
            throw new Error(`Barang "[${item.kode}] ${item.nama}" sudah memiliki riwayat transaksi persediaan dan tidak boleh dihapus. Anda dapat memilih opsi "Nonaktifkan" agar barang tidak muncul di pilihan transaksi baru.`);
        }

        this.data.barang = this.data.barang.filter(b => b.id !== id);
        this.logActivity('HAPUS', 'Master Barang', `Menghapus master barang: [${item.kode}] ${item.nama}`, user);
        this.save();
        return true;
    }

    // Persediaan Masuk CRUD
    getMasukHeaders(year) {
        if (!year) return this.data.masukHeader;
        return this.data.masukHeader.filter(h => h.tahun === Number(year));
    }

    getMasukHeaderById(id) {
        return this.data.masukHeader.find(h => h.id === id);
    }

    getMasukDetailsByHeaderId(headerId) {
        return this.data.masukDetail.filter(d => d.headerId === headerId);
    }

    createMasuk(headerData, detailsData, user) {
        if (this.isYearLocked(headerData.tahun)) {
            throw new Error(`Tahun anggaran ${headerData.tahun} sedang dikunci. Buka kunci tahun terlebih dahulu di menu Pengaturan.`);
        }

        // Validate BAST uniqueness per year and type
        const exist = this.data.masukHeader.find(h => 
            h.tahun === Number(headerData.tahun) && 
            h.noBast.trim().toLowerCase() === headerData.noBast.trim().toLowerCase()
        );
        if (exist) {
            throw new Error(`No. BAST "${headerData.noBast}" sudah terdaftar pada tahun ${headerData.tahun}`);
        }

        const headerId = 'MSK-' + headerData.tahun + '-' + Date.now().toString(36);
        const header = {
            id: headerId,
            tahun: Number(headerData.tahun),
            jenis: headerData.jenis, // 'saldo_awal', 'pembelian', 'penyesuaian'
            noBast: headerData.noBast.trim(),
            tglBast: headerData.tglBast,
            keterangan: headerData.keterangan || '',
            pemasok: headerData.pemasok || '',
            createdAt: new Date().toISOString()
        };

        const details = detailsData.map((d, idx) => ({
            id: 'MSKD-' + headerId + '-' + (idx + 1),
            headerId: headerId,
            barangId: d.barangId,
            qty: Number(d.qty),
            hargaSatuan: Number(d.hargaSatuan),
            total: Number(d.qty) * Number(d.hargaSatuan)
        }));

        this.data.masukHeader.push(header);
        this.data.masukDetail.push(...details);
        this.logActivity('TAMBAH', 'Persediaan Masuk', `Input persediaan masuk [${header.jenis.toUpperCase()}]: No. ${header.noBast} (${details.length} item)`, user);
        this.save();
        return { header, details };
    }

    updateMasuk(headerId, headerData, detailsData, user) {
        const header = this.getMasukHeaderById(headerId);
        if (!header) throw new Error('Data persediaan masuk tidak ditemukan');
        if (this.isYearLocked(header.tahun)) {
            throw new Error(`Tahun anggaran ${header.tahun} sedang dikunci.`);
        }

        // Check if updating/deleting any details breaks FIFO consumption in Keluar
        // We will call the FIFO engine's checkCanModifyMasuk
        if (window.FIFOEngine) {
            window.FIFOEngine.validateModifyMasuk(headerId, detailsData);
        }

        // Update header fields
        header.tglBast = headerData.tglBast;
        header.keterangan = headerData.keterangan || '';
        header.pemasok = headerData.pemasok || '';
        if (headerData.noBast && headerData.noBast.trim() !== header.noBast) {
            const exist = this.data.masukHeader.find(h => 
                h.id !== headerId && 
                h.tahun === header.tahun && 
                h.noBast.trim().toLowerCase() === headerData.noBast.trim().toLowerCase()
            );
            if (exist) throw new Error(`No. BAST "${headerData.noBast}" sudah digunakan`);
            header.noBast = headerData.noBast.trim();
        }

        // Replace details
        this.data.masukDetail = this.data.masukDetail.filter(d => d.headerId !== headerId);
        const newDetails = detailsData.map((d, idx) => ({
            id: 'MSKD-' + headerId + '-' + (idx + 1) + '-' + Date.now().toString(36),
            headerId: headerId,
            barangId: d.barangId,
            qty: Number(d.qty),
            hargaSatuan: Number(d.hargaSatuan),
            total: Number(d.qty) * Number(d.hargaSatuan)
        }));
        this.data.masukDetail.push(...newDetails);

        this.logActivity('UBAH', 'Persediaan Masuk', `Memperbarui persediaan masuk No. ${header.noBast}`, user);
        this.save();
        return { header, details: newDetails };
    }

    deleteMasuk(headerId, user) {
        const header = this.getMasukHeaderById(headerId);
        if (!header) throw new Error('Data persediaan masuk tidak ditemukan');
        if (this.isYearLocked(header.tahun)) {
            throw new Error(`Tahun anggaran ${header.tahun} sedang dikunci.`);
        }

        // Check if any item in this header has been consumed in Keluar
        if (window.FIFOEngine) {
            window.FIFOEngine.validateDeleteMasuk(headerId);
        }

        this.data.masukHeader = this.data.masukHeader.filter(h => h.id !== headerId);
        this.data.masukDetail = this.data.masukDetail.filter(d => d.headerId !== headerId);

        this.logActivity('HAPUS', 'Persediaan Masuk', `Menghapus persediaan masuk No. ${header.noBast}`, user);
        this.save();
        return true;
    }

    // Persediaan Keluar CRUD
    getKeluarHeaders(year) {
        if (!year) return this.data.keluarHeader;
        return this.data.keluarHeader.filter(h => h.tahun === Number(year));
    }

    getKeluarHeaderById(id) {
        return this.data.keluarHeader.find(h => h.id === id);
    }

    getKeluarDetailsByHeaderId(headerId) {
        return this.data.keluarDetail.filter(d => d.headerId === headerId);
    }

    createKeluar(headerData, itemsRequested, user) {
        if (this.isYearLocked(headerData.tahun)) {
            throw new Error(`Tahun anggaran ${headerData.tahun} sedang dikunci.`);
        }

        // Validate BAST uniqueness
        const exist = this.data.keluarHeader.find(h => 
            h.tahun === Number(headerData.tahun) && 
            h.noBast.trim().toLowerCase() === headerData.noBast.trim().toLowerCase()
        );
        if (exist) {
            throw new Error(`No. Bukti / BAST "${headerData.noBast}" sudah terdaftar pada tahun ${headerData.tahun}`);
        }

        // Calculate FIFO allocations using FIFOEngine
        if (!window.FIFOEngine) {
            throw new Error('FIFO Engine belum siap');
        }

        const allocationResult = window.FIFOEngine.allocateKeluar(
            Number(headerData.tahun),
            headerData.tglBast,
            itemsRequested
        );

        const headerId = 'KLR-' + headerData.tahun + '-' + Date.now().toString(36);
        const header = {
            id: headerId,
            tahun: Number(headerData.tahun),
            jenis: headerData.jenis || 'pemakaian',
            noBast: headerData.noBast.trim(),
            tglBast: headerData.tglBast,
            unitPeminta: headerData.unitPeminta || '',
            keterangan: headerData.keterangan || '',
            createdAt: new Date().toISOString()
        };

        const details = allocationResult.details.map((d, idx) => ({
            id: 'KLRD-' + headerId + '-' + (idx + 1),
            headerId: headerId,
            barangId: d.barangId,
            qty: d.qty,
            hargaSatuan: d.hargaSatuan,
            total: d.total,
            masukDetailId: d.masukDetailId,
            catatanBatch: d.catatanBatch || ''
        }));

        this.data.keluarHeader.push(header);
        this.data.keluarDetail.push(...details);
        this.logActivity('TAMBAH', 'Persediaan Keluar', `Input pemakaian barang: No. ${header.noBast} ke ${header.unitPeminta} (${details.length} rincian lapisan FIFO)`, user);
        this.save();
        return { header, details };
    }

    deleteKeluar(headerId, user) {
        const header = this.getKeluarHeaderById(headerId);
        if (!header) throw new Error('Data pengeluaran barang tidak ditemukan');
        if (this.isYearLocked(header.tahun)) {
            throw new Error(`Tahun anggaran ${header.tahun} sedang dikunci.`);
        }

        this.data.keluarHeader = this.data.keluarHeader.filter(h => h.id !== headerId);
        this.data.keluarDetail = this.data.keluarDetail.filter(d => d.headerId !== headerId);

        this.logActivity('HAPUS', 'Persediaan Keluar', `Menghapus transaksi pemakaian No. ${header.noBast}`, user);
        this.save();
        return true;
    }

    // Stok Opname CRUD
    getOpnameHeaders(year) {
        if (!year) return this.data.opnameHeader;
        return this.data.opnameHeader.filter(h => h.tahun === Number(year));
    }

    getOpnameHeaderById(id) {
        return this.data.opnameHeader.find(h => h.id === id);
    }

    getOpnameDetailsByHeaderId(headerId) {
        return this.data.opnameDetail.filter(d => d.headerId === headerId);
    }

    createOpname(headerData, itemsData, isApproved, user) {
        if (this.isYearLocked(headerData.tahun)) {
            throw new Error(`Tahun anggaran ${headerData.tahun} sedang dikunci.`);
        }

        const headerId = 'OPN-' + headerData.tahun + '-' + Date.now().toString(36);
        const header = {
            id: headerId,
            tahun: Number(headerData.tahun),
            noBA: headerData.noBA.trim(),
            tanggal: headerData.tanggal,
            keterangan: headerData.keterangan || '',
            status: isApproved ? 'disetujui' : 'draft',
            disetujuiAt: isApproved ? new Date().toISOString() : null,
            createdAt: new Date().toISOString()
        };

        const details = itemsData.map((d, idx) => ({
            id: 'OPND-' + headerId + '-' + (idx + 1),
            headerId: headerId,
            barangId: d.barangId,
            stokSistem: Number(d.stokSistem),
            stokFisik: Number(d.stokFisik),
            selisih: Number(d.selisih),
            nilaiSelisih: Number(d.nilaiSelisih),
            keterangan: d.keterangan || (d.selisih === 0 ? 'Sesuai' : (d.selisih > 0 ? 'Selisih Lebih' : 'Selisih Kurang'))
        }));

        this.data.opnameHeader.push(header);
        this.data.opnameDetail.push(...details);

        // If approved, create adjustment records!
        if (isApproved) {
            this.applyOpnameAdjustments(header, details, user);
        }

        this.logActivity(isApproved ? 'SETUJUI_OPNAME' : 'DRAFT_OPNAME', 'Stok Opname', `${isApproved ? 'Menyetujui & menerapkan penyesuaian' : 'Menyimpan draft'} stok opname No. ${header.noBA}`, user);
        this.save();
        return { header, details };
    }

    applyOpnameAdjustments(header, details, user) {
        const surplusItems = details.filter(d => d.selisih > 0);
        const deficitItems = details.filter(d => d.selisih < 0);

        // 1. Surplus items: create Masuk (Penyesuaian)
        if (surplusItems.length > 0) {
            const masukHeaderId = 'MSK-ADJ-' + header.id;
            const mskHeader = {
                id: masukHeaderId,
                tahun: header.tahun,
                jenis: 'penyesuaian',
                noBast: 'ADJ-MASUK/' + header.noBA,
                tglBast: header.tanggal,
                keterangan: `Penyesuaian Opname (Selisih Lebih) BA No: ${header.noBA}`,
                pemasok: 'Hasil Stok Opname Fisik',
                createdAt: new Date().toISOString(),
                opnameRefId: header.id
            };
            const mskDetails = surplusItems.map((s, idx) => {
                // Harga satuan penyesuaian diambil dari nilai per unit
                const unitPrice = s.selisih > 0 ? Math.round(s.nilaiSelisih / s.selisih) : 0;
                return {
                    id: 'MSKD-ADJ-' + header.id + '-' + (idx + 1),
                    headerId: masukHeaderId,
                    barangId: s.barangId,
                    qty: s.selisih,
                    hargaSatuan: unitPrice,
                    total: s.nilaiSelisih
                };
            });
            this.data.masukHeader.push(mskHeader);
            this.data.masukDetail.push(...mskDetails);
        }

        // 2. Deficit items: create Keluar (Penyesuaian)
        if (deficitItems.length > 0) {
            const reqItems = deficitItems.map(d => ({
                barangId: d.barangId,
                qty: Math.abs(d.selisih)
            }));
            const allocation = window.FIFOEngine.allocateKeluar(
                header.tahun,
                header.tanggal,
                reqItems
            );
            const keluarHeaderId = 'KLR-ADJ-' + header.id;
            const klrHeader = {
                id: keluarHeaderId,
                tahun: header.tahun,
                jenis: 'penyesuaian',
                noBast: 'ADJ-KELUAR/' + header.noBA,
                tglBast: header.tanggal,
                unitPeminta: 'Penyesuaian Stok Opname',
                keterangan: `Penyesuaian Opname (Selisih Kurang) BA No: ${header.noBA}`,
                createdAt: new Date().toISOString(),
                opnameRefId: header.id
            };
            const klrDetails = allocation.details.map((d, idx) => ({
                id: 'KLRD-ADJ-' + header.id + '-' + (idx + 1),
                headerId: keluarHeaderId,
                barangId: d.barangId,
                qty: d.qty,
                hargaSatuan: d.hargaSatuan,
                total: d.total,
                masukDetailId: d.masukDetailId,
                catatanBatch: 'Penyesuaian Stok Opname'
            }));
            this.data.keluarHeader.push(klrHeader);
            this.data.keluarDetail.push(...klrDetails);
        }
    }

    deleteOpname(headerId, user) {
        const header = this.getOpnameHeaderById(headerId);
        if (!header) throw new Error('Data stok opname tidak ditemukan');
        if (this.isYearLocked(header.tahun)) {
            throw new Error(`Tahun anggaran ${header.tahun} sedang dikunci.`);
        }

        // If approved, remove associated adjustments
        if (header.status === 'disetujui') {
            const adjMasuk = this.data.masukHeader.find(h => h.opnameRefId === headerId);
            if (adjMasuk) {
                this.data.masukDetail = this.data.masukDetail.filter(d => d.headerId !== adjMasuk.id);
                this.data.masukHeader = this.data.masukHeader.filter(h => h.id !== adjMasuk.id);
            }
            const adjKeluar = this.data.keluarHeader.find(h => h.opnameRefId === headerId);
            if (adjKeluar) {
                this.data.keluarDetail = this.data.keluarDetail.filter(d => d.headerId !== adjKeluar.id);
                this.data.keluarHeader = this.data.keluarHeader.filter(h => h.id !== adjKeluar.id);
            }
        }

        this.data.opnameHeader = this.data.opnameHeader.filter(h => h.id !== headerId);
        this.data.opnameDetail = this.data.opnameDetail.filter(d => d.headerId !== headerId);

        this.logActivity('HAPUS', 'Stok Opname', `Menghapus berita acara stok opname No. ${header.noBA}`, user);
        this.save();
        return true;
    }

    // Rollover Saldo Awal to Next Year
    rolloverToNextYear(fromYear, toYear, user) {
        if (this.isYearLocked(toYear)) {
            throw new Error(`Tahun tujuan ${toYear} sedang dikunci.`);
        }

        // Check if destination year already has Saldo Awal
        const existSA = this.data.masukHeader.find(h => h.tahun === Number(toYear) && h.jenis === 'saldo_awal');
        if (existSA) {
            throw new Error(`Tahun ${toYear} sudah memiliki Saldo Awal (No: ${existSA.noBast}). Hapus terlebih dahulu jika ingin menimpa.`);
        }

        if (!window.FIFOEngine) throw new Error('FIFO Engine belum siap');

        // Get ending inventory layers of fromYear
        const endingLayers = window.FIFOEngine.getEndingInventoryLayers(Number(fromYear));
        if (endingLayers.length === 0) {
            throw new Error(`Tidak ada saldo persediaan tersisa di akhir tahun ${fromYear}.`);
        }

        const headerId = 'MSK-' + toYear + '-SA-ROLLOVER';
        const header = {
            id: headerId,
            tahun: Number(toYear),
            jenis: 'saldo_awal',
            noBast: `BAST-SA/${toYear}/ROLLOVER`,
            tglBast: `${toYear}-01-02`,
            keterangan: `Saldo Awal Otomatis dari Saldo Akhir TA ${fromYear}`,
            pemasok: `Inventaris Sekolah (Rollover TA ${fromYear})`,
            createdAt: new Date().toISOString()
        };

        const details = endingLayers.map((layer, idx) => ({
            id: 'MSKD-' + headerId + '-' + (idx + 1),
            headerId: headerId,
            barangId: layer.barangId,
            qty: layer.qty,
            hargaSatuan: layer.hargaSatuan,
            total: layer.qty * layer.hargaSatuan
        }));

        this.data.masukHeader.push(header);
        this.data.masukDetail.push(...details);

        this.logActivity('ROLLOVER_SALDO', 'Pengaturan Periode', `Membuat Saldo Awal TA ${toYear} dari Saldo Akhir TA ${fromYear} (${details.length} item baris lapisan)`, user);
        this.save();
        return { header, details };
    }

    // Export & Import Backup
    exportBackupJSON() {
        return JSON.stringify({
            app: 'Aplikasi Persediaan Barang Habis Pakai SMPN 1 PPU',
            version: this.data.version || 1,
            exportedAt: new Date().toISOString(),
            data: this.data
        }, null, 2);
    }

    importBackupJSON(jsonString, user) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.data || !parsed.data.barang || !parsed.data.settings) {
                throw new Error('Format file cadangan tidak valid (struktur data tidak cocok)');
            }
            this.data = parsed.data;
            this.logActivity('RESTORE_DATA', 'Backup & Pemulihan', 'Memulihkan data sistem dari berkas cadangan JSON', user);
            this.save();
            return true;
        } catch (e) {
            throw new Error('Gagal memulihkan data: ' + e.message);
        }
    }
}

// Global Singleton
window.DB = new DBService();
