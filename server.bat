@echo off
title Web Server Lokal - Aplikasi Persediaan SMPN 1 PPU
echo =========================================================================
echo       SERVER LOKAL APLIKASI PERSEDIAAN BARANG HABIS PAKAI
echo                  SMP NEGERI 1 PENAJAM PASER UTARA
echo =========================================================================
echo.
echo Menjalankan server web lokal pada http://localhost:8080 ...
start "" "http://localhost:8080"
"C:\newappraporsmp2025\php\php.exe" -S localhost:8080
pause
