# 💍 Sanem & Yunus - Düğün Fotoğraf Galerisi Geliştirme Rehberi

Bu doküman, QR kod üzerinden erişilecek "Mobile-First" düğün fotoğraf paylaşım uygulamasının geliştirme ve canlıya alma adımlarını içerir.

## 🛠 1. Proje Kurulumu ve Bağımlılıklar

Terminali aç ve sırasıyla aşağıdaki komutları çalıştır:

```bash
# Vite ile React projesi oluştur (Klasör adını 'wedding-app' yapabilirsin)
npm create vite@latest wedding-app -- --template react
cd wedding-app

# Tailwind CSS kurulumu
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Proje için gerekli kütüphaneleri kur
# supabase-js: Veritabanı ve Storage işlemleri
# browser-image-compression: İstemci tarafı 1MB altına düşürme
# lucide-react: Modern ikonlar
# react-masonry-css: Pinterest stili şık galeri dizilimi
# framer-motion: Yumuşak geçiş animasyonları
npm install @supabase/supabase-js browser-image-compression lucide-react react-masonry-css framer-motion