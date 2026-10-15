# PRD – Aplikasi Persediaan Barang Habis Pakai (Stock Opname)

Dokumen Kebutuhan Produk • Versi 1.0 • Oktober 2026 • Pemilik: SMPN 1 PPU

## 1. Ringkasan Produk

Aplikasi web untuk mencatat persediaan barang habis pakai sekolah: master barang, persediaan masuk (saldo awal dan pembelian), persediaan keluar (pemakaian), stok opname, serta laporan persediaan dan laporan rincian persediaan per tahun anggaran.

**Tujuan:**

- Menggantikan pencatatan manual/Excel dengan pencatatan yang akurat dan terstruktur.
- Menghasilkan laporan persediaan (saldo awal, penambahan, pengurangan, saldo akhir) yang siap dipakai untuk pelaporan dan pemeriksaan.
- Menjamin stok tidak pernah minus dan nilai persediaan dihitung otomatis.

**Pengguna:** satu akun operator sekolah (pengurus barang). Laporan dicetak atau diekspor untuk Kepala Sekolah dan tim pemeriksa.

## 2. Perbaikan dan Penambahan yang Direkomendasikan

Berikut penyempurnaan dari kebutuhan awal yang sudah diterapkan di dokumen ini:

| No | Kebutuhan Awal | Perbaikan yang Diperlukan | Alasan |
| --- | --- | --- | --- |
| 1 | Tidak ada menu Stok Opname, padahal tujuan aplikasi adalah stock opname | Tambah menu **Stok Opname** (hitung fisik vs catatan, selisih, penyesuaian) | Inti dari aplikasi; tanpa ini selisih fisik tidak bisa dicatat |
| 2 | Pemakaian meminta input harga satuan manual | Harga satuan pemakaian **dihitung otomatis** dengan metode **FIFO** (atau rata-rata tertimbang, dipilih satu) | Nilai pemakaian harus konsisten dengan harga perolehan; input manual rawan salah |
| 3 | Total diisi manual | Total = Qty × Harga Satuan, **otomatis dan tidak bisa diedit** | Mencegah kesalahan hitung |
| 4 | Satu form satu barang | Gunakan struktur **header–detail**: satu No. BAST dapat memuat banyak barang | Satu BAST biasanya berisi beberapa item |
| 5 | Tabel barang hanya No, Nama, Satuan | Tambah **Kode Barang**, **Kategori** (opsional), **Stok Minimum**; No. Urut dibuat otomatis | Memudahkan pencarian dan peringatan stok menipis |
| 6 | Hapus data bebas | Barang yang sudah punya transaksi **tidak boleh dihapus** (nonaktifkan); hapus transaksi masuk ditolak bila membuat stok minus | Menjaga integritas data |
| 7 | Pemakaian tidak divalidasi | Qty pemakaian **tidak boleh melebihi stok tersedia** pada tanggal tersebut | Mencegah stok minus |
| 8 | Pilihan Tahun hanya di login | Tahun menjadi **periode kerja**: seluruh data difilter per tahun; **Saldo Awal tahun berikutnya otomatis diambil dari saldo akhir tahun sebelumnya** (dapat dikunci/tutup buku) | Kesinambungan antar tahun |
| 9 | Login satu akun | Password disimpan **ter-hash**, ada ganti password, batas percobaan login, dan session timeout | Keamanan dasar. Catatan: kredensial awal tidak boleh ditulis permanen di kode |
| 10 | Laporan belum didefinisikan | Definisikan format, filter (bulan/semester/tahun), ekspor **PDF dan Excel**, serta kolom tanda tangan | Laporan siap pakai |
| 11 | Tidak ada identitas sekolah | Tambah menu **Pengaturan**: nama sekolah, alamat, kepala sekolah + NIP, pengurus barang + NIP | Dipakai pada kop dan tanda tangan laporan |
| 12 | Tidak ada riwayat perubahan | Tambah **log aktivitas** (siapa mengubah apa dan kapan) dan fitur **backup** data | Akuntabilitas dan keamanan data |
| 13 | Tidak ada ringkasan | Tambah **Dashboard** sederhana: total nilai persediaan, barang stok menipis, transaksi terakhir | Gambaran cepat setelah login |

## 3. Ruang Lingkup

**Termasuk:** login dan pemilihan tahun, dashboard, master barang, persediaan masuk (saldo awal, pembelian), persediaan keluar (pemakaian), stok opname, laporan persediaan, laporan rincian persediaan, pengaturan, ekspor PDF/Excel.

**Tidak termasuk (tahap ini):** integrasi dengan sistem keuangan/SIPLah, barcode/scanner, aplikasi mobile native, multi-sekolah, multi-pengguna dan pembagian hak akses (role).

## 4. Struktur Menu

1. Dashboard
2. Tabel Barang
3. Persediaan Masuk → Saldo Awal | Pembelian
4. Persediaan Keluar → Pemakaian
5. Stok Opname
6. Laporan Persediaan
7. Laporan Rincian Persediaan
8. Pengaturan (identitas sekolah, ganti password, backup, log aktivitas)

## 5. Kebutuhan Fungsional

### 5.1 Halaman Login

- Field: **Username**, **Password**, **Tahun** (dropdown 2026–2045).
- Akun awal sesuai permintaan pemilik: username `smpn1PPU`, password `30402057`. Password wajib disimpan ter-hash dan **disarankan diganti setelah login pertama**.
- Tahun yang dipilih menjadi periode kerja dan ditampilkan di header aplikasi; dapat diganti tanpa login ulang.
- Pesan error umum bila gagal login (tidak menyebutkan mana yang salah); kunci sementara 5 menit setelah 5 kali gagal.
- Session berakhir otomatis setelah 30 menit tidak aktif.

### 5.2 Tabel Barang (CRUD)

| Field | Aturan |
| --- | --- |
| No. Urut | Otomatis, berurutan |
| Kode Barang | Unik, opsional diisi otomatis |
| Nama Barang | Wajib, unik (tidak boleh duplikat) |
| Satuan | Wajib (contoh: rim, pcs, box, buah, lusin) |
| Stok Minimum | Opsional, angka ≥ 0 |

- **Create/Update:** form modal dengan validasi.
- **Read:** tabel dengan pencarian, urut, dan paginasi; kolom tambahan stok saat ini (read-only).
- **Delete:** hanya jika belum ada transaksi; jika sudah ada, ditawarkan opsi Nonaktifkan.

### 5.3 Persediaan Masuk (CRUD)

**Sub menu: Saldo Awal** (stok yang terbawa pada awal tahun) dan **Pembelian**.

**Header:** No. BAST, Tanggal BAST, Jenis (Saldo Awal / Pembelian), Keterangan. **Detail (bisa banyak baris):** Nama Barang (dropdown dari Tabel Barang, dengan pencarian), Qty, Harga Satuan, Total (otomatis).

Aturan:

- No. BAST unik per tahun dan per jenis.
- Tanggal BAST harus berada dalam tahun periode yang dipilih; Saldo Awal otomatis bertanggal 1 Januari.
- Qty > 0 (boleh desimal bila satuan mengizinkan), Harga Satuan ≥ 0.
- Saldo Awal tahun berikutnya dapat dibuat otomatis dari saldo akhir tahun sebelumnya.
- Edit/hapus ditolak bila menyebabkan stok minus pada pemakaian yang sudah tercatat; sistem menampilkan alasannya.
- Tampilan daftar: tabel dengan filter tanggal, pencarian No. BAST/nama barang, dan total nilai.

### 5.4 Persediaan Keluar – Pemakaian (CRUD)

**Header:** No. BAST, Tanggal BAST, Keterangan (misalnya unit/bagian peminta). **Detail:** Nama Barang, Qty, Harga Satuan (otomatis, hanya tampil), Total (otomatis).

Aturan:

- Dropdown barang menampilkan stok tersedia.
- Qty tidak boleh melebihi stok tersedia pada tanggal pemakaian.
- Harga satuan dihitung otomatis dengan metode **FIFO** (pemakaian mengambil dari lapisan pembelian tertua terlebih dahulu). Bila satu pemakaian mencakup dua lapisan harga, ditampilkan sebagai dua baris rincian.
- Edit/hapus data pemakaian menghitung ulang nilai dan saldo secara otomatis.

### 5.5 Stok Opname

- Pengguna membuat sesi opname dengan tanggal dan nomor berita acara.
- Sistem menampilkan daftar barang beserta **stok sistem**; pengguna mengisi **stok fisik**.
- Sistem menghitung **selisih** (fisik − sistem) dan nilainya.
- Selisih dapat disetujui menjadi **penyesuaian**: selisih lebih dicatat sebagai persediaan masuk (penyesuaian), selisih kurang dicatat sebagai persediaan keluar (penyesuaian), disertai keterangan wajib.
- Hasil opname dapat dicetak sebagai Berita Acara Stok Opname.

### 5.6 Laporan Persediaan

Rekap per barang untuk periode terpilih (bulan, semester, atau tahun):

| No | Nama Barang | Satuan | Saldo Awal (Qty / Nilai) | Penambahan (Qty / Nilai) | Pengurangan (Qty / Nilai) | Saldo Akhir (Qty / Nilai) |
| --- | --- | --- | --- | --- | --- | --- |

- Baris total nilai di bagian bawah.
- Kop sekolah, periode, tanggal cetak, dan tanda tangan Kepala Sekolah serta Pengurus Barang.
- Ekspor PDF dan Excel.

**Prinsip keterbacaan untuk tim pemeriksa:**

- Satu halaman = satu tabel utama, orientasi landscape, huruf minimal 10 pt, cetak hitam-putih tetap jelas (tanpa bergantung warna).
- Setiap halaman memuat kop sekolah, judul laporan, periode, nomor halaman ("Halaman x dari y"), dan tanggal cetak.
- Nilai ditulis dalam format Rp dengan pemisah ribuan; kolom Qty dan Nilai dipisahkan jelas untuk Saldo Awal, Penambahan, Pengurangan, dan Saldo Akhir.
- Rumus saldo dicantumkan di bawah tabel: Saldo Akhir = Saldo Awal + Penambahan − Pengurangan; metode penilaian (FIFO) dicantumkan sebagai catatan.
- Baris total pada setiap kolom nilai, dan ada kotak rekonsiliasi yang menunjukkan total saldo akhir sama dengan total pada Laporan Rincian.

### 5.7 Laporan Rincian Persediaan

Kartu persediaan (mutasi) per barang, urut tanggal:

| Tanggal | No. BAST | Uraian / Keterangan | Masuk (Qty, Harga, Total) | Keluar (Qty, Harga, Total) | Saldo (Qty, Nilai) |
| --- | --- | --- | --- | --- | --- |

- Filter: barang (satu atau semua), rentang tanggal, jenis transaksi.
- Saldo berjalan dihitung otomatis; saldo akhir harus sama dengan Laporan Persediaan.
- Ekspor PDF dan Excel.

**Prinsip keterbacaan untuk tim pemeriksa:**

- Setiap barang tampil sebagai satu blok tersendiri (nama barang, satuan), dengan baris Saldo Awal di atas dan baris subtotal Masuk, Keluar, dan Saldo Akhir di bawah.
- Setiap baris transaksi mencantumkan No. BAST dan Tanggal BAST sehingga mudah ditelusuri ke dokumen asli.
- Pemakaian yang mengambil dari dua lapisan harga FIFO ditampilkan sebagai baris terpisah dengan harga masing-masing.
- Penyesuaian hasil stok opname diberi label jelas "Penyesuaian Opname" beserta nomor berita acaranya.
- Hasil dapat dicetak per barang maupun seluruh barang dengan format dan tata letak yang sama seperti Laporan Persediaan.

## 6. Aturan Bisnis Utama

1. Stok tidak boleh minus pada tanggal mana pun.
2. Nilai persediaan dihitung dengan metode FIFO; metode tidak diubah di tengah tahun.
3. Seluruh data terikat pada tahun periode; data tahun lain tidak ikut terhitung.
4. Saldo akhir tahun = Saldo awal + Penambahan − Pengurangan.
5. Tahun yang sudah ditutup bersifat read-only kecuali dibuka kembali oleh admin.
6. Semua perubahan data tercatat pada log aktivitas.

## 7. Kebutuhan Non-Fungsional

- **Keamanan:** password ter-hash (bcrypt/argon2), HTTPS, proteksi SQL injection/XSS/CSRF.
- **Kinerja:** halaman utama dimuat < 3 detik; laporan untuk 1.000 barang dan 10.000 transaksi dihasilkan < 10 detik.
- **Kompatibilitas:** aplikasi dijalankan \*\*online\*\* (web hosting) dan diakses melalui browser Chrome, Edge, atau Firefox terbaru; tampilan responsif untuk laptop dan tablet. Server hosting wajib memakai HTTPS dan backup otomatis harian.
- **Backup:** ekspor/backup data manual dan otomatis harian.
- **Bahasa:** Bahasa Indonesia; format tanggal dd/mm/yyyy; mata uang Rupiah (Rp 1.234.567).

## 8. Model Data (Garis Besar)

| Tabel | Isi Utama |
| --- | --- |
| users | id, username, password\_hash, nama, role |
| barang | id, kode, nama, satuan, stok\_minimum, aktif |
| tahun\_periode | tahun, status (buka/tutup) |
| masuk\_header | id, tahun, jenis (saldo\_awal/pembelian/penyesuaian), no\_bast, tgl\_bast, keterangan |
| masuk\_detail | id, header\_id, barang\_id, qty, harga\_satuan, total |
| keluar\_header | id, tahun, jenis (pemakaian/penyesuaian), no\_bast, tgl\_bast, keterangan |
| keluar\_detail | id, header\_id, barang\_id, qty, harga\_satuan, total |
| opname\_header / opname\_detail | tanggal, no\_berita\_acara, barang, stok\_sistem, stok\_fisik, selisih |
| pengaturan | identitas sekolah, pejabat penandatangan |
| log\_aktivitas | user, aksi, tabel, waktu |

## 9. Kriteria Penerimaan

1. Login hanya berhasil dengan username, password, dan tahun yang valid; tahun dapat dipilih dari 2026 sampai 2045.
2. CRUD Barang, Persediaan Masuk, dan Pemakaian berfungsi dengan seluruh validasi pada dokumen ini.
3. Pemakaian melebihi stok ditolak dengan pesan jelas.
4. Total dan harga pemakaian dihitung otomatis dan akurat sesuai FIFO.
5. Saldo akhir pada Laporan Persediaan sama dengan saldo akhir pada Laporan Rincian untuk setiap barang.
6. Laporan dapat diekspor ke PDF dan Excel dengan kop dan tanda tangan.
7. Opname menghasilkan penyesuaian yang tercermin pada laporan.

## 10. Rencana Rilis

| Tahap | Cakupan | Estimasi |
| --- | --- | --- |
| 1 | Login, Tabel Barang, Pengaturan | 1 minggu |
| 2 | Persediaan Masuk dan Pemakaian (termasuk FIFO dan validasi stok) | 2 minggu |
| 3 | Laporan Persediaan dan Rincian, ekspor PDF/Excel | 1,5 minggu |
| 4 | Stok Opname, Dashboard, log aktivitas, backup | 1,5 minggu |
| 5 | UAT, deployment online, serah terima | 1 minggu |

## 11. Keputusan Pemilik Produk

| No | Pertanyaan | Keputusan |
| --- | --- | --- |
| 1 | Metode penilaian persediaan | **FIFO** |
| 2 | Jumlah pengguna / hak akses | **Satu akun saja**, tidak perlu multi-pengguna atau role |
| 3 | Format laporan | Tidak ada format baku dari dinas; yang utama **laporan jelas dan mudah dibaca tim pemeriksa** (lihat Bagian 5.6 dan 5.7) |
| 4 | Lingkungan | **Online** (web hosting) |
