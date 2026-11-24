# Faz 5 — Harita (MapLibre) ve zaman çizelgesi

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Oyun ekranının sahnesi olan harita kurulur. Bitince figürlerin yolculukları ve rota haritada görünür; zaman çizelgesi oynatılınca figürler o yılda bulundukları yere gider.

## Problem

- Hazır web haritaları bugünün sınırlarını ve adlarını gösterir; tarihî bir oyunda yanlış durur ve çevrimdışı çalışmaz.
- Harita sonra PixiJS ile değişecek; geri kalan kod haritaya bağımlı olmamalı (T3).

## Çözüm

- **Veri:** Natural Earth (kamu malı) kara, göl ve nehir verisi bölgeye kırpılıp uygulamayla gelir; karo sunucusu yok.
- **Arayüz:** `MapView` arayüzü: odakla, işaretleri ve yolları göster, yıl seç. MapLibre ilk uygulaması.
- **Zaman:** Zaman çizelgesi ve oynatma; tarih Miladi ve Hicri gösterilir (FR-26).
- **Mini harita:** Köşede, görünen alanı gösteren küçük harita (FR-32).

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 5.1 | Natural Earth verisi bölgeye kırpılır ve uygulamaya eklenir. | 🟢 Tamamlandı |
| 5.2 | MapView arayüzü ve MapLibre uygulaması yazılır. | 🟢 Tamamlandı |
| 5.3 | Yolculuklar, rota ve yer işaretleri haritada gösterilir. | 🟢 Tamamlandı |
| 5.4 | Zaman çizelgesi ve takvim gösterimi eklenir. | 🟢 Tamamlandı |
| 5.5 | Mini harita eklenir. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Bir rota açılır; haritada rota üzerindeki figürlerin yerleri görünür.
- [x] Zaman çizelgesi 1609'a çekilir; I. Ahmed İstanbul'da görünür.
- [x] Oynat'a basılır; yıl ilerler, işaretler hareket eder.

## Kalan

- Tarihî sınırlar (FR-15) çizilmiyor; OpenHistoricalMap verisinin işlenmesi ayrı bir iş.

## Ayrıntılar

### 5.1 — Natural Earth verisi bölgeye kırpılır ve uygulamaya eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Hazır web haritaları bugünün sınırlarını ve adlarını gösterir; tarihî bir oyunda yanlış durur ve çevrimdışı çalışmaz.
- **Çözüm:** Natural Earth verisi bölgeye kırpılır ve uygulamaya eklenir.
- **Dosyalar:** `scripts/build-geo.ts`, `public/geo/*.json`
- **Testler:** Betiğin çıktısı
- **Durum:** 🟢 Tamamlandı.

### 5.2 — MapView arayüzü ve MapLibre uygulaması yazılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Hazır web haritaları bugünün sınırlarını ve adlarını gösterir; tarihî bir oyunda yanlış durur ve çevrimdışı çalışmaz.
- **Çözüm:** MapView arayüzü ve MapLibre uygulaması yazılır.
- **Dosyalar:** `src/map/MapView.ts`, `src/map/MapLibreMapView.ts`
- **Testler:** `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.3 — Yolculuklar, rota ve yer işaretleri haritada gösterilir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Hazır web haritaları bugünün sınırlarını ve adlarını gösterir; tarihî bir oyunda yanlış durur ve çevrimdışı çalışmaz.
- **Çözüm:** Yolculuklar, rota ve yer işaretleri haritada gösterilir.
- **Dosyalar:** `src/map/mapScene.ts`, `src/map/markerElements.ts`, `src/ui/MapStage.tsx`
- **Testler:** `tests/unit/app.test.ts`, `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.4 — Zaman çizelgesi ve takvim gösterimi eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Hazır web haritaları bugünün sınırlarını ve adlarını gösterir; tarihî bir oyunda yanlış durur ve çevrimdışı çalışmaz.
- **Çözüm:** Zaman çizelgesi ve takvim gösterimi eklenir.
- **Dosyalar:** `src/ui/CommandBar.tsx`, `src/domain/calendar.ts`
- **Testler:** `tests/unit/domain.test.ts`, `tests/unit/edgeCases.test.ts`, `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.5 — Mini harita eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Hazır web haritaları bugünün sınırlarını ve adlarını gösterir; tarihî bir oyunda yanlış durur ve çevrimdışı çalışmaz.
- **Çözüm:** Mini harita eklenir.
- **Dosyalar:** `src/ui/MiniMap.tsx`
- **Testler:** `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Tarihî sınırlar (FR-15) çizilmiyor; OpenHistoricalMap verisinin işlenmesi ayrı bir iş.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 5
- `docs/requirements/history-journeys.md`
