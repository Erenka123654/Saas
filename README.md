# Nakit Akışı Defteri — Çok Kullanıcılı SaaS

Şirketler için nakit akışı takibi yapan, giriş sistemi olan, çoklu organizasyon (şirket/ekip)
destekli ve Excel/PDF rapor çıktısı üreten tam bir web uygulaması.

## Özellikler

- **Kimlik doğrulama**: E-posta + şifre ile kayıt/giriş (NextAuth, bcrypt ile şifrelenmiş parolalar)
- **Çoklu organizasyon (multi-tenant)**: Bir kullanıcı birden fazla şirkete/ekibe üye olabilir,
  üstteki menüden aralarında geçiş yapabilir
- **Roller**: OWNER / ADMIN / MEMBER — silme ve üye ekleme yetkileri role göre kısıtlanır
- **Nakit akışı defteri**: Gelir/gider kaydı, kategori bazlı takip, otomatik bakiye hesaplama
- **Excel dışa aktarma**: `.xlsx` formatında biçimlendirilmiş rapor (exceljs)
- **PDF dışa aktarma**: Özet + işlem dökümü içeren PDF rapor (pdfkit)
- **Ekip yönetimi**: Ayarlar sayfasından var olan kullanıcıları organizasyona ekleme

## Teknoloji

Next.js 14 (App Router) · TypeScript · PostgreSQL · Prisma ORM · NextAuth.js · Tailwind CSS

## Yerel Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Veritabanını başlatın

Docker kullanıyorsanız:

```bash
docker compose up -d
```

Veya kendi PostgreSQL veritabanınızın bağlantı adresini kullanabilirsiniz.

### 3. Ortam değişkenlerini ayarlayın

```bash
cp .env.example .env
```

`.env` dosyasını açıp `DATABASE_URL` değerini kendi veritabanınıza göre düzenleyin.
`NEXTAUTH_SECRET` için terminalde şunu çalıştırıp çıktısını yapıştırın:

```bash
openssl rand -base64 32
```

### 4. Veritabanı şemasını oluşturun

```bash
npx prisma migrate dev --name init
```

### 5. (İsteğe bağlı) Örnek verilerle doldurun

```bash
npm run prisma:seed
```

Bu komut `demo@example.com` / `demo1234` bilgileriyle giriş yapılabilecek örnek bir hesap,
bir organizasyon ve birkaç örnek işlem oluşturur.

### 6. Uygulamayı çalıştırın

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## Yayına Alma (Deploy)

Bu proje standart bir Next.js uygulamasıdır, aşağıdaki gibi herhangi bir sağlayıcıya
deploy edilebilir:

1. **Vercel** (önerilen): Depoyu GitHub'a yükleyip Vercel'e bağlayın. Proje ayarlarında
   `DATABASE_URL`, `NEXTAUTH_URL` (canlı alan adınız) ve `NEXTAUTH_SECRET` ortam
   değişkenlerini tanımlayın.
2. **Veritabanı**: Yönetilen bir PostgreSQL için [Supabase](https://supabase.com),
   [Neon](https://neon.tech) veya [Railway](https://railway.app) kullanılabilir.
3. İlk deploy sonrası, veritabanı şemasını canlıya uygulamak için:
   ```bash
   npx prisma migrate deploy
   ```

## Proje Yapısı

```
prisma/schema.prisma        Veritabanı modeli (User, Organization, Membership, Category, Transaction)
src/lib/auth.ts              NextAuth yapılandırması
src/lib/org.ts                Aktif organizasyon / rol yardımcı fonksiyonları
src/middleware.ts             Oturum korumalı rotalar
src/app/(auth)/               Giriş / Kayıt sayfaları
src/app/(dashboard)/          Korumalı uygulama sayfaları (defter, ayarlar)
src/app/api/                  Tüm API rotaları (auth, organizations, transactions, export)
```

## Sonraki Adımlar İçin Fikirler

- E-posta ile davet linki gönderme (şu anda yalnızca var olan kullanıcılar eklenebiliyor)
- Kategori yönetimi ekranı (ekleme/silme/yeniden adlandırma)
- Aylık/haftalık trend grafiği
- Tekrarlayan işlemler (ör. her ay otomatik kira gideri)
