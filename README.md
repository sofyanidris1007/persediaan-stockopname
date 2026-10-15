# Aplikasi Persediaan Barang Habis Pakai (Stock Opname)
### SMP Negeri 1 Penajam Paser Utara
*Versi 1.0 • Tahun Anggaran 2026 – 2045*

Sistem informasi berbasis web modern untuk pengelolaan persediaan barang habis pakai sekolah, pencatatan BAST, kartu stok, stock opname fisik, serta pelaporan resmi pemeriksaan keuangan dan aset sekolah sesuai standar akuntansi pemerintahan dengan metode **FIFO (First In, First Out)**.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi dirancang **100% mandiri (self-contained)** tanpa ketergantungan internet eksternal:

### Cara 1: Langsung Buka di Browser (Paling Praktis)
1. Cukup klik ganda (double-click) pada berkas **`jalankan_aplikasi.bat`** atau berkas **`index.html`**.
2. Aplikasi akan langsung terbuka di browser default Anda (Google Chrome, Microsoft Edge, atau Mozilla Firefox).

### Cara 2: Menjalankan Server Web Lokal
1. Klik ganda pada berkas **`server.bat`**.
2. Server lokal PHP akan aktif di `http://localhost:8080` dan browser akan terbuka secara otomatis.

---

## 🔑 Kredensial Login Default

| Parameter | Nilai Default | Keterangan |
| :--- | :--- | :--- |
| **Username** | `smpn1PPU` | Akun operator pengurus barang |
| **Password** | `30402057` | Disimpan ter-hash secara aman dengan SHA-256 |
| **Tahun Anggaran** | `2026` | Pilihan tahun 2026 s.d. 2045 (dapat diganti tanpa login ulang) |

> 🔒 **Keamanan:**
> - Akun dilengkapi perlindungan batas percobaan login: terkunci sementara selama 5 menit jika gagal 5 kali berturut-turut.
> - Session timeout otomatis setelah 30 menit tidak aktif.
> - Kata sandi dapat diubah kapan saja di menu **Pengaturan & Backup**.

---

## 🌟 Fitur dan Modul Utama Sesuai PRD

### 1. Dashboard Eksekutif
- **4 Kartu KPI:** Total Nilai Persediaan (FIFO), Jumlah Master Barang, Stok Menipis/Kritis, dan Total Transaksi Dokumen.
- **Peringatan Stok Menipis:** Banner peringatan otomatis jika ada barang yang jumlahnya di bawah batas stok minimum.
- **Grafik Komposisi Persediaan:** Diagram batang nilai persediaan per kategori (ATK, Kebersihan, Kesehatan, dll).
- **Kotak Rekonsiliasi Keuangan Cepat:** Memvalidasi rumus `Saldo Akhir = Saldo Awal + Penambahan - Pengurangan`.
- **Tabel Transaksi Terbaru:** 8 transaksi masuk & pemakaian paling mutakhir.

### 2. Master Data Barang (CRUD)
- **Field Lengkap:** Kode Barang (dengan tombol auto-generate `BRG-xxx`), Nama Barang (wajib unik), Kategori, Satuan (Rim, Pcs, Box, dll), dan Stok Minimum.
- **Status Stok Real-Time:** Kolom read-only stok saat ini dan nilai persediaan yang terhitung otomatis.
- **Integritas Transaksi:** Barang yang sudah memiliki riwayat mutasi **tidak boleh dihapus** guna menjaga integritas data akuntansi, dan sistem menyediakan opsi **Nonaktifkan**.

### 3. Persediaan Masuk (Header-Detail)
- **Sub-Menu:** *Saldo Awal* (stok terbawa awal tahun) dan *Pembelian*.
- **Multi-Item Baris Dinamis:** Satu BAST dapat memuat banyak item barang dengan kalkulasi total otomatis.
- **Validasi Ketat FIFO:** Transaksi masuk ditolak untuk dihapus atau dikurangi kuantitasnya jika barang tersebut telah terpakai pada transaksi pengeluaran.
- **Cetak Bukti Penerimaan:** Pratinjau dan cetak bukti penerimaan barang dengan format resmi.

### 4. Persediaan Keluar (Pemakaian Unit & Alokasi FIFO)
- **Validasi Stok Tanpa Minus:** Kuantitas pemakaian dilarang melebihi stok yang tersedia pada tanggal transaksi.
- **FIFO Engine Otomatis:** Menghitung harga perolehan dari lapisan pembelian tertua. Jika satu pemakaian mengambil dari 2 lapisan harga berbeda, sistem otomatis merinci menjadi baris-baris rincian lapisan harga FIFO.
- **Live Preview:** Pratinjau lapisan harga yang akan dipotong sebelum data disimpan.
- **Pencatatan Unit Peminta:** Sub Bagian Tata Usaha, Tim Kurikulum, Lab Komputer, UKS, Ruang Guru, dll.

### 5. Stok Opname (Pemeriksaan Fisik Gudang)
- **Pencatatan Sesi Opname:** Nomor Berita Acara, tanggal opname, dan tim pemeriksa.
- **Perbandingan Fisik vs Catatan:** Menampilkan stok sistem secara real-time dan pengguna memasukkan hitungan fisik nyata di gudang.
- **Kalkulasi Selisih Otomatis:** Menghitung selisih unit dan nilai nominal selisih (cocok, lebih, atau kurang).
- **Penyesuaian Otomatis:** Saat disetujui, sistem otomatis membukukan Penyesuaian Masuk untuk barang selisih lebih, dan Penyesuaian Keluar untuk barang selisih kurang.
- **Cetak Berita Acara Stok Opname:** Format resmi berita acara lengkap dengan tanda tangan Kepala Sekolah dan Pengurus Barang.

### 6. Laporan Rekapitulasi Persediaan (Audit Ready)
- **Filter Fleksibel:** 1 Tahun Anggaran Penuh, Semester (1/2), Triwulan (I/II/III/IV), atau Bulanan (Januari - Desember).
- **Tabel Standar Pemeriksa:** No | Kode | Nama Barang | Satuan | Saldo Awal (Qty & Nilai) | Penambahan (Qty & Nilai) | Pengurangan (Qty & Nilai) | Saldo Akhir (Qty & Nilai).
- **Kotak Rekonsiliasi & Rumus:** Rumus saldo akhir dan validasi seimbang (100% klop).
- **Kop Surat & Tanda Tangan Resmi:** Kop surat resmi SMPN 1 Penajam Paser Utara, tanda tangan Kepala Sekolah dan Pengurus Barang lengkap beserta NIP dan Pangkat/Golongan.
- **Ekspor:** Cetak PDF format landscape ramah printer hitam-putih dan unduh berkas spreadsheet **Excel (.xls)**.

### 7. Laporan Rincian Persediaan (Kartu Mutasi Barang)
- **Kartu Stok Kronologis:** Urut tanggal kronologis untuk setiap barang, menampilkan baris Saldo Awal, transaksi masuk, pemakaian FIFO, subtotal mutasi, dan saldo akhir.
- **Konsistensi Data:** Saldo akhir pada laporan rincian 100% sama dengan Laporan Rekapitulasi Persediaan.
- **Ekspor:** Cetak PDF landscape dan ekspor Excel (.xls).

### 8. Pengaturan & Cadangan Data
- **Identitas Sekolah & Kop Surat:** Pengaturan nama sekolah, NPSN, alamat, kontak, dan logo.
- **Pejabat Penandatangan:** Nama, NIP, dan pangkat Kepala Sekolah & Pengurus Barang.
- **Tutup Buku & Rollover Saldo Awal:** Mengunci tahun anggaran menjadi Read-Only, serta fitur 1-klik untuk menyalin saldo akhir tahun ini menjadi Saldo Awal tahun anggaran berikutnya secara otomatis.
- **Keamanan:** Ganti password akun operator.
- **Cadangan Data (Backup/Restore):** Unduh berkas cadangan JSON dan pemulihan data (restore) sewaktu-waktu.
- **Log Aktivitas:** Audit trail lengkap (waktu, user, aksi, modul, detail aktivitas).

---

## 📁 Struktur Berkas

```
persediaan_v01/
├── index.html                                 # Aplikasi Utama (Single Page Application)
├── jalankan_aplikasi.bat                      # Peluncur Cepat Browser
├── server.bat                                 # Peluncur Server Web PHP Lokal
├── PRD Aplikasi Persediaan Barang Habis Pakai.md
├── README.md
├── assets/
│   └── logo.svg                               # Lambang Resmi SMPN 1 PPU
├── css/
│   ├── style.css                              # Sistem Desain, Layout & Komponen Modern
│   └── print.css                              # Tata Letak Cetak Resmi Standar Audit BPK / Inspektorat
└── js/
    ├── db.js                                  # Data Layer, LocalStorage & Demo Data SMPN 1 PPU
    ├── fifo.js                                # Mesin Kalkulasi Lapisan Harga FIFO & Mutasi
    ├── auth.js                                # Autentikasi, SHA-256, Lockout 5 Menit & Sesi 30 Menit
    ├── dashboard.js                           # Visualisasi Statistik & Ringkasan Eksekutif
    ├── barang.js                              # CRUD Master Data Barang & Cek Integritas
    ├── masuk.js                               # CRUD Persediaan Masuk (Saldo Awal & Pembelian)
    ├── keluar.js                              # CRUD Persediaan Keluar (Pemakaian FIFO)
    ├── opname.js                              # Stok Opname Fisik & Penyesuaian Otomatis
    ├── laporan.js                             # Generator Laporan Rekapitulasi & Kartu Mutasi
    ├── pengaturan.js                          # Pengaturan Sekolah, Tutup Buku & Backup
    └── app.js                                 # Router, Toast Notifikasi & Modal Handler
```
