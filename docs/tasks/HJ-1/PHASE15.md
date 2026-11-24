# Faz 15 — Altıncı geri bildirim: harita seçimi, portre kırpmaları ve haritada portreler

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Faz 14'ten sonra gelen geri bildirim uygulanır. Bitince uygulama sade haritayla açılır, boyalı haritaya geçiş
başarısız olursa bunu söyler, portreler yüzü ortalayacak biçimde kırpılır ve haritadaki bayraklarda da görünür.

## Problem

- Sade haritadan boyalı haritaya geçiş bazen olmuyor; tıklandıktan sonra sade harita kalıyor ve neden olduğu söylenmiyor (T61).
- Uygulama boyalı haritayla açılıyor; sade haritanın varsayılan olması isteniyor.
- Portrelerin küçük resimlerinde yüz ortada değil; bazılarında baş ya da fes kesiliyor.
- Haritadaki figür bayrakları portreyi değil, türün simgesini gösteriyor.

## Çözüm

- **Varsayılan harita:** Uygulama sade haritayla açılır; boyalı harita ayarlardan seçilir ve bağlantıda `map=pixi` olarak taşınır.
- **Geçiş hatası:** Boyalı harita başlayamazsa bir kez daha denenir. Yine başlayamazsa sade haritaya dönülür ve haritanın üstünde bunun nedeni yazılır; sessizce geri dönülmez.
- **Kırpmalar:** Her portrede yüzün yeri görselin üstüne ızgara konarak yeniden ölçülür ve kayıtlar düzeltilir.
- **Haritada portre:** Figürün haritadaki bayrağında, portresi varsa portresi, yoksa simgesi görünür.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 15.1 | Uygulama sade haritayla açılır. | 🟢 Tamamlandı |
| 15.2 | Boyalı harita başlayamazsa yeniden denenir ve başarısızlık söylenir. | 🟢 Tamamlandı |
| 15.3 | Portreler yüzü ortalayacak biçimde yeniden kırpılır. | 🟢 Tamamlandı |
| 15.4 | Haritadaki bayraklar portreyi gösterir. | 🟢 Tamamlandı |
| 15.5 | Bir yolculuk açıkken başka figürlerin izleri çizilmez. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-29, FR-30 | Uygulama her cihazda çalışan sade haritayla açılır; boyalı harita bir seçenektir ve açılamazsa bu söylenir. | 15.1, 15.2 |
| FR-1, FR-13 | Figür, kartta ve haritada, varsa portresiyle gösterilir; portrede yüz ortadadır. | 15.3, 15.4 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Uygulama sade haritayla açılır; boyalı harita seçilince bağlantıya `map=pixi` yazılır. | `tests/e2e/map-kind.spec.ts`, `tests/unit/app.test.ts` | 🟢 Tamamlandı |
| İki harita arasında üç kez gidip gelinir; her seferinde seçilen harita açılır. | `tests/e2e/map-kind.spec.ts` | 🟢 Tamamlandı |
| Boyalı haritanın verisi yüklenemezse sade harita kalır ve neden haritanın üstünde yazar. | `tests/e2e/map-kind.spec.ts` | 🟢 Tamamlandı |
| Portresi olan figürün haritadaki bayrağında portresi, olmayanınkinde simgesi vardır. | `tests/unit/app.test.ts`, `tests/e2e/portraits.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Uygulama açılır; sade harita görünür.
- [x] Ayarlardan "Boyalı harita" seçilir; boyalı harita açılır. Sade haritaya dönülüp tekrar boyalıya geçilir; yine açılır.
- [x] Rota şeritlerinde ve kart başlığında portrelerde yüz ortadadır; baş kesilmez.
- [x] Haritada Atatürk'ün bayrağında portresi görünür.

## Kalan

- **Geçiş hatasının asıl nedeni bulunamadı:** Başsız tarayıcıda iki harita arasında üç tur gidip gelmek sorunsuz. Yapılan değişiklik hatayı gidermeyi garanti etmez; boyalı harita başlayamazsa artık yeniden denenir ve başlayamadığı, nedeniyle birlikte haritanın üstünde yazar. Hata tekrar görülürse o not asıl nedeni gösterecektir.
- **Review bulguları:** `REVIEW/2026-11-24-2200.md` içindeki 9 bulgudan 8'i kapatıldı (tek majör dahil: haritadaki portrenin sancağa dönüşü test edilmiyordu). Açık bırakılan: boyalı haritanın açılamama nedeni okura ham hata metniyle gösteriliyor; hata gerçek cihazda teşhis edilene kadar bilerek böyle bırakıldı.
- **Sonar:** IDE kapalı olduğu için review Sonar'sız yapıldı.
- **20 portre hâlâ düşük çözünürlüklü kaynaktan:** Commons'un hız sınırı bir ara kalktı; 23 kaynak 960 pikselden yeniden alındı, sonra yeniden reddedildi. Kalanlar 360–500 piksellik kopyalardan üretiliyor.
- **Kırpmalar ızgarayla ölçüldü:** Yüzün yeri yüzde onluk ızgaradan okundu; yüksek kavuklu portrelerde (II. Selim, IV. Mehmed, III. Murad) başlık madalyonun büyük bölümünü kaplıyor, yüz altta kalıyor.
- **Sade haritanın kaydı (S2):** Varsayılan harita kararı sohbette verildi ve S2 kartına işlendi.

## Ayrıntılar

### 15.1 — Uygulama sade haritayla açılır.

- **Mevcut durum:** `DEFAULT_MAP_KIND` boyalı haritadır (`pixi`); sade harita bağlantıda `map=maplibre` olarak taşınır.
- **Problem:** Varsayılanın sade harita olması isteniyor (T61).
- **Çözüm:** `DEFAULT_MAP_KIND` sade harita (`maplibre`) olur; boyalı harita bağlantıda `map=pixi` olarak taşınır. Eski bağlantılardaki `map=maplibre` çalışmaya devam eder. S2 kartındaki karar buna göre güncellenir.
- **Dosyalar:** `src/app/urlState.ts`, `docs/tasks/HJ-1/questions/S02-varsayilan-harita.md`
- **Testler:** `tests/e2e/map-kind.spec.ts`, `tests/unit/app.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 15.2 — Boyalı harita başlayamazsa yeniden denenir ve başarısızlık söylenir.

- **Mevcut durum:** Boyalı harita başlayamazsa uygulama hiçbir şey söylemeden sade haritaya döner ve seçimi değiştirir.
- **Problem:** Kullanıcı boyalı haritaya tıklıyor, sade harita kalıyor ve neden olduğunu göremiyor (T61). Hata başsız tarayıcıda yeniden üretilemedi; gerçek cihazdaki nedeni bilinmiyor.
- **Çözüm:** Başlayamayan boyalı harita bir kez daha denenir. İkinci deneme de başarısızsa sade haritaya dönülür ve store'daki `mapFailure` alanı dolar; haritanın üstünde "Boyalı harita açılamadı, sade harita gösteriliyor" notu ve hatanın kısa nedeni yazar. Kullanıcı yeniden bir harita seçtiğinde not kalkar.
- **Dosyalar:** `src/ui/MapStage.tsx`, `src/app/store.ts`, `src/ui/theme/layout.css`
- **Testler:** `tests/e2e/map-kind.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 15.3 — Portreler yüzü ortalayacak biçimde yeniden kırpılır.

- **Mevcut durum:** Kırpma kayıtları küçük bir toplu görüntüye bakılarak tahmin edildi.
- **Problem:** Yüz madalyonun ortasında değil; Atatürk'te baş sağ üstte, V. Mehmed'de fes kesik (T61).
- **Çözüm:** Her kaynak görselin üstüne yüzde onluk ızgara konur, yüzün merkezi ve genişliği ızgaradan okunur ve `crop` kayıtları düzeltilir. Kare, başlığı ve çeneyi içine alacak genişlikte tutulur.
- **Dosyalar:** `content/figures/*.json`, `public/portraits/*.webp`
- **Testler:** `tests/unit/portraits.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 15.4 — Haritadaki bayraklar portreyi gösterir.

- **Mevcut durum:** Haritadaki figür işareti, türün simgesini taşıyan bir sancaktır.
- **Problem:** Portreler haritada görünmüyor (T61).
- **Çözüm:** `FigureMarker` portrenin var olup olmadığını taşır. Portresi olan figürün işaretinde sancağın yerine altın çerçeveli yuvarlak portre durur; portresi olmayanda sancak kalır. Görsel yüklenemezse sancağa dönülür.
- **Dosyalar:** `src/map/MapView.ts`, `src/map/mapScene.ts`, `src/map/markerElements.ts`, `src/ui/portraits.ts`, `src/ui/Medallion.tsx`, `src/ui/theme/map.css`
- **Testler:** `tests/unit/app.test.ts`, `tests/e2e/portraits.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 15.5 — Bir yolculuk açıkken başka figürlerin izleri çizilmez.

- **Mevcut durum:** Bir figürün yolculuğu açıkken, o yıl haritada bulunan diğer figürlerin o yıla kadarki izleri de çiziliyor.
- **Problem:** V. Mehmed'in kartı açıkken 1911'de Atatürk'ün Selanik, Şam ve Derne arasındaki izi görünüyor ve V. Mehmed'in yolculuk çizgisiyle karışıyor (T64).
- **Çözüm:** Bir yolculuk açıkken haritadaki tek çizgi o yolculuğun yoludur. Diğer figürler bulundukları yerde işaretleriyle görünmeye devam eder. İzler yalnız genel görünümde ve yolculuk kapalıyken çizilir.
- **Dosyalar:** `src/map/mapScene.ts`
- **Testler:** `tests/unit/journeyMap.test.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 15
- `docs/requirements/history-journeys.md` → FR-1, FR-13, FR-29, FR-30
