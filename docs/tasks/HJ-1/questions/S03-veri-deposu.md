---
id: S3
status: open
decider:
priority: major
asked: 2026-11-24
related: [D6, DR-1, DR-4]
---
# S3 — SQLite veritabanı nerede çalışsın?

**Mevcut durum:** İçerik repodaki JSON dosyalarında durur; derleme bunlardan bir SQLite dosyası üretir ve uygulama bu dosyayı tarayıcıda (sql.js ile) okur. Sunucu yoktur.

**Soru:** Veritabanının tarayıcıda çalışması şimdilik uygun mu?

## Bağlam

"Şimdilik SQLite kullanabilirsin, sonra değiştiririz" demiştin (T4). Kullanıcı verisi tutulmadığı (D6) için
veritabanında yalnız içerik var: 50 figür, 132 ilişki, 94 yer, 124 eylem, 27 kavram; dosya yaklaşık 370 KB.

| Katman | Dosya |
|---|---|
| İçeriğin kaynağı (elle düzeltilebilir, PR ile gelir) | `content/figures/*.json` |
| Denetim ve derleme | `scripts/build-db.ts` → `public/data/hj.sqlite` |
| Uygulamanın gördüğü arayüz | `src/data/ContentRepository.ts` |
| Bugünkü uygulaması | `src/data/SqliteContentRepository.ts` |

Ne olur: Uygulamanın geri kalanı yalnız `ContentRepository` arayüzünü bilir. Depo değişirse tek dosya değişir.

## Seçenekler

### A — SQLite tarayıcıda (bugünkü durum) ⭐ önerilen

- ✅ Sunucu yok: statik barındırma, çevrimdışı çalışma, Store paketi için hazır
- ✅ Gerçek SQL: ileride arama ve süzme sorguları yazılabilir
- ❌ sql.js motoru ilk açılışta yaklaşık 660 KB ek indirme getirir

### B — Derlemede JSON'a çevir, tarayıcıda veritabanı olmasın

- ✅ İlk açılış daha hafif
- ❌ "SQLite kullan" isteğinden uzaklaşır; sorgular elle yazılmış süzgeçlere döner

### C — Sunucuda veritabanı ve API

- ✅ İçerik çok büyüdüğünde ya da kullanıcı verisi geldiğinde gerekecek yapı
- ❌ Sunucu, barındırma maliyeti ve çevrimdışı çalışmanın kaybı; bugün gereksiz

## Öneri

**A**: Bugünkü boyut için en basit ve en taşınabilir çözüm. Kullanıcı hesabı ya da binlerce figür gündeme gelince C'ye
geçilir; arayüz buna hazır.

## Cevap

## Sonuç

**Geçici karar (T4 gereği soru açık):** A uygulandı.
