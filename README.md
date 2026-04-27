# 🥩 Central Kitchen — Sistem Stok & Order

Sistem pengurusan stok dan weekly order untuk Samurai Yakiniku Central Kitchen.

## Cara Deploy (GitHub + Vercel) — FREE

### LANGKAH 1: Upload ke GitHub

1. Pergi ke **github.com** → Log in atau daftar akaun baru (free)
2. Klik butang **"New"** (hijau) untuk buat repository baru
3. Namakan repo: `central-kitchen-stock`
4. Pilih **Public** → Klik **"Create repository"**
5. Klik **"uploading an existing file"**
6. **Drag & drop SEMUA fail** dalam folder `ck-app` ini ke browser
   - ⚠️ Pastikan termasuk folder `src/` dan fail `package.json`, `vite.config.js`, `index.html`, `.gitignore`
7. Klik **"Commit changes"**

### LANGKAH 2: Deploy ke Vercel

1. Pergi ke **vercel.com** → Log in dengan akaun GitHub tadi
2. Klik **"Add New Project"**
3. Pilih repo `central-kitchen-stock` → Klik **"Import"**
4. Vercel akan auto detect Vite/React — terus klik **"Deploy"**
5. Tunggu 1-2 minit... siap! ✅

### Hasilnya

Awak dapat link macam ni:
```
https://central-kitchen-stock.vercel.app
```

Share link tu dengan team — semua boleh access dari phone atau laptop!

---

## Features

- 📦 **Stok Harian** — track semua item Wagyu, Beverages, SKU CK, Gas
- ± **Adjust stok** masuk/keluar + upload gambar bukti
- ⚠️ **Alert** bila stok rendah atau habis
- 📋 **Weekly Order** — buat senarai order, tandai item diterima
- 📸 **Gambar bukti** penghantaran boleh upload terus
- 💾 Data disimpan dalam browser (localStorage)

## Development (untuk developer)

```bash
npm install
npm run dev
```
