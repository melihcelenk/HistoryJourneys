# Faz 6 — Öğrenme oyunu

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Okunanların akılda kalması için aynı veriden küçük oyunlar eklenir. Bitince komut çubuğundan oyun açılır, sorular rotadaki figürlerden gelir ve sonunda puan gösterilir.

## Problem

- Kartları okumak tek başına kalıcı değil; gereksinim en az bir öğrenme oyunu istiyor (FR-21).
- Kullanıcı verisi tutulmuyor (D6): puan yalnız o oturumda gösterilir.

## Çözüm

- **Sıralama:** Figürleri kronolojik sıraya dizme.
- **Eşleştirme:** Bir eylemi doğru nedeniyle eşleştirme.
- **Üretim:** Sorular saf işlevlerle veriden üretilir; rastgelelik tohumlanabilir (test için).

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 6.1 | Oyun soruları veriden üretilir. | 🟢 Tamamlandı |
| 6.2 | Sıralama ve eşleştirme oyunlarının arayüzü yapılır. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Bir rota açıkken Oyun'a basılır; sıralama oyunu rotadaki figürlerle açılır.
- [x] Tur bitince puan ve doğru sıra görünür.

## Kalan

- Yok.

## Ayrıntılar

### 6.1 — Oyun soruları veriden üretilir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartları okumak tek başına kalıcı değil; gereksinim en az bir öğrenme oyunu istiyor (FR-21).
- **Çözüm:** Oyun soruları veriden üretilir.
- **Dosyalar:** `src/domain/quiz.ts`
- **Testler:** `tests/unit/domain.test.ts`, `tests/unit/edgeCases.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 6.2 — Sıralama ve eşleştirme oyunlarının arayüzü yapılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kartları okumak tek başına kalıcı değil; gereksinim en az bir öğrenme oyunu istiyor (FR-21).
- **Çözüm:** Sıralama ve eşleştirme oyunlarının arayüzü yapılır.
- **Dosyalar:** `src/ui/dialogs/QuizDialog.tsx`
- **Testler:** `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Yok.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 6
- `docs/requirements/history-journeys.md`
