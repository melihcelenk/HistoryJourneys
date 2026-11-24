# Faz 2 — Veri modeli, SQLite ve yaklaşık 50 figürün içeriği

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

İçeriğin biçimi, kuralları ve deposu kurulur; ana hat ve ek hatların figürleri üretilir. Bitince uygulama, repodaki içerik dosyalarından derlenen bir SQLite veritabanını tarayıcıda okur.

## Problem

- Kartlar için hazır veri yok: üç cümlelik özet, eylem, neden ve sonuç hiçbir açık veri setinde bulunmuyor (C1).
- İnsan onayı olmadığı için her bilginin kaynağı tutulmalı (CG-8, DR-5).

## Çözüm

- **Şema:** `src/domain/contentSchema.ts`: figür, eylem, yolculuk durağı, ilişki, kavram, kaynak, hat.
- **Kural seti:** `content/rules/RULESET.md` (sürümlü, CG-2); her kart modelini, kural seti sürümünü ve tarihini taşır (CG-4).
- **Derleme:** `scripts/build-db.ts` içerik dosyalarını denetler ve `public/data/hj.sqlite` üretir; bozuk içerikte durur.
- **Depo:** `ContentRepository` arayüzü; ilk uygulaması sql.js ile SQLite. Sonra başka bir depoyla değiştirilebilir.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 2.1 | İçerik şeması ve kural seti yazılır. | 🟢 Tamamlandı |
| 2.2 | İçerik dosyalarından SQLite veritabanı derlenir. | 🟢 Tamamlandı |
| 2.3 | Tarayıcıda SQLite okuyan veri deposu yazılır. | 🟢 Tamamlandı |
| 2.4 | Yaklaşık 50 figürün kartları kural setine göre üretilir. | 🟢 Tamamlandı |
| 2.5 | Doğum ve ölüm yılları Wikidata ile karşılaştırılır. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] `npm run db:build` çalıştırılır; figür, ilişki ve yer sayıları yazdırılır.
- [x] Bir içerik dosyasında var olmayan bir figüre bağlantı verilir; derleme hata ile durur.

## Kalan

- Kartlar yapay zekâ ile üretildi ve insan onayından geçmedi; eylem ayrıntıları kaynakla satır satır karşılaştırılmadı (S5).
- Wikidata karşılaştırmasında 4 figürün yılı kaynaklar arasında farklı, 2 figür eşleştirilemedi (S5).

## Ayrıntılar

### 2.1 — İçerik şeması ve kural seti yazılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartlar için hazır veri yok: üç cümlelik özet, eylem, neden ve sonuç hiçbir açık veri setinde bulunmuyor (C1).
- **Çözüm:** İçerik şeması ve kural seti yazılır.
- **Dosyalar:** `src/domain/contentSchema.ts`, `content/rules/RULESET.md`
- **Testler:** `tests/unit/data.test.ts`, `tests/unit/contentIntegrity.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 2.2 — İçerik dosyalarından SQLite veritabanı derlenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartlar için hazır veri yok: üç cümlelik özet, eylem, neden ve sonuç hiçbir açık veri setinde bulunmuyor (C1).
- **Çözüm:** İçerik dosyalarından SQLite veritabanı derlenir.
- **Dosyalar:** `scripts/build-db.ts`, `src/data/dbSchema.ts`
- **Testler:** `tests/unit/contentIntegrity.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 2.3 — Tarayıcıda SQLite okuyan veri deposu yazılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartlar için hazır veri yok: üç cümlelik özet, eylem, neden ve sonuç hiçbir açık veri setinde bulunmuyor (C1).
- **Çözüm:** Tarayıcıda SQLite okuyan veri deposu yazılır.
- **Dosyalar:** `src/data/ContentRepository.ts`, `src/data/SqliteContentRepository.ts`
- **Testler:** `tests/unit/data.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 2.4 — Yaklaşık 50 figürün kartları kural setine göre üretilir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartlar için hazır veri yok: üç cümlelik özet, eylem, neden ve sonuç hiçbir açık veri setinde bulunmuyor (C1).
- **Çözüm:** Yaklaşık 50 figürün kartları kural setine göre üretilir.
- **Dosyalar:** `content/figures/*.json`, `content/lines.json`, `content/relation-types.json`
- **Testler:** Derleme denetimi (şema, bağlantılar, yer tutarlılığı)
- **Durum:** 🟢 Tamamlandı.

### 2.5 — Doğum ve ölüm yılları Wikidata ile karşılaştırılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartlar için hazır veri yok: üç cümlelik özet, eylem, neden ve sonuç hiçbir açık veri setinde bulunmuyor (C1).
- **Çözüm:** Doğum ve ölüm yılları Wikidata ile karşılaştırılır.
- **Dosyalar:** `scripts/verify-wikidata.ts`
- **Testler:** Betiğin raporu
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Kartlar yapay zekâ ile üretildi ve insan onayından geçmedi; eylem ayrıntıları kaynakla satır satır karşılaştırılmadı (S5).
- Wikidata karşılaştırmasında 4 figürün yılı kaynaklar arasında farklı, 2 figür eşleştirilemedi (S5).

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 2
- `docs/requirements/history-journeys.md`
