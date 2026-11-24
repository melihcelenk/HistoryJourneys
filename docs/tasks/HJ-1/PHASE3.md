# Faz 3 — İki figür arasında rota hesaplayan motor

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Seçilen iki figür arasında, ilişkiler üzerinden anlamlı ve birbirinden farklı rotalar hesaplanır. Bitince her rota bir açıklama, her adım bir ilişki adı taşır.

## Problem

- Genel bir bilgi grafiğinde herkes birkaç adımda birbirine bağlanır; en kısa yol çoğu zaman anlamsızdır (C3).
- Kullanıcı rotayı değiştirebilmek istiyor: birden çok seçenek sunulmalı (FR-8).

## Çözüm

- **Graf:** Figürler düğüm, ilişkiler ağırlıklı kenar; ağırlıklar `content/relation-types.json` içinde sürümlü veri (FR-28).
- **Seçenekler:** Farklı ağırlık profilleriyle (saltanat, aile, hizmet ve fikir) ayrı rotalar; aynı çıkanlar elenir.
- **Kronoloji:** Rota zamanda tek yönde ilerler; geri dönen adımlar elenir (FR-12).

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 3.1 | İlişkilerden ağırlıklı graf kurulur. | 🟢 Tamamlandı |
| 3.2 | Kronolojiye uyan en kısa rota hesaplanır. | 🟢 Tamamlandı |
| 3.3 | Farklı profillerle alternatif rotalar ve açıklamaları üretilir. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk ve Fatih seçilir; en az iki farklı rota listelenir.
- [x] Her adımın altında ilişki adı okunur.

## Kalan

- Yok.

## Ayrıntılar

### 3.1 — İlişkilerden ağırlıklı graf kurulur.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Genel bir bilgi grafiğinde herkes birkaç adımda birbirine bağlanır; en kısa yol çoğu zaman anlamsızdır (C3).
- **Çözüm:** İlişkilerden ağırlıklı graf kurulur.
- **Dosyalar:** `src/domain/routeEngine.ts`
- **Testler:** `tests/unit/routeEngine.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 3.2 — Kronolojiye uyan en kısa rota hesaplanır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Genel bir bilgi grafiğinde herkes birkaç adımda birbirine bağlanır; en kısa yol çoğu zaman anlamsızdır (C3).
- **Çözüm:** Kronolojiye uyan en kısa rota hesaplanır.
- **Dosyalar:** `src/domain/routeEngine.ts`
- **Testler:** `tests/unit/routeEngine.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 3.3 — Farklı profillerle alternatif rotalar ve açıklamaları üretilir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Genel bir bilgi grafiğinde herkes birkaç adımda birbirine bağlanır; en kısa yol çoğu zaman anlamsızdır (C3).
- **Çözüm:** Farklı profillerle alternatif rotalar ve açıklamaları üretilir.
- **Dosyalar:** `src/domain/routeEngine.ts`
- **Testler:** `tests/unit/routeEngine.test.ts`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Yok.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 3
- `docs/requirements/history-journeys.md`
