# Faz 5 — İlk kullanım geri bildirimi: karakter düzeltmeleri ve haritada fetih planı

> **Durum:** 🟡 Kısmi · **Tamamlanma:** 90% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Sahnenin ilk denemesinden gelen geri bildirim uygulanır. Bitince sakal ile kürk yaka birbirinden ayrılır ve kıpırdamaz,
bıyık düzgün durur, ve Fatih masadaki açık haritanın başında fetih planını adım adım anlatır.

## Problem

- Sakal ile kürk yaka aynı renk ve dokuda; birbirinden ayrılmıyor (T92).
- Sakal ve kürk sürekli kıpırdıyor: kıl noktaları ekranda bir pikselden küçük kalınca titreşiyor (T92).
- Bıyık tuhaf duruyor: kıllar yana doğru dikiliyor (T92).
- Elin bir kısmı dış kaftanın eteğinin içine giriyor (T94).
- Etrafa bakmak için fareyi basılı tutup sürüklemek gerekiyor; doğrudan fareyi hareket ettirerek bakılmak isteniyor (T96).
- Sahnede yapılacak bir şey yok; figürün karşısına geçmek tek başına bir çerçeve oluşturmuyor (T92).
- Sahne tek figür için yazıldı; başka figürlerde yeniden kullanılacak parçalar ayrılmalı (T92).

## Çözüm

- **Sakal ve kürk ayrışır:** Sakal koyu kahverengi ve kısa, kürk açık kumral ve uzun tüylü olur; arada iç kaftanın kırmızı yakası görünür.
- **Titreşim giderilir:** Kıl telleri ekranda küçüldükçe tek tek çizilmez, dolgun bir yüzeye dönüşür; uzaktan sakin, yakından tel tel görünür.
- **Bıyık:** Kıllar dudağın üstünde aşağı ve yana yatar, kısalır.
- **Fetih planı:** Figürün önünde üstünde harita açık bir masa durur. Oyuncu yaklaşıp dinlemeyi seçince kamera masanın başına geçer; Fatih altı adımda planı anlatır, her adımda haritada ilgili yer işaretlenir ve Fatih oraya bakar.
- **Ortak modüller:** Anlatım (adımlar arasında gezinme), harita panosu (veriden çizim) ve anlatım paneli figürden bağımsızdır; bir figürün anlatımı yalnız veridir (metin + harita tanımı).

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 5.1 | Sakal ile kürk yaka renk ve dokuyla ayrılır. | 🟢 Tamamlandı |
| 5.2 | Kıl katmanlarının uzaktan titreşmesi giderilir. | 🟢 Tamamlandı |
| 5.3 | Bıyık dudağın üstüne yatırılır. | 🟢 Tamamlandı |
| 5.4 | Anlatım verisi ve adımlar arasında gezinme yazılır. | 🟢 Tamamlandı |
| 5.5 | Masa ve üstündeki harita kurulur; adımın yerleri haritada işaretlenir. | 🟢 Tamamlandı |
| 5.6 | Oyuncu anlatımı başlatır, adımlar arasında gezer ve bitirir; Fatih haritaya bakar. | 🟢 Tamamlandı |
| 5.7 | Eller kaftanın içine girmez. | 🟢 Tamamlandı |
| 5.8 | Etrafa, fare sürüklenmeden, hareket ettirilerek bakılır. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K3 | Karakter gerçek bir insan gibi görünür; sakal ve giysi birbirinden ayrılır. | 5.1, 5.2, 5.3 |
| K7 (T92) | Figür, masadaki açık haritada fetih planını adım adım anlatır. | 5.4, 5.5, 5.6 |
| K8 (T92) | Anlatımın parçaları başka figürler için yeniden kullanılabilir. | 5.4, 5.5 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Anlatım ilk adımda başlar, ileri ve geri gider, son adımdan ileri gidince biter. | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Anlatım verisi geçerlidir: her adımın metni vardır, işaret ettiği her yer haritada tanımlıdır, kaynakları yazılıdır. | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Haritadaki her yer panonun içindedir. | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Masa oyuncuyu durdurur; figür ile masa çakışmaz. | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Oyuncu masaya yürür, anlatımı başlatır, altı adımı gezer ve bitirir; bitince yeniden yürüyebilir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Anlatımın bir adımı sabit kameradan altın görüntüyle eşleşir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Anlatım herhangi bir adımda kapatılabilir; ipucu metni bakma biçimini söyler. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| El ve ön kol dış kaftanın eteğinin dışındadır; bıyık dudağın üstüne yatar. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [ ] Figüre yandan yakından bakılır: sakal koyu, kürk açık renklidir; arada kırmızı yaka görünür; ikisi de kıpırdamaz.
- [x] Masaya yaklaşılır, "Fetih planını dinle" seçilir; kamera masanın başına geçer.
- [x] İleri ve geri ile altı adım gezilir; her adımda haritada ilgili yer parlar ve Fatih oraya bakar.
- [x] Anlatım bitince ya da kapatılınca oyuncu kaldığı yerden yürümeye devam eder.

## Kalan

- **Karıncalanma hareketli görüntüde doğrulanmadı:** Düzeltme tek karelere bakılarak yapıldı (kıllar uzaklaştıkça bir pikselden küçük çizilmiyor). Titreşimin gerçekten bittiği, sahnede dolaşılarak gözle kontrol edilmelidir; bu yüzden faz kapatılmadı.
- **Fareyle bakma elle denenmedi:** Başsız tarayıcı fare kilidini vermez; testler yalnız ipucu metnini ve sürükleyerek bakmanın bozulmadığını sınar.
- **Sakal yakın planda hâlâ kaba:** Tek tek teller yerine çizgili bir kütle olarak çiziliyor; kenarı pürüzlü. Kaşlar da aynı yöntemle çizildiği için kaba.
- **Fatih haritayı eliyle göstermiyor:** Kollar sabit; anlatırken yalnız başını ve gözlerini işaretlenen yere çeviriyor.
- **Harita şematik:** Kıyılar ve uzaklıklar ölçekli değil; `conquestMap.ts` bunu belirtir.
- **Anlatım metni geriye dönük:** Oda 1470'lere ait olduğu için Fatih planı 1453'ü hatırlayarak anlatır. Olgular figürün içerik kaydındaki iki kaynağa (TDV İslâm Ansiklopedisi, Vikipedi) dayanır; cümleler ayrıca tek tek kaynakla eşleştirilmedi.
- **Review yapılmadı:** Haftalık kullanım sınırı gözetilerek bu faz için çok ajanlı `/h-review` çalıştırılmadı; tsc, ESLint ve testler temiz.
- **Dokunmatik denetim gerçek telefonda denenmedi.**

## Ayrıntılar

### 5.1 — Sakal ile kürk yaka renk ve dokuyla ayrılır.

- **Mevcut durum:** Sakal ve kürk aynı kahverengi tonlarda, aynı yöntemle (katmanlı kıl) çiziliyor; sakal doğrudan kürkün üstüne iniyor.
- **Problem:** Yandan bakınca sakalın nerede bitip yakanın nerede başladığı görünmüyor (T92).
- **Çözüm:** Sakal koyulaştırılır ve boyun altında kısaltılır. Kürk açık kumral yapılır, tüyleri uzatılır ve kalınlaştırılır; taban dokusu da açılır. Dış kaftanın yakası boyunda biraz açılır ki iç kaftanın kırmızı yakası arada görünsün.
- **Dosyalar:** `src/scene3d/figure/hairShape.ts`, `src/scene3d/figure/kaftan.ts`, `src/scene3d/figure/fabricTextures.ts`, `src/scene3d/character.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.2 — Kıl katmanlarının uzaktan titreşmesi giderilir.

- **Mevcut durum:** Her katmanda kıl telleri küçük noktalar olarak çizilir. Figür uzaklaşınca bir nokta bir pikselden küçük kalır.
- **Problem:** Pikselden küçük noktalar kareden kareye belirip kaybolur; sakal ve kürk sürekli hareket ediyor gibi görünür (T92).
- **Çözüm:** Parça gölgelendiricisi, bir kıl hücresinin ekranda kaç piksel tuttuğunu ölçer. Hücre küçüldükçe teller kalınlaşır ve üst katmanlar çizilmez; uzakta yüzey dolgun ve sakin, yakında tel tel olur.
- **Dosyalar:** `src/scene3d/figure/hairShells.ts`
- **Testler:** `tests/e2e/scene.spec.ts` (altın görüntüler)
- **Durum:** 🟢 Tamamlandı.

### 5.3 — Bıyık dudağın üstüne yatırılır.

- **Mevcut durum:** Bıyık kılları yana ve öne doğru büyüyor.
- **Problem:** Bıyık dikilmiş gibi, tuhaf duruyor (T92).
- **Çözüm:** Kıllar aşağı ve hafif yana yatırılır, kısaltılır; burnun altındaki oluk seyrek bırakılır.
- **Dosyalar:** `src/scene3d/figure/hairShape.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.4 — Anlatım verisi ve adımlar arasında gezinme yazılır.

- **Mevcut durum:** Sahnede figürün kısa tanıtım kartından başka içerik yok.
- **Problem:** Fetih planı anlatılacak; metin kodun içine gömülürse başka figürler için yeniden kullanılamaz ve içerik kurallarının dışında kalır (T92).
- **Çözüm:** Anlatım `content/scenes/mehmed-ii.json` içinde veridir: başlık, adımlar (başlık, metin, haritada işaretlenen yerler) ve kaynaklar. Şeması `briefingSchema.ts` içindedir. Adımlar arasında gezinme saf işlevlerdir (`narration.ts`): başla, ileri, geri, bitir. Metinler Fatih'in ağzından, 1470'lerde geriye dönük anlatım olarak yazılır; olgular figürün içerik kaydındaki kaynaklara dayanır.
- **Dosyalar:** `content/scenes/mehmed-ii.json`, `src/scene3d/briefing/briefingSchema.ts`, `src/scene3d/briefing/narration.ts`
- **Testler:** `tests/unit/briefing.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.5 — Masa ve üstündeki harita kurulur; adımın yerleri haritada işaretlenir.

- **Mevcut durum:** Figürün önü boş halıdır.
- **Problem:** Planın anlatılacağı bir harita ve onun duracağı bir masa yok (T92).
- **Çözüm:** Figürün önüne alçak, geniş bir masa konur; üstünde parşömen bir harita açıktır. Harita bir tanımdan çizilir (`mapBoard.ts`): kara parçaları, surlar, yerler ve yollar; etkin adımın yerleri zamanla atan bir vurguyla işaretlenir. İstanbul ve Boğaz'ın tanımı `conquestMap.ts` içindedir ve şematiktir (ölçekli değildir). Masa oyuncunun yürüyüşünde bir engeldir.
- **Dosyalar:** `src/scene3d/briefing/mapBoard.ts`, `src/scene3d/briefing/conquestMap.ts`, `src/scene3d/briefing/table.ts`
- **Testler:** `tests/unit/briefing.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.6 — Oyuncu anlatımı başlatır, adımlar arasında gezer ve bitirir; Fatih haritaya bakar.

- **Mevcut durum:** Figüre yaklaşınca yalnız tanıtım kartı açılıyor.
- **Problem:** Anlatımın oyunda bir yeri olmalı: başlatılmalı, izlenmeli ve bitince oyuna dönülmeli (T92).
- **Çözüm:** Figüre ya da masaya yaklaşınca "Fetih planını dinle" düğmesi görünür. Başlayınca yürüyüş durur, kamera masanın karşısına yumuşakça geçer ve anlatım paneli açılır (adım başlığı, metin, sayaç, Geri / İleri / Kapat). Adımın yerleri haritada parlar; Fatih başını ve gözlerini o yere çevirir, işaret yoksa oyuncuya bakar. Bitince kamera oyuncunun bıraktığı yere döner. Tanıtım kartı panelin ilk ekranı olur.
- **Dosyalar:** `src/scene3d/briefing/briefingHud.ts`, `src/scene3d/SceneApp.ts`, `src/scene3d/character.ts`, `src/scene3d/hud.ts`, `src/scene3d/scene.css`, `src/scene3d/shots.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.7 — Eller kaftanın içine girmez.

- **Mevcut durum:** Bilek, dış kaftanın eteğinin en geniş olduğu yükseklikte, eteğin yüzeyinin hemen içinde duruyor.
- **Problem:** Elin bir kısmı kumaşın içinde kalıyor (T94).
- **Çözüm:** Dirsek, ön kol ve bilek dışarı alınır; el eteğin dışında sarkar. Dış kaftanın kısa yeni de buna göre açılır.
- **Dosyalar:** `src/scene3d/figure/kaftan.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 5.8 — Etrafa, fare sürüklenmeden, hareket ettirilerek bakılır.

- **Mevcut durum:** Bakış, fare düğmesi basılıyken sürüklenerek döner.
- **Problem:** Oyunlardaki gibi doğrudan fareyi hareket ettirerek bakılmak isteniyor (T96).
- **Çözüm:** Sahneye tıklanınca fare imleci kilitlenir (pointer lock) ve fare hareketi doğrudan bakışı döndürür; Esc kilidi bırakır. Kilit alınamayan cihazlarda ve dokunmatik ekranda sürükleyerek bakma kalır. İpucu metni buna göre değişir.
- **Dosyalar:** `src/scene3d/controls.ts`, `src/scene3d/hud.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `MAIN_TODO.md` → Kabul ölçütleri
- `content/figures/mehmed-ii.json` → `sources`, `actions` (İstanbul'un fethi)
