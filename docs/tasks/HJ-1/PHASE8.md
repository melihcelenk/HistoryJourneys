# Faz 8 — PixiJS ile boyalı oyun haritası

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Harita, bir strateji oyununun kampanya haritası gibi yeniden çizilir. Bitince ayarlardan boyalı harita seçilebilir: kabartmalı arazi, dalgalı deniz, hareketli işaretler.

## Problem

- Kullanıcının hedefi: ilk *Medieval: Total War* kampanya haritasındaki gibi, ne aşırı sade ne aşırı ayrıntılı bir harita (T1).
- MapLibre sürümü bu hissi tam vermez; kullanıcı süre kalırsa PixiJS sürümünü de istedi (T4).

## Çözüm

- **Çizim:** PixiJS ve d3-geo: aynı Natural Earth verisi, boyalı doku ve kabartma gölgesiyle.
- **Arayüz:** Aynı `MapView` arayüzü; uygulamanın geri kalanı değişmez.
- **Seçim:** Harita türü ayarlardan ve adresten seçilir; desteklenmeyen cihazda MapLibre'ye düşer.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 8.1 | PixiJS ile MapView arayüzü uygulanır. | 🟢 Tamamlandı |
| 8.2 | Boyalı arazi, deniz ve kabartma çizilir. | 🟢 Tamamlandı |
| 8.3 | Harita türü seçimi eklenir. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Ayarlardan "Boyalı harita" seçilir; harita oyun haritası gibi çizilir.
- [x] Rota ve zaman çizelgesi aynı şekilde çalışır.

## Kalan

- Gerçek telefonlarda hız ölçülmedi; testler başsız Chromium'da (yazılımsal WebGL) çalıştı (S2).

## Ayrıntılar

### 8.1 — PixiJS ile MapView arayüzü uygulanır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının hedefi: ilk *Medieval: Total War* kampanya haritasındaki gibi, ne aşırı sade ne aşırı ayrıntılı bir harita (T1).
- **Çözüm:** PixiJS ile MapView arayüzü uygulanır.
- **Dosyalar:** `src/map/PixiMapView.ts`
- **Testler:** `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 8.2 — Boyalı arazi, deniz ve kabartma çizilir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının hedefi: ilk *Medieval: Total War* kampanya haritasındaki gibi, ne aşırı sade ne aşırı ayrıntılı bir harita (T1).
- **Çözüm:** Boyalı arazi, deniz ve kabartma çizilir.
- **Dosyalar:** `src/map/pixi/terrainPainter.ts`, `src/map/pixi/projection.ts`, `src/map/pixi/Camera.ts`, `scripts/build-relief.py`
- **Testler:** Ekran görüntüsü incelemesi
- **Durum:** 🟢 Tamamlandı.

### 8.3 — Harita türü seçimi eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının hedefi: ilk *Medieval: Total War* kampanya haritasındaki gibi, ne aşırı sade ne aşırı ayrıntılı bir harita (T1).
- **Çözüm:** Harita türü seçimi eklenir.
- **Dosyalar:** `src/ui/dialogs/InfoDialogs.tsx`, `src/map/createMapView.ts`
- **Testler:** `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Gerçek telefonlarda hız ölçülmedi; testler başsız Chromium'da (yazılımsal WebGL) çalıştı (S2).

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 8
- `docs/requirements/history-journeys.md`
