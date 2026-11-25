# Faz 1 — Sahne altyapısı ve kendi kendine ilerleyen görsel test düzeni

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Üç boyutlu sahnenin çalışacağı sayfa ve onu her değişiklikten sonra aynı açılardan görüntüleyip sınayan düzen kurulur. Bitince sahne ayrı bir sayfada açılır, adresle seçilen sabit kameralardan tek kare çizer ve bu kareler betikle kaydedilir.

## Problem

- Uygulamada üç boyutlu çizim yapan bir sayfa ve motor yok.
- Bir sahnenin iyi görünüp görünmediği yalnız bakılarak anlaşılır; her değişiklikten sonra aynı açıdan bakabilmek için sabit kameralar ve tekrarlanabilir kareler gerekir.
- Oyun geliştirenlerin kullandığı otomatik sınamalar (duman testi, çizim bütçesi, altın görüntü) bu projede yok.

## Çözüm

- **Ayrı sayfa:** Sahne `sahne.html` adresinde açılır; Three.js yalnız bu sayfada yüklenir, ana uygulamanın açılışı ağırlaşmaz.
- **Sabit kameralar:** `?shot=<ad>` ile seçilen kamera tek bir kare çizer; `?t=<saniye>` karenin anını belirler. Hareket eden her şey zamanın saf işlevidir, bu yüzden aynı adres hep aynı görüntüyü verir.
- **Hazır işareti:** Sahne çizildiğinde sayfa `data-scene-ready` işaretini koyar ve o karenin çizim çağrısı ile üçgen sayısını `sceneInfo` olarak verir.
- **Çekim betiği:** `scripts/dev/shoot-scene.ts` her kameradan ekran görüntüsünü `tmp/screens/scene/` altına yazar; geliştirme bu görüntülere bakılarak ilerler.
- **Çevrimdışı önbellek:** Service worker sahne sayfasını ana sayfayla değiştirmez; model dosyaları da önbelleğe alınır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 1.1 | Sahne ayrı bir sayfada açılır ve sabit kameralardan tek kare çizer. | 🟢 Tamamlandı |
| 1.2 | Her kameradan ekran görüntüsü alan betik yazılır. | 🟢 Tamamlandı |
| 1.3 | Duman, bütçe ve altın görüntü testleri yazılır. | 🟢 Tamamlandı |
| 1.4 | Service worker sahne sayfasını ana sayfayla değiştirmez. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir (K1–K6).

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K1 | Sahne açılır ve hata vermeden çizilir. | 1.1, 1.3, 1.4 |
| K5 | Akıcı çalışır: çizim bütçesi aşılmaz. | 1.3 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Sahne açılır, hazır işareti gelir, konsolda hata yoktur. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Sabit kameralar odanın içindedir ve adlarıyla bulunur. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Art arda üç kamerada çizim çağrısı ve üçgen sayısı bütçenin altındadır. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Dört kameranın görüntüsü altın görüntüyle eşleşir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] `npm run dev` ile açılan sunucuda `sahne.html?shot=entrance` tek kare çizer.
- [x] `npx tsx scripts/dev/shoot-scene.ts entrance` görüntüyü `tmp/screens/scene/entrance.png` olarak yazar.
- [x] `sahne.html` iki kez art arda açıldığında ikisinde de sahne gelir.

## Kalan

- **Altın görüntüler bu makineye özgüdür:** `tests/e2e/scene.spec.ts-snapshots/` altındaki dört görüntü Windows ve yazılım tabanlı çizimle üretildi; başka bir işletim sisteminde yeniden üretilmeleri gerekir.
- **Testlerin süresi:** Başsız tarayıcı sahneyi yazılımla çizer; bir kare yaklaşık 20 saniye, yürüme testi yaklaşık 3 dakika sürer.

## Ayrıntılar

### 1.1 — Sahne ayrı bir sayfada açılır ve sabit kameralardan tek kare çizer.

- **Mevcut durum:** Uygulama tek sayfadır; üç boyutlu çizim yoktur.
- **Problem:** Three.js ana pakete eklenirse haritayı açan herkes onu da indirir; sahne için ayrı bir giriş gerekir.
- **Çözüm:** Vite'a ikinci giriş (`sahne.html`) eklenir. `SceneApp.ts` çizimi kurar; `shots.ts` sabit kameraları ad ad tanımlar. `?shot=` verilmişse tek kare çizilir ve döngü durur, verilmemişse oyun başlar. `?only=figure` ve `?only=room` yalnız bir parçayı gösterir.
- **Dosyalar:** `sahne.html`, `vite.config.ts`, `src/scene3d/main.ts`, `src/scene3d/SceneApp.ts`, `src/scene3d/shots.ts`, `src/scene3d/scene.css`
- **Testler:** `tests/unit/scene3d.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 1.2 — Her kameradan ekran görüntüsü alan betik yazılır.

- **Mevcut durum:** Uçtan uca testler ekran görüntüsü alır, ama tek bir sahneyi hızlıca çekmek için araç yoktur.
- **Problem:** Görsel bir işte her değişiklikten sonra bakmak gerekir; tam test koşusu bunun için yavaştır.
- **Çözüm:** `scripts/dev/shoot-scene.ts` verilen (ya da bütün) kameralar için sayfayı açar, hazır işaretini bekler, görüntüyü kaydeder ve çizim sayılarını yazar. Sayfa hata verirse beklemeden durur ve hatanın yerini yazar.
- **Dosyalar:** `scripts/dev/shoot-scene.ts`
- **Testler:** -
- **Durum:** 🟢 Tamamlandı.

### 1.3 — Duman, bütçe ve altın görüntü testleri yazılır.

- **Mevcut durum:** Sahne için otomatik sınama yoktur.
- **Problem:** Sahne bozulursa (açılmazsa, pahalılaşırsa, görüntüsü değişirse) bunu bir insan fark edene kadar kimse bilmez.
- **Çözüm:** Uçtan uca testler: sahne hatasız açılır; sabit kameralarda çizim çağrısı ve üçgen sayısı bütçenin altındadır; dört kameranın görüntüsü kayıtlı altın görüntüyle karşılaştırılır. Altın görüntüler sahnenin kabul edilen son hâlinden üretilir.
- **Dosyalar:** `tests/e2e/scene.spec.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 1.4 — Service worker sahne sayfasını ana sayfayla değiştirmez.

- **Mevcut durum:** Çevrimdışı önbellek, tanımadığı her gezinmeyi ana sayfayla cevaplar.
- **Problem:** Sahne ilk açılışta gelir; önbellek kurulduktan sonraki açılışta sahne yerine ana uygulama gelir. Bütçe testi art arda üç kamera açarken bunu yakaladı.
- **Çözüm:** Service worker'ın gezinme yedeğine sahne sayfası için istisna eklenir; `.glb` ve `.jpg` dosyaları önbelleğe alınanlara katılır.
- **Dosyalar:** `vite.config.ts`
- **Testler:** `tests/e2e/scene.spec.ts` (art arda üç kamera)
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `MAIN_TODO.md` → Preanalysis → Oyun geliştirenlerin test yöntemleri
