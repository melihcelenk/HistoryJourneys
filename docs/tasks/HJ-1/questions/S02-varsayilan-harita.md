---
id: S2
status: open
decider:
priority: major
asked: 2026-11-24
related: [FR-30, NFR-1, NFR-2]
---
# S2 — Uygulama hangi haritayla açılsın?

**Mevcut durum:** İki harita da hazır; uygulama boyalı haritayla (PixiJS) açılıyor, sade harita (MapLibre) ayarlardan seçilebiliyor.

**Soru:** Varsayılan harita boyalı harita olarak kalsın mı?

## Bağlam

| | Boyalı harita (PixiJS) | Sade harita (MapLibre) |
|---|---|---|
| Görünüm | Gerçek kabartma, kıyı sığlıkları, bulut gölgeleri; hedeflenen kampanya haritası hissi | Düz dokulu kara ve deniz; temiz ama oyun hissi daha az |
| İlk açılışta inen ek veri | Kabartma görüntüsü (414 KB) | Yok |
| Bellek | Arazi tek doku olarak tutulur (yaklaşık 30 MB) | Düşük |
| Cihaz desteği | WebGL gerekir; açılamazsa sade haritaya kendiliğinden düşer | Her cihazda çalışır |

Ekran görüntüleri: `tmp/screens/desktop-13-painted-map.png` ve `tmp/screens/desktop-14-basic-map.png`
(`npm run test:e2e` üretir).

Ne olur: Varsayılan, yeni gelen herkesin ilk gördüğü haritayı belirler. Adresteki `map=` parametresi ve ayarlardaki
seçim her iki durumda da çalışır.

## Seçenekler

### A — Boyalı harita varsayılan ⭐ önerilen

- ✅ İlk izlenim, istenen oyun hissini verir (T1)
- ✅ Desteklemeyen cihazda sade haritaya kendiliğinden düşer
- ❌ Zayıf telefonlarda açılış bir iki saniye daha uzun sürebilir (gerçek cihazda ölçülmedi)

### B — Sade harita varsayılan

- ✅ En hızlı açılış, en düşük bellek
- ❌ Boyalı haritayı yalnız ayarlara giren görür

### C — Geniş ekranda boyalı, telefonda sade

- ✅ Telefonda hız, masaüstünde görsellik
- ❌ Telefon kullanıcısı varsayılan olarak oyun haritasını görmez; iki ayrı ilk izlenim

## Öneri

**A**: Projenin ayırt edici yanı oyun hissi; yedek mekanizma riski karşılıyor. Gerçek telefonlarda yavaş kalırsa C'ye
geçmek tek satırlık değişiklik (`src/app/urlState.ts` → `DEFAULT_MAP_KIND`).

## Cevap

## Sonuç

**Geçici karar (T4 gereği soru açık):** A uygulandı. `DEFAULT_MAP_KIND = 'pixi'`, yedek `FALLBACK_MAP_KIND = 'maplibre'`.
