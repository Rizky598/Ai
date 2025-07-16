# AI Chatbot Website dengan Google AI API

Sebuah website AI Chatbot yang interaktif dan responsif, dibuat menggunakan HTML, CSS, dan JavaScript murni dengan integrasi Google AI (Gemini) API. Website ini memberikan pengalaman chat dengan AI sungguhan yang dapat merespons dalam berbagai personality mode.

## 🚀 Fitur Utama

- **Real Google AI Integration**: Menggunakan Google AI (Gemini) API untuk respons AI yang sesungguhnya
- **Multiple AI Personality Modes**: 5 mode AI yang berbeda (Ramah, Profesional, Kreatif, Santai, Teknis)
- **Responsive Design**: Tampilan yang optimal di semua perangkat (desktop, tablet, mobile)
- **Real-time Chat Interface**: Interface chat yang smooth dengan typing indicator
- **Export Chat History**: Fitur untuk mengunduh riwayat percakapan dalam format JSON
- **Voice Input Simulation**: Simulasi input suara untuk pengalaman yang lebih interaktif
- **Modern UI/UX**: Desain modern dengan animasi dan transisi yang halus
- **Modal Windows**: Modal informatif untuk "Tentang" dan "Bantuan"
- **Quick Actions**: Tombol cepat untuk memulai percakapan
- **Session Management**: Sistem manajemen sesi untuk tracking percakapan

## 🎨 Teknologi yang Digunakan

- **HTML5**: Struktur website yang semantik
- **CSS3**: Styling modern dengan flexbox, grid, dan animasi
- **JavaScript ES6+**: Logika aplikasi dan integrasi API
- **Google AI (Gemini) API**: AI engine untuk respons yang cerdas
- **Font Awesome**: Icon library untuk UI yang menarik
- **Google Fonts**: Typography dengan font Inter

## 🔑 Konfigurasi API Key

Website ini menggunakan Google AI API. API Key sudah dikonfigurasi dalam file `script.js`:

```javascript
this.googleAIApiKey = "AIzaSyDS1XSeLKAJ93a4aWBC9knChDzPNnKtw3A";
```

**⚠️ Catatan Keamanan:**
- API Key saat ini terekspos di frontend untuk kemudahan testing
- Untuk production, disarankan menggunakan backend server untuk mengamankan API Key
- Pastikan API Key memiliki pembatasan yang sesuai di Google Cloud Console

## 📁 Struktur File

```
ai_website/
├── index.html          # File HTML utama
├── styles.css          # File CSS untuk styling
├── script.js           # File JavaScript untuk fungsionalitas
└── README.md           # Dokumentasi proyek
```

## 🛠️ Cara Menjalankan

### Metode 1: Langsung di Browser
1. Download atau clone repository ini
2. Buka file `index.html` di browser favorit Anda
3. Website siap digunakan!

### Metode 2: Local Server (Opsional)
```bash
# Menggunakan Python
python -m http.server 8000

# Menggunakan Node.js (jika ada npx)
npx serve .

# Menggunakan PHP
php -S localhost:8000
```

## 🌐 Deploy ke GitHub Pages

### Langkah 1: Upload ke GitHub
1. Buat repository baru di GitHub
2. Upload semua file ke repository
3. Pastikan file `index.html` ada di root directory

### Langkah 2: Aktifkan GitHub Pages
1. Masuk ke Settings repository
2. Scroll ke bagian "Pages"
3. Pilih source: "Deploy from a branch"
4. Pilih branch: "main" atau "master"
5. Pilih folder: "/ (root)"
6. Klik "Save"

### Langkah 3: Akses Website
- Website akan tersedia di: `https://username.github.io/repository-name`
- Proses deployment biasanya memakan waktu 5-10 menit

## 💡 Cara Menggunakan

1. **Pilih Mode AI**: Gunakan dropdown untuk memilih personality AI yang diinginkan
2. **Mulai Chat**: Ketik pesan di kolom input atau gunakan tombol quick action
3. **Voice Input**: Klik tombol microphone untuk simulasi voice input
4. **Export Chat**: Klik tombol "Export" untuk mengunduh riwayat percakapan
5. **Clear Chat**: Klik "Hapus Chat" untuk membersihkan percakapan
6. **Info & Bantuan**: Klik link "Tentang" atau "Bantuan" di footer

## 🎯 Mode AI yang Tersedia

- **🤗 Ramah**: Respon yang hangat dan bersahabat
- **💼 Profesional**: Respon formal dan terstruktur
- **🎨 Kreatif**: Respon inovatif dan penuh imajinasi
- **😎 Santai**: Respon casual dan santai
- **🔧 Teknis**: Respon yang fokus pada aspek teknis

## 🔧 Kustomisasi

### Mengubah Warna Theme
Edit variabel CSS di file `styles.css`:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #f4f4f4;
}
```

### Menambah Mode AI Baru
1. Tambahkan option baru di HTML:
```html
<option value="new_mode">🆕 Mode Baru</option>
```

2. Tambahkan responses di JavaScript:
```javascript
const responses = {
  new_mode: [
    "Response untuk mode baru...",
    // tambahkan response lainnya
  ]
};
```

### Mengubah Pesan Welcome
Edit bagian welcome message di file `script.js`:
```javascript
const welcomeMessage = `
  <div class="welcome-message">
    <h3>Pesan Welcome Baru!</h3>
    <p>Deskripsi baru...</p>
  </div>
`;
```

## 📱 Responsive Design

Website ini telah dioptimalkan untuk berbagai ukuran layar:
- **Desktop**: Layout penuh dengan sidebar dan main content
- **Tablet**: Layout yang disesuaikan dengan touch interface
- **Mobile**: Layout vertikal dengan navigasi yang mudah diakses

## 🎨 Easter Eggs

Website ini memiliki beberapa easter eggs yang menyenangkan:
- **Konami Code**: Ketik ↑↑↓↓←→←→BA untuk efek rainbow
- **Hover Effects**: Berbagai animasi hover pada tombol dan elemen
- **Typing Animation**: Animasi dots saat AI sedang "mengetik"

## 🐛 Troubleshooting

### Website Tidak Muncul di GitHub Pages
- Pastikan file `index.html` ada di root directory
- Cek apakah GitHub Pages sudah diaktifkan di Settings
- Tunggu 5-10 menit untuk proses deployment

### JavaScript Tidak Berfungsi
- Pastikan browser mendukung ES6+
- Cek console browser untuk error messages
- Pastikan semua file (HTML, CSS, JS) ada di direktori yang sama

### Styling Tidak Muncul
- Pastikan path CSS sudah benar di HTML
- Cek apakah ada typo di nama file
- Clear browser cache dan refresh

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:
1. Fork repository ini
2. Buat branch baru untuk fitur Anda
3. Commit perubahan Anda
4. Push ke branch
5. Buat Pull Request

## 📄 Lisensi

Proyek ini menggunakan lisensi MIT. Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini.

## 👨‍💻 Pengembang

Dibuat dengan ❤️ untuk GitHub Pages

---

**Selamat mencoba dan semoga bermanfaat!** 🚀

