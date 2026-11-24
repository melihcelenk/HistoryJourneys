# Faz 10 — İkinci geri bildirim: numaralı yolculuk, genel görünüm ve rota türü seçimi

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Faz 9'dan sonra gelen geri bildirim uygulanır. Bitince seçili figürün numaralı yolculuğu varsayılan olarak haritadadır,
duraklar sekizerli gruplar hâlinde gösterilir ve numaralarına tıklanarak gezilir, kart kapatılarak genel görünüme
geçilir ve rota türü yolculuk seçilirken belirlenir.

## Problem

- Seçili figürün numaralı yolculuğu Faz 9'da varsayılan olarak kapatıldı; kullanıcı bunu kaybolmuş sandı (T33).
- Yolculuğu açan düğme kartın altında; kaydırmadan görünmüyor.
- 29 duraklı bir yolculuk açıldığında harita çizgi ve etiketten okunmuyor.
- Haritadaki durak numaraları yalnız gösterge; tıklanmıyor, üstüne gelince olayı göstermiyor.
- Zaman çubuğu figür seçiliyken de bütün rotanın yıllarını (1432–1938) kapsıyor; figürün ömrü çubuğun küçük bir parçası.
- Açık kartı kapatıp bütün rotaya bakmanın yolu yok.
- Rota türü sekmeleri oyun ekranında, yolculuk seçildikten sonra duruyor; adları ("Elden ele", "Fikirden fikre") beğenilmedi.

## Çözüm

- **Varsayılan açık yolculuk:** Bir figürün kartı açıkken numaralı yolculuğu haritada görünür. Yolculuğu ve çizgileri
  açıp kapatan iki ikon düğme kartın sağ üstünde durur.
- **Sekizerli gruplar:** Yolculuğun durakları sekizerli gruplara bölünür; haritada yalnız seçili yılın düştüğü grup
  görünür ve kamera o grubu çerçeveler. Grup seçici haritanın üstünde durur.
- **Durakta gezinme:** Durak numarasına tıklanınca zaman o durağa gider ve olayı yazılır; üstüne gelince durağın kartı açılır.
- **Figürün zaman çubuğu:** Figür seçiliyken zaman çubuğu ve oynatma yalnız onun yaşamını kapsar; genel görünümde bütün rotayı.
- **Genel görünüm:** Açık kartın başlığına tıklanınca kart şeride döner ve genel görünüme geçilir; panelin üstünde aynı işi yapan bir düğme de vardır.
- **Rota türü:** "Doğrudan" ve "Etki" adlarıyla, yolculuk seçilirken (başlangıç ekranı ve figür seçme penceresi) belirlenir; oyun ekranındaki sekmeler kalkar.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 10.1 | Seçili figürün yolculuğu varsayılan olarak açıktır; yolculuk ve çizgi düğmeleri kartın sağ üstündedir. | 🟢 Tamamlandı |
| 10.2 | Duraklar sekizerli gruplar hâlinde gösterilir; numaraya tıklanır, üstüne gelince kartı açılır. | 🟢 Tamamlandı |
| 10.3 | Zaman çubuğu ve oynatma seçili figürün yaşamını kapsar. | 🟢 Tamamlandı |
| 10.4 | Kart kapatılarak genel görünüme geçilir. | 🟢 Tamamlandı |
| 10.5 | Rota türü yolculuk seçilirken belirlenir; adlar "Doğrudan" ve "Etki" olur. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-13 | Seçili figürün yolculuğu numaralı duraklar olarak haritada gösterilir; yolculuk ve çizgiler ayrı ayrı gizlenebilir. | 10.1, 10.2 |
| FR-14 | Zaman çubuğu seçili figürün yaşamını, genel görünümde bütün rotayı kapsar. | 10.3 |
| FR-9, FR-10 | Rotadaki kartlar açılıp kapatılabilir; hiçbiri açık değilken rota genel görünümdedir. | 10.4 |
| FR-8 | Rota türü yolculuk seçilirken belirlenir. | 10.5 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Yolculuk varsayılan olarak açıktır; kapatılınca bağlantıya `j=0` yazılır. | `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts` | 🟢 Tamamlandı |
| 29 duraklı yolculukta sahnede yalnız yılın düştüğü sekizli grup vardır. | `tests/unit/journeyMap.test.ts` | 🟢 Tamamlandı |
| Çizgiler kapalıyken sahnede yol ve iz yoktur, duraklar kalır. | `tests/unit/journeyMap.test.ts` | 🟢 Tamamlandı |
| Durak numarasına tıklanınca yıl o durağın yılı olur ve olayı yazılır. | `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts` | 🟢 Tamamlandı |
| Figür seçiliyken zaman çubuğunun uçları doğum ve ölüm yılıdır. | `tests/e2e/journey-map.spec.ts` | 🟢 Tamamlandı |
| Kart başlığına tıklanınca kart kapanır, zaman çubuğu bütün rotayı kapsar. | `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts` | 🟢 Tamamlandı |
| Başlangıç ekranında "Etki" seçilip yolculuk başlatılınca etki rotası açılır; oyun ekranında sekme yoktur. | `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk → Fatih yolculuğu açılır; Atatürk'ün numaralı durakları kaydırmadan haritada görünür, en fazla sekiz tanesi.
- [x] Haritanın üstündeki grup seçiciden "9–16" seçilir; harita o duraklara gider.
- [x] Bir durak numarasına tıklanır; yıl değişir, olay haritanın üstünde yazar. Numaranın üstüne gelince durağın kartı açılır.
- [x] Kartın sağ üstündeki çizgi düğmesine basılır; çizgiler kaybolur, numaralar kalır.
- [x] Zaman çubuğunun sol ucu 1881, sağ ucu 1938'dir.
- [x] Kart başlığına tıklanır; kart şeride döner, zaman çubuğu 1432–1938 olur.
- [x] Başlangıç ekranında "Etki" seçilip hazır yolculuk başlatılır; 8 kartlı etki rotası açılır.

## Kalan

- **Diğer figürlerin yolculukları:** Hâlâ 3–6 duraklı; kaydı olmayan yıllarda haritada görünmüyorlar (Faz 9'dan devreden içerik işi).
- **Sonar:** IDE kapalı olduğu için bu fazın review'ı da Sonar'sız yapıldı.
- **Review bulguları:** `REVIEW/2026-11-24-1045.md` içindeki 29 bulgudan 11'i kapatıldı (tek majör dahil); 18 düşük öncelikli bulgu açık: test dosyalarının konuya göre adlandırılması, test yardımcılarının ortak dosyaya taşınması, `StopMarker` için ayırt edici birleşim tipi, kamera takibinin ayrı hook'a çıkarılması ve betiklerdeki küçük hata yönetimi noktaları.

## Ayrıntılar

### 10.1 — Seçili figürün yolculuğu varsayılan olarak açıktır; yolculuk ve çizgi düğmeleri kartın sağ üstündedir.

- **Mevcut durum:** `showJourney` varsayılan olarak kapalı; düğme kartın altında, "Ayrıntılar"ın yanında.
- **Problem:** Kullanıcı numaralı yolculuğu göremedi; düğme kaydırmadan görünmüyor (T33).
- **Çözüm:** `showJourney` varsayılan olarak açılır; kapalı hâli bağlantıda `j=0` olarak taşınır. Yeni `showLines`
  ayarı (varsayılan açık, kapalıyken `l=0`) yolculuk çizgisini ve diğer figürlerin izlerini gizler. İki ayar kart
  başlığının sağ üstünde ikon düğme olur; alttaki düğme kalkar.
- **Dosyalar:** `src/app/store.ts`, `src/app/urlState.ts`, `src/map/mapScene.ts`, `src/ui/FigureCard.tsx`, `src/ui/Icon.tsx`, `src/ui/theme/card.css`
- **Testler:** `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 10.2 — Duraklar sekizerli gruplar hâlinde gösterilir; numaraya tıklanır, üstüne gelince kartı açılır.

- **Mevcut durum:** Yolculuk açıkken bütün duraklar ve aralarındaki çizgiler aynı anda çiziliyor; durak işaretleri tıklanmıyor.
- **Problem:** 29 durak haritayı okunmaz yapıyor; duraklar arasında haritadan gezilemiyor (T33).
- **Çözüm:** Duraklar sırayla sekizerli gruplara ayrılır (`JOURNEY_GROUP_SIZE`). Etkin grup, anlatılan durağın, yoksa
  seçili yılda bulunulan ya da en son ulaşılan durağın grubudur. Sahne yalnız etkin grubun duraklarını ve çizgisini
  içerir, numaralar yolculuktaki gerçek sıra numarasıdır; kamera grubu çerçeveler. Haritanın üstündeki grup seçici
  ("1–8", "9–16" …) grubun ilk durağına gider. Durak işareti düğmedir: tıklanınca `goToStop` zamanı o durağa götürür ve
  olayı öne çıkarır. Üstüne gelince ya da odaklanınca yer adı, yıllar ve olayı içeren küçük kart açılır.
- **Dosyalar:** `src/domain/journey.ts`, `src/domain/chronicle.ts`, `src/map/mapScene.ts`, `src/map/MapView.ts`, `src/map/markerElements.ts`, `src/map/PixiMapView.ts`, `src/map/MapLibreMapView.ts`, `src/ui/MapStage.tsx`, `src/ui/JourneyGroups.tsx`, `src/ui/theme/map.css`
- **Testler:** `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 10.3 — Zaman çubuğu ve oynatma seçili figürün yaşamını kapsar.

- **Mevcut durum:** Zaman çubuğu rotadaki bütün figürlerin yaşamını kapsıyor; oynatma bütün rotanın olaylarını anlatıyor.
- **Problem:** Atatürk seçiliyken 1881–1938 çubuğun küçük bir parçası; ince ayar yapılamıyor (T33).
- **Çözüm:** Kartı açık bir figür varken çubuğun uçları onun doğum ve ölüm yılıdır ve oynatma yalnız onun duraklarını
  anlatır. Genel görünümde çubuk ve oynatma bütün rotayı kapsar.
- **Dosyalar:** `src/ui/CommandBar.tsx`, `src/ui/usePlayback.ts`
- **Testler:** `tests/e2e/journey-map.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 10.4 — Kart kapatılarak genel görünüme geçilir.

- **Mevcut durum:** Rotada her zaman bir kart açık; kapatmanın yolu yok.
- **Problem:** Bütün rotaya ve o yılın haritasına bakılamıyor (T33).
- **Çözüm:** Store'a `closeFigure` eklenir: rotadaki odak boşalır, sapma kapanır. Açık kartın başlığı bir düğmedir ve
  kartı kapatır. Panelin üstünde, eski sekmelerin yerinde, "Genel görünüm" düğmesi ve rotanın türü ile kart sayısı
  durur. Genel görünüm bağlantıda `g=1` olarak taşınır. Genel görünümde harita o yıl kaydı olan figürleri izleriyle gösterir.
- **Dosyalar:** `src/app/store.ts`, `src/app/urlState.ts`, `src/ui/FigureCard.tsx`, `src/ui/RoutePanel.tsx`, `src/ui/RouteHeader.tsx`, `src/ui/GameScreen.tsx`, `src/ui/theme/layout.css`
- **Testler:** `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 10.5 — Rota türü yolculuk seçilirken belirlenir; adlar "Doğrudan" ve "Etki" olur.

- **Mevcut durum:** İki rota türü oyun ekranında, panelin üstünde sekme olarak duruyor: "Elden ele", "Fikirden fikre".
- **Problem:** Yolculuk zaten seçilmişken tür seçimi ekranda yer kaplıyor; adlar beğenilmedi (T33).
- **Çözüm:** Store'a `routeKind` tercihi eklenir. Seçici başlangıç ekranında ve figür seçme penceresinde durur. Rotalar
  hesaplanınca tercih edilen türdeki rota açılır; o tür yoksa var olan rota açılır ve panel başlığı bunu söyler.
  `RouteTabs` kaldırılır. Adlar `src/ui/routeLabels.ts` içinde "Doğrudan" ve "Etki" olur.
- **Dosyalar:** `src/app/store.ts`, `src/ui/routeLabels.ts`, `src/ui/RouteKindChooser.tsx`, `src/ui/RoutePanel.tsx`, `src/ui/dialogs/FigurePickerDialog.tsx`, `src/ui/RouteTabs.tsx` (silinir)
- **Testler:** `tests/unit/journeyMap.test.ts`, `tests/e2e/journey-map.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Uygulama sırasında eklenenler

- **İzler de gruplanır:** Genel görünümde 29 duraklı bir figürün o yıla kadarki izi haritayı yine kaplıyordu. İz, figürün
  bulunduğu sekizli grubun başından başlar (`trailOf`).
- **Kamera payları:** Durak grubu şeridi, olay notu ve durak kartı haritadaki işaretlerin üstüne gelmesin diye masaüstü
  kamera payları büyütüldü (`DESKTOP_INSETS`).
- **Telefon:** Dar ekranda yalnız figürün bulunduğu durağın etiketi görünür; diğer duraklar yalnız numaradır.
- **Test düzeltmesi:** `tests/e2e/journey-map.spec.ts` içindeki "çizgiler kapalıyken duraklar kalır" denetimi ilk yazıldığında
  gruptaki ilk durağa bakıyordu; o durak bulunulan durağa çok yakın olduğu için tasarım gereği gizli. Denetim bulunulan
  durağa çevrildi. Davranış değişmedi.
- **Güncellenen eski testler:** Rota sekmelerini ve "yolculuk varsayılan kapalı" davranışını sınayan testler yeni
  gereksinime göre yeniden yazıldı ya da `phase10` dosyalarına taşındı.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 10
- `docs/requirements/history-journeys.md` → FR-8, FR-9, FR-13, FR-14
