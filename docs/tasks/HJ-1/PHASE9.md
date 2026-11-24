# Faz 9 — İlk kullanım geri bildirimi: harita, oynatma ve rota türleri

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

İlk sürümün kullanılmasıyla gelen geri bildirim uygulanır. Bitince harita yalnız o yılda kaydı olan figürleri gösterir,
oynatma olaydan olaya duraklayarak ilerler ve hızı seçilir, iki figür arasında iki tür rota sunulur.

## Problem

- Oynatma sırasında harita karışık: 1462'de Atatürk seçiliyken onun 1881–1938 durakları haritada soluk hâlde duruyor (T26).
- Bir figür iki durağı arasındaki yıllarda son durağında gösteriliyor; kaydı olmayan bir yıl için yanlış yer bilgisi veriliyor.
- Atatürk'ün yolculuğu 6 duraktan ibaret; Şam, Trablusgarp, Doğu Cephesi, Suriye ve Kurtuluş Savaşı durakları yok.
- Oynatmada yıllar durmadan akıyor; figürler hiç beklemeden yer değiştiriyor ve ne olduğu anlaşılmıyor. Hız seçilemiyor.
- Rota seçenekleri ("Taht sırası", "Hanedan ailesi" …) gereksiz ayrıntılı ve sınırlayıcı.

## Çözüm

- **Yolculuk düğmesi:** Seçili figürün bütün durakları haritada varsayılan olarak görünmez; kartındaki "Yolculuğu haritada göster" düğmesiyle açılır.
- **O yılın haritası:** Harita, seçili yılda kaydı olan figürleri bulundukları yerde ve o yıla kadarki izleriyle gösterir.
- **Kayıt yoksa görünmez:** Figür yalnız bir durağının yıl aralığındayken haritada görünür.
- **Atatürk'ün yolculuğu:** 1881'den 1938'e bütün ana duraklar eklenir; durak sayısı sınırı yükseltilir.
- **Oynatma:** Zaman olaydan olaya atlar, her olayda bekler ve olayı haritanın üstünde yazar; hız 0,5×, 1× ve 2× arasında seçilir.
- **Rota türleri:** İki tür rota sunulur: doğrudan ilişkilerle ilerleyen "Elden ele" ve etkilerle ilerleyen, arada yüzyıllar olabilen "Fikirden fikre".

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 9.1 | Figür yalnız kaydı olan yıllarda haritada gösterilir. | 🟢 Tamamlandı |
| 9.2 | Harita o yıldaki figürleri izleriyle gösterir, seçili figürün yolculuğu düğmeyle açılır. | 🟢 Tamamlandı |
| 9.3 | Atatürk'ün yolculuğu bütün ana duraklarıyla yazılır. | 🟢 Tamamlandı |
| 9.4 | Oynatma olaydan olaya duraklayarak ilerler ve hızı seçilir. | 🟢 Tamamlandı |
| 9.5 | Rotalar "Elden ele" ve "Fikirden fikre" olarak iki türe iner. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-13, FR-14, FR-17 | Yolculuk haritada tarihli yerler olarak gösterilir; kaydı olmayan yıl gösterilmez. | 9.1, 9.2 |
| FR-14 | Zaman çizelgesi figürlerin o yıl nerede olduğunu gösterir; oynatma olaydan olaya ilerler. | 9.4 |
| FR-8, FR-28 | İki figür arasında iki tür rota sunulur: doğrudan ilişkiler ve etkiler. | 9.5 |
| AJ-1, AJ-8 | Atatürk'ün yolculuğu tarihli ve sıralı durakların listesidir. | 9.3 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| İki durak arasındaki yılda figür haritada yer almaz. | `tests/unit/feedback.test.ts` | 🟢 Tamamlandı |
| Seçili figürün yolculuğu yalnız düğme açıkken sahneye girer. | `tests/unit/feedback.test.ts`, `tests/e2e/feedback.spec.ts` | 🟢 Tamamlandı |
| Oynatma olayda durur, olayı yazar ve hız düğmesi beklemeyi değiştirir. | `tests/unit/feedback.test.ts`, `tests/e2e/feedback.spec.ts` | 🟢 Tamamlandı |
| "Elden ele" rotasında etki bağlantısı yoktur; "Fikirden fikre" rotasında en az bir tane vardır. | `tests/unit/routeEngine.test.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk → Fatih yolculuğunda yıl 1461'e çekilir; haritada Atatürk'ün durakları görünmez, o yıl kaydı olan figürler görünür.
- [x] Atatürk kartında "Yolculuğu haritada göster"e basılır; bütün durakları numaralı olarak görünür.
- [x] Oynat'a basılır; zaman bir olayda durur, haritanın üstünde yıl, figür, yer ve olay yazar, sonra sıradaki olaya geçer.
- [x] Hız düğmesine basılır; 1× → 2× → 0,5× olarak değişir ve bekleme süresi buna göre kısalır ya da uzar.
- [x] Rota sekmelerinde yalnız "Elden ele" ve "Fikirden fikre" vardır; ikincisinde en az bir "Etki" bağlantısı bulunur.

## Kalan

- **Diğer figürlerin yolculukları:** Kural gereği kaydı olmayan yıllarda figür artık haritada görünmüyor. Atatürk dışındaki figürlerin yolculukları 3–6 duraklı olduğu için haritada seyrek görünüyorlar (örneğin Fatih 1462–1480 arasında yok). Bunların tamamlanması ayrı bir içerik işidir.
- **Sonar:** IDE kapalı olduğu için bu fazın review'ı da Sonar'sız yapıldı.

## Ayrıntılar

### 9.1 — Figür yalnız kaydı olan yıllarda haritada gösterilir.

- **Mevcut durum:** `stopAtYear`, yıl iki durağın arasındaysa önceki durağı döndürüyor.
- **Problem:** Eklenmemiş bir kayıt yüzünden figür o yıl başka bir yerdeyken yanlış yerde gösteriliyor (T26).
- **Çözüm:** `stopAtYear` yalnız `from ≤ yıl ≤ to` olan durağı döndürür; yoksa figür haritada yer almaz.
- **Dosyalar:** `src/domain/journey.ts`, `src/map/mapScene.ts`
- **Testler:** `tests/unit/feedback.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 9.2 — Harita o yıldaki figürleri izleriyle gösterir, seçili figürün yolculuğu düğmeyle açılır.

- **Mevcut durum:** Seçili figürün bütün durakları her yıl gösteriliyor; ulaşılmamış olanlar soluk.
- **Problem:** Seçili figürün yaşamadığı bir yılda durakları haritayı kalabalıklaştırıyor (T26).
- **Çözüm:** Sahne, o yıl kaydı olan her figür için bulunduğu yeri ve o yıla kadarki izini üretir. Seçili figürün tam
  yolculuğu store'daki `showJourney` açıkken eklenir; düğme kartta durur, varsayılan kapalıdır ve bağlantıda `j=1` olarak taşınır.
- **Dosyalar:** `src/map/mapScene.ts`, `src/map/MapView.ts`, `src/map/MapLibreMapView.ts`, `src/map/PixiMapView.ts`, `src/app/store.ts`, `src/app/urlState.ts`, `src/ui/FigureCard.tsx`
- **Testler:** `tests/unit/feedback.test.ts`, `tests/e2e/feedback.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 9.3 — Atatürk'ün yolculuğu bütün ana duraklarıyla yazılır.

- **Mevcut durum:** 6 durak: Selanik, Manastır, Çanakkale, Samsun, Ankara, Dolmabahçe.
- **Problem:** Şam, Trablusgarp, Sofya, Doğu Cephesi, Suriye cephesi, Amasya, Erzurum, Sivas, Sakarya, İzmir gibi duraklar yok (T26).
- **Çözüm:** Yolculuk 1881'den 1938'e ana duraklarıyla yeniden yazılır. Yolculuk 29 durağa çıktı. Şemadaki durak üst sınırı 8'den 30'a çıkar; kural
  setinde R17 buna göre güncellenir.
- **Dosyalar:** `content/figures/ataturk.json`, `src/domain/contentSchema.ts`, `content/rules/RULESET.md`
- **Testler:** `npm run db:build` denetimi, `tests/e2e/feedback.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 9.4 — Oynatma olaydan olaya duraklayarak ilerler ve hızı seçilir.

- **Mevcut durum:** Oynatma her 140 milisaniyede bir yıl ilerliyor.
- **Problem:** Figürler durmadan yer değiştiriyor; kullanıcı ne olduğunu kavrayamıyor ve hızı değiştiremiyor (T26).
- **Çözüm:** Rotadaki figürlerin durakları yıl sırasına dizilir ("vakayiname"). Oynatma sıradaki olaya atlar, kamerayı
  oraya götürür, olayı haritanın üstünde yazar ve hız ayarına göre bekler. Hız düğmesi 0,5×, 1×, 2× arasında döner.
- **Dosyalar:** `src/domain/chronicle.ts`, `src/app/store.ts`, `src/ui/CommandBar.tsx`, `src/ui/MapStage.tsx`, `src/ui/theme/layout.css`
- **Testler:** `tests/unit/feedback.test.ts`, `tests/e2e/feedback.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 9.5 — Rotalar "Elden ele" ve "Fikirden fikre" olarak iki türe iner.

- **Mevcut durum:** Üç ağırlık profili dörde kadar rota üretiyor; etiketler baskın ilişki grubundan geliyor.
- **Problem:** "Taht sırası" ve "Hanedan ailesi" ayrımı sınırlayıcı; kullanıcı iki tür istiyor: doğrudan ilişki ve etki (T26).
- **Çözüm:** İlişki türlerine `mode` alanı eklenir (`direct` ya da `influence`). "Elden ele" rotası yalnız doğrudan
  ilişkilerle ilerler. "Fikirden fikre" rotası etki bağlantılarını tercih eder, zamanda uzun atlayabilir ve en az bir etki
  bağlantısı içermiyorsa sunulmaz. Etiket metinleri arayüz katmanına taşınır. Yüzyılları aşan birkaç etki ilişkisi içeriğe eklenir.
- **Dosyalar:** `content/relation-types.json`, `content/figures/*.json`, `src/domain/routeEngine.ts`, `src/domain/contentSchema.ts`, `src/data/dbSchema.ts`, `src/ui/RouteTabs.tsx`, `docs/requirements/history-journeys.md`
- **Testler:** `tests/unit/routeEngine.test.ts`, `tests/e2e/feedback.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Atatürk'ün 29 durağı genel bilgiye dayanarak yazıldı; TDV ve Vikipedi maddeleri kaynak gösterildi, durak durak kaynakla karşılaştırılmadı. ATAM kronolojisi otomatik erişime kapalı olduğu (HTTP 403) için kaynak olarak eklenemedi.
- Yedi yeni etki ilişkisi (örneğin II. Mahmud → Atatürk, Müteferrika → III. Selim) "önce basit" ilkesiyle yazılmış yorumlardır.
- Oynatma testi bir tam koşuda zaman aşımına uğradı, tek başına ve sonraki tam koşuda geçti; yük altında kırılgan olabilir.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 9
- `docs/requirements/history-journeys.md` → FR-8, FR-13, FR-14, FR-28
