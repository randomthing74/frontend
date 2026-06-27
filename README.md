
1. **Website** – antarmuka pengguna untuk input pasien, monitoring real‑time, dan unduh data.
2. **Cloudflare Worker** – backend API untuk menyimpan data, perintah, dan autentikasi.
3. **ESP32** – jembatan WiFi yang meneruskan data dari ATmega ke Worker, serta polling perintah.
4. **ATmega2560** – mikrokontroler utama yang membaca sensor, menjalankan Fuzzy Logic, dan mengendalikan motor stepper.

---

## ✨ Fitur Utama

- **🏠 Home** – About Us dan deskripsi sistem.
- **📊 Hasil Monitoring** – Lihat data terapi terbaru, refresh, dan download Excel historis dengan rentang tanggal.
- **🧠 Fuzzy** – Perhitungan Fuzzy Mamdani lengkap (fuzzifikasi, implikasi, agregasi, defuzzifikasi) dan download grafik keanggotaan.
- **🎮 Mulai Terapi** – Form data pasien → klik “Mulai Monitoring” → perintah dikirim ke robot → data real‑time ditampilkan.
- **📱 Responsif** – Sidebar navigasi, animasi futuristik, dan tampilan mobile friendly.
- **📥 Download** – Data historis dan perhitungan fuzzy dalam format Excel, serta grafik fuzzy PNG.

---

## 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Mikrokontroler | Arduino Mega 2560 WiFi (ATmega2560 + ESP8266) |
| Komunikasi nirkabel | ESP32 (HTTP/1.1) |
| Backend | Cloudflare Workers (JavaScript) |
| Database | Cloudflare KV Storage |
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Grafik | Chart.js, Canvas API |
| Spreadsheet | SheetJS (XLSX) |
| Kontrol | Fuzzy Logic Mamdani (pada ATmega dan frontend) |

---

## 📁 Struktur Folder Frontend (`PASIEN-WEB-BACKUP`)
