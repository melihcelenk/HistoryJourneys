# Faz 3 — Fatih Sultan Mehmed karakteri

> **Durum:** 🟡 Kısmi · **Tamamlanma:** 90% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Gerçek bir insan gibi görünen ve Fatih'in yaşarken yapılmış portrelerine benzeyen figür kurulur. Bitince figür üç açıdan 1480 tarihli portreyle kıyaslanabilir.

## Problem

- Sahnede figür yok.
- Bu makinede modelleme aracı yok; kodla yazılan bir yüz gerçekçi olmaz.
- Açık lisanslı baş taramasının gözleri kapalıdır; saçı, sakalı, bedeni ve giysisi yoktur.

## Çözüm

- **Baş:** Lee Perry-Smith'in baş taraması (CC BY 3.0) kullanılır; gerçek bir insanın yüzüdür.
- **Gözler:** Taramadaki kapalı göz kapağında, parça gölgelendiricisinde bir açıklık kesilir; arkasına iris ve gözbebeği kodla boyanan göz küreleri konur. Açıklık bir değerle daraldığı için figür göz kırpar; gözler ziyaretçiyi izler.
- **Sakal, bıyık ve kaş:** Katmanlı kıl (shell) yöntemiyle: yüzün ilgili bölgesi birçok kez, her seferinde kılın biraz daha ilerisine kopyalanır; her kopyada yalnız kıl tellerinin geçtiği noktalar çizilir.
- **Kavuk:** 1480 portresindeki gibi, kırmızı dilimli başlığın çevresine sarılmış büyük beyaz sarık; sargıların üst üste binen katları geometriyle verilir.
- **Giysi:** Çintamani desenli ipek iç kaftan, beyaz kuşak, önü açık kürk yakalı kırmızı dış kaftan; yenler, eller ve pabuçlar. Kumaş desenleri kodla boyanır.
- **Küçük hareketler:** Nefes, başıyla ziyaretçiyi izleme ve göz kırpma; hepsi zamanın saf işlevidir.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 3.1 | Baş taraması yüklenir ve ölçülür. | 🟢 Tamamlandı |
| 3.2 | Kapalı gözler açılır ve göz küreleri eklenir. | 🟢 Tamamlandı |
| 3.3 | Sakal, bıyık ve kaşlar katmanlı kıl yöntemiyle eklenir. | 🟢 Tamamlandı |
| 3.4 | Kavuk modellenir. | 🟢 Tamamlandı |
| 3.5 | Kaftanlar, kuşak, kürk, yenler, eller ve pabuçlar eklenir. | 🟢 Tamamlandı |
| 3.6 | Figür portrelerle üç açıdan kıyaslanır ve farklar giderilir. | 🟡 Kısmi |
| 3.7 | Burun, yüz uzunluğu ve sakalın çizgisi portreye göre yeniden kurulur. | 🟡 Kısmi |
| 3.8 | Bıyık dudağın üstünde ince, aşağı kıvrılan bir çizgi olur; çene ucu dolgun, sivri ve öne çıkık olur. | 🟡 Kısmi |
| 3.9 | Kılın büyüdüğü yer, yüz yeniden biçimlendirilmeden önceki taramada belirlenir; burunda kıl kalmaz. | 🟡 Kısmi |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir (K1–K6).

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K3 | Karakter gerçek bir insan gibi görünür; kavuk, sakal ve kaftan dönemine uygundur. | 3.1–3.6 |
| K6 | Kullanılan hazır varlıkların lisansı kayıtlıdır. | 3.1, 3.5 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Dudaklarda kıl yoktur, çenede vardır; sakal iki yanda aynıdır; kulak ve ense boştur. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Kaşlar yalnız gözlerin üstünde büyür. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Gözler başlangıçta açıktır, kırpmanın ortasında kapalıdır ve hep aynı anlarda kırpar. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Yanak favori ile ağız arasında çıplaktır; favori kulağın önünde dar bir şerittir; sakalın kenarı önce dik sonra yatık iner; arka kenar aşağı indikçe öne kayar; çene ucu uzun ve öne çıkıktır. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Burun ucu aşağı ve öne iner, kemer yükselir, yüz burun altından uzar; gözler, boyun ve başın arkası yerinde kalır. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Bıyık dudağın üstündedir, ince ve yüze yatıktır, burnun üstünde ve altında büyümez; uçları kavisle inip ağız köşesinde sakala karışır. Çene ucu aşağıdan çok öne çıkar ve dardır. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Figürün yakın görüntüsü altın görüntüyle eşleşir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] `sahne.html?only=figure&shot=head-front` yüzü, gözleri açık ve sakallı gösterir.
- [ ] `portrait` kamerasının görüntüsü 1480 portresiyle yan yana konduğunda aynı kişi tipi okunur: büyük beyaz kavuk, kırmızı başlık, koyu sivri sakal, kürk yaka, kırmızı kaftan.

## Kalan

- **Yüz Fatih'in yüzü değildir:** Tarama başka bir insana aittir; benzerlik kavuk, sakal, kaş, ten rengi ve giysiyle kurulur. Portredeki kemerli burun taramada yoktur.
- **Figür yürümez:** Baş taraması iskeletsizdir; figür ayakta durur, nefes alır, başını çevirir ve göz kırpar.
- **Eller dokusuzdur:** El modeli tek renklidir ve dinlenme duruşundadır.

## Ayrıntılar

### 3.1 — Baş taraması yüklenir ve ölçülür.

- **Mevcut durum:** Figür yoktur.
- **Problem:** Taramanın ölçüsü, yüzün yeri ve gözlerin konumu bilinmeden üstüne hiçbir şey oturtulamaz.
- **Çözüm:** Taramanın üstüne ölçü ızgarası çizen bir inceleme modu (`?grid`) ile yüzün yer işaretleri okunur ve `headMetrics.ts` içine yazılır; gözler, sakal ve kavuk bu ölçülerle yerleştirilir.
- **Dosyalar:** `src/scene3d/character.ts`, `src/scene3d/figure/headMetrics.ts`, `src/scene3d/figure/headShader.ts`, `public/models/head/`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 3.2 — Kapalı gözler açılır ve göz küreleri eklenir.

- **Mevcut durum:** Taramada gözler kapalıdır.
- **Problem:** Gözü kapalı bir figür canlı görünmez.
- **Çözüm:** Göz kapağında badem biçimli bir açıklık kesilir; kenarları kirpik ve kapak kenarı olarak gölgelendirilir. Göz küresi açıklığın dışına taşmaz. Açıklığın genişliği ortak bir değere bağlıdır; deri ve göz birlikte kırpar.
- **Dosyalar:** `src/scene3d/figure/headShader.ts`, `src/scene3d/figure/eyes.ts`, `src/scene3d/figure/idle.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 3.3 — Sakal, bıyık ve kaşlar katmanlı kıl yöntemiyle eklenir.

- **Mevcut durum:** Tarama tıraşlıdır.
- **Problem:** Portrelerdeki Fatih'i tanıtan şeylerden biri sivri, dolgun sakalıdır.
- **Çözüm:** Kılın nerede, ne uzunlukta ve hangi yöne büyüdüğü saf işlevlerle tanımlanır (`hairShape.ts`); dudaklar, elmacık kemikleri ve kulak boş kalır. Katmanlar `hairShells.ts` içinde üretilir; sakalın altındaki deri koyulaştırılır.
- **Dosyalar:** `src/scene3d/figure/hairShape.ts`, `src/scene3d/figure/hairShells.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 3.4 — Kavuk modellenir.

- **Mevcut durum:** Baş çıplaktır.
- **Problem:** Büyük beyaz sarık ve kırmızı başlık figürün en tanınan parçasıdır.
- **Çözüm:** Sarık, baştan yukarı doğru bir profil boyunca üretilen yüzeydir; sargılar birbirinin üstüne binen katlar olarak yüzeyi kabartır ve alında çaprazlanır. Başlık dilimli bir kubbedir.
- **Dosyalar:** `src/scene3d/figure/turban.ts`, `src/scene3d/figure/clothTextures.ts`
- **Testler:** -
- **Durum:** 🟢 Tamamlandı.

### 3.5 — Kaftanlar, kuşak, kürk, yenler, eller ve pabuçlar eklenir.

- **Mevcut durum:** Figürün bedeni yoktur.
- **Problem:** Baş tek başına bir figür değildir; giysi dönemine uygun olmalıdır.
- **Çözüm:** Giysiler bedenin yatay kesitlerinden geçirilen yüzeylerdir (`loft.ts`). Dış kaftanın ön kenarı boyunca ve yakasında kürk şeridi dolaşır; kürk de katmanlı kıl yöntemiyle çizilir. Eller, WebXR Input Profiles'ın genel el modelidir (MIT).
- **Dosyalar:** `src/scene3d/figure/kaftan.ts`, `src/scene3d/figure/loft.ts`, `src/scene3d/figure/fabricTextures.ts`, `src/scene3d/figure/hands.ts`, `public/models/hands/`
- **Testler:** -
- **Durum:** 🟢 Tamamlandı.

### 3.6 — Figür portrelerle üç açıdan kıyaslanır ve farklar giderilir.

- **Mevcut durum:** Figür kuruldu; kıyaslama sürüyor.
- **Problem:** Benzerlik ancak aynı açıdan yan yana bakılarak söylenebilir.
- **Çözüm:** `head-front`, `head-side`, `head-quarter` ve `portrait` kameralarının görüntüleri Gentile Bellini'nin 1480 tarihli portresi ve Sinan Bey'e atfedilen minyatürle yan yana konur; kavuğun oranı, sakalın biçimi, yaka ve renkler buna göre düzeltilir.
- **Dosyalar:** `src/scene3d/figure/`, `tmp/hj2-refs/` (yerel)
- **Testler:** `tests/e2e/scene.spec.ts` (altın görüntü: `portrait`)
- **Durum:** 🟡 Kısmi.

### 3.7 — Burun, yüz uzunluğu ve sakalın çizgisi portreye göre yeniden kurulur.

- **Mevcut durum:** Burun yalnız hafif kemerli ve kısa. Sakalın üst sınırı burun altından kulağa dümdüz gidiyor, kulağın altından enseye yayılıyor; çene ucu küt.
- **Problem:** Yüz portreye benzemiyor (T111). Portrede burun uzun ve kanca gibidir, ucu üst dudağa iner; yüz uzundur; sakal kulağın önünde ince bir favori olarak başlar, çapraz ve kavisli inerek ağız köşesine varır, yanak ve kulak altı çıplaktır; çenede sakal öne çıkık ve sivridir. Önceki kıyaslamada yalnız kavuğa, yakaya ve burnun kemerine bakılmış, sakalın sınır çizgisi kıyaslanmamıştı.
- **Çözüm:** Kulağın ve çenenin taramadaki yeri, derinlik eksenini de gösteren ölçü ızgarasıyla (`?grid`) okunur. `faceShape.ts` burun ucunu aşağı ve öne çeker, kemeri yükseltir ve burun altından çeneye kadar yüzü %12 uzatır; boyun ve başın arkası yerinde kalır. `hairShape.ts` sakalı profilden tanımlar: kulağın önünde dar bir favori şeridi; oradan önce dik, sonra yatık inen bir üst kenar; aşağı indikçe öne kayan bir arka kenar; yalnız çenenin ortasında uzun, öne ve aşağı taranmış bir uç. Bıyık dudaktan biraz kabarır; kaşlar inceltilir.
- **Dosyalar:** `src/scene3d/figure/faceShape.ts`, `src/scene3d/figure/hairShape.ts`, `src/scene3d/figure/headShader.ts`, `src/scene3d/character.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟡 Kısmi. Profil portreyle yan yana kıyaslandı; kullanıcının onayı bekleniyor.

### 3.8 — Bıyık dudağın üstünde ince, aşağı kıvrılan bir çizgi olur; çene ucu dolgun, sivri ve öne çıkık olur.

- **Mevcut durum:** Bıyık kalın, düz bir çubuk gibi öne çıkıyor ve burun ucunu kapatıyor; uçları sakala bağlanmıyor, ağız kenarları boş. Çenede seyrek, dik iğneler var.
- **Problem:** Bıyık burnu kapatıyor ve sakalla alakasız birleşiyor; çene yeterince sivri ve önde değil (T113). Neden: 3.7'de burun aşağı kıvrılınca bıyığın tanımlandığı yükseklik burun ucunun altına denk geldi ve kıllar burnun üstünde büyüdü. Çenedeki iğneler, uzun kılların uca doğru incelmesinden ve boylarının düzensizliğinden geliyordu.
- **Çözüm:** Bıyık, dudağın hemen üstünde ince bir şerit olarak yeniden tanımlanır; şeridin ortası yüzün ortasından uzaklaştıkça hızlanarak alçalır ve ağız köşesinde sakala karışır. Aşağı bakan yüzeylerde (burnun altı) kıl büyümez. Kıllar kısadır ve yüze yatık taranır. Dudak boşluğu daraltılır, sakalın ağız yanındaki kenarı yükseltilir; ağız köşeleri kapanır. Kıl katmanlarına iki ayar eklenir: uca doğru incelme (`taper`) ve boy düzensizliği (`ragged`); sakalda ikisi de düşük tutulur, böylece çene ucu sonuna kadar dolgun kalır. Çene ucu daralır, uzar ve aşağıdan çok öne taranır.
- **Dosyalar:** `src/scene3d/figure/hairShape.ts`, `src/scene3d/figure/hairShells.ts`, `src/scene3d/character.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟡 Kısmi. Profil ve ön görünüş portreyle yan yana kıyaslandı; kullanıcının onayı bekleniyor.

### 3.9 — Kılın büyüdüğü yer, yüz yeniden biçimlendirilmeden önceki taramada belirlenir; burunda kıl kalmaz.

- **Mevcut durum:** Kılın büyüdüğü yer, yeniden biçimlendirilmiş yüzün koordinatlarıyla belirleniyor. 3.8'de yalnız burnun alt yüzü dışlandı.
- **Problem:** Burun ucunda hâlâ bıyık var (T116). Aşağı kıvrılan burun ucunun ön yüzü ve kanatları, yeniden biçimlendirilmiş yüzde bıyık şeridinin yüksekliğine geliyor; yüzeyin yönüne bakan dışlama bunları yakalamıyor.
- **Çözüm:** Tarama yeniden biçimlendirilirken ilk konumlar ayrı bir öznitelik olarak saklanır. Kılın büyüdüğü yer ve derinin sakal altındaki koyuluğu bu ilk konumlarla hesaplanır; kıl, üstünde büyüdüğü deriyle birlikte taşınır. İlk taramada burun ile dudak yükseklikle ayrıldığı için burun, ne yöne bakarsa baksın, kılsız kalır. Sakal tanımındaki yükseklikler taramanın kendi koordinatlarına geri çevrilir.
- **Dosyalar:** `src/scene3d/figure/hairShells.ts`, `src/scene3d/figure/hairShape.ts`, `src/scene3d/character.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟡 Kısmi. Burun yandan ve üç çeyrekten yakın çekimde kontrol edildi; kullanıcının onayı bekleniyor.

### Referanslar

- Gentile Bellini, Sultan II. Mehmed, 1480 (National Gallery, Londra) — Wikimedia Commons, `Gentile Bellini 003.jpg`
- Sinan Bey'e atfedilen, gül koklayan Fatih minyatürü, 1480 dolayı (Topkapı Sarayı Müzesi) — Wikimedia Commons, `Sarayi Album 10a.jpg`
- Baş taraması: Lee Perry-Smith, CC BY 3.0 — `public/models/head/LICENSE.txt`
- El modelleri: WebXR Input Profiles, MIT — `public/models/hands/LICENSE.txt`
