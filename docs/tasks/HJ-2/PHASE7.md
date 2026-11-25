# Faz 7 — Ses: anlatıcının sesi, ortam sesi ve ses denetimi

> **Durum:** 🟡 Kısmi · **Tamamlanma:** 80% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Sahneye ses eklenir. Bitince Fatih fetih planını sesli anlatır, ocak hafifçe çıtırdar ve oyuncu sesi tek düğmeyle
kapatıp açabilir.

## Problem

- Sahne sessizdir; anlatım yalnız yazıyla okunur (T115).
- Ses Fatih'e uygun olmalıdır: yetişkin bir erkek sesi, ağırbaşlı ve acelesiz (T115).
- Depoya konabilecek, lisansı temiz bir Türkçe ses kaynağı hazırda yoktur (araştırma: `questions/S01-anlatici-sesinin-kaynagi.md`).

## Çözüm

- **Anlatıcı:** Bir adım gösterildiğinde metni seslendirilir; adım değişince ya da anlatım kapanınca ses kesilir. İki kaynak desteklenir: adımın kayıtlı ses dosyası varsa o çalınır; yoksa cihazın Türkçe sesi okur (tarayıcının konuşma sentezi). Bugün yalnız ikincisi kullanılır; hangi kaynağın kalıcı olacağı S1'de sorulmuştur.
- **Fatih'e uygun ses:** Cihazdaki Türkçe sesler arasından bilinen erkek sesleri öne alınır; ses biraz kalınlaştırılır ve yavaşlatılır. Türkçe ses yoksa anlatım yazıyla sürer ve bu söylenir.
- **Ortam sesi:** Ocağın çıtırtısı ve odanın hafif uğultusu kodla üretilir (ses dosyası yoktur); ocağa yaklaştıkça artar, Fatih konuşurken kısılır.
- **Ses denetimi:** Ekranda bir ses düğmesi (ve M tuşu) bütün sesi kapatıp açar; seçim hatırlanır. Sekme arka plana geçince ses durur.
- **Yazı her zaman vardır:** Anlatım paneli altyazı işlevini görür; ses kapalıyken hiçbir bilgi kaybolmaz.

## En iyi uygulamalar (araştırma)

| Uygulama | Buradaki karşılığı |
|----------|---------------------|
| Tarayıcılar, kullanıcı bir şeye basmadan ses başlatmaz. | Ses, ilk tıklama ya da tuşla başlatılır; anlatım zaten bir tuşla açılır. |
| Tek ses bağlamı ve ana ses düzeyi; türlere ayrı düzey. | `soundStage.ts`: bir bağlam, ana düzey, ortam için ayrı düzey. |
| Sessize alma her zaman erişilebilir ve hatırlanır. | Ses düğmesi, M tuşu, `localStorage`. |
| Konuşma her zaman yazıyla birlikte verilir. | Anlatım paneli. |
| Konuşurken ortam sesi kısılır (ducking). | Ortam düzeyi konuşma sırasında düşer. |
| Replikler üst üste binmez. | Adım değişince önceki konuşma kesilir. |
| Sekme görünmezken ses durur. | `visibilitychange` ile bağlam askıya alınır, konuşma kesilir. |
| Kayıtlı konuşma: replik başına bir dosya, sıkıştırılmış ve her tarayıcının çaldığı biçimde (MP3 ya da AAC), eşit ses yüksekliğinde. | Kayıtlı kaynak seçilirse uygulanacak; yapı hazır. |
| Uzun metin sentezde cümle cümle verilir (bazı tarayıcılar uzun konuşmayı yarıda keser). | Metin cümlelere bölünür ve sıraya konur. |

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 7.1 | Ses ayarı (açık/kapalı) saklanır ve bir düğmeyle değiştirilir. | 🟢 Tamamlandı |
| 7.2 | Anlatıcı, gösterilen adımı cihazın Türkçe sesiyle okur. | 🟢 Tamamlandı |
| 7.3 | Kayıtlı ses dosyası olan adım kayıttan çalınır. | 🟢 Tamamlandı |
| 7.4 | Ocak ve oda için ortam sesi kodla üretilir. | 🟢 Tamamlandı |
| 7.5 | Anlatıcı sesinin kalıcı kaynağı karara bağlanır (S1). | ⏳ Bekliyor |
| 7.6 | Ocak sesi yeniden kurulur: metalik tıkırtı kalkar, düzey düşer. | 🟡 Kısmi |
| 7.7 | Anlatıcının sesi kalınlaştırılır ve ağırlaştırılır. | 🟡 Kısmi |
| 7.8 | Fatih konuşurken ağzı oynar. | 🟡 Kısmi |
| 7.9 | Ana ses, konuşma ve ortam için ayrı düzey ayarı eklenir. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K10 (T115) | Anlatım sesli verilir; ses Fatih'e uygundur; oyuncu sesi kapatabilir. | 7.1–7.5 |
| K6 | Kullanılan her hazır varlığın lisansı temizdir. | 7.3, 7.5 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Ses ayarı varsayılan olarak açıktır, değiştirilince saklanır, bozuk kayıt varsayılana döner. | `tests/unit/sceneSound.test.ts` | 🟢 Tamamlandı |
| Sesler arasından Türkçe olan, tercihen bilinen bir erkek sesi seçilir; Türkçe ses yoksa seçim boştur. | `tests/unit/sceneSound.test.ts` | 🟢 Tamamlandı |
| Metin cümlelere bölünür; kısaltmadaki nokta cümleyi bölmez. | `tests/unit/sceneSound.test.ts` | 🟢 Tamamlandı |
| Ortam sesinin düzeyi ocağa uzaklıkla azalır, konuşma sırasında düşer. | `tests/unit/sceneSound.test.ts` | 🟢 Tamamlandı |
| Anlatım başlayınca ilk adım okunur; ileri gidince önceki kesilir ve yenisi okunur; kapanınca susar. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Ses düğmesi sesi kapatır: okunmakta olan kesilir, yeni adım okunmaz; seçim yeniden açılışta korunur. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Üretilen ortam sesi sessiz değildir ve kırpılmaz. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [ ] Anlatım başlatılır; Fatih'in sözleri duyulur. İleri gidilince yeni adım okunur.
- [ ] Ses düğmesine (ya da M'ye) basılır; ses kesilir. Sayfa yenilenir; ses kapalı kalır.
- [ ] Ocağa yaklaşılır; çıtırtı artar. Anlatım sırasında çıtırtı kısılır.
- [ ] Sesin Fatih'e uygun olup olmadığı dinlenerek değerlendirilir.

## Kalan

- **Ses dinlenerek doğrulanmadı:** Sesin Fatih'e uygunluğu, ocak sesinin hoş olup olmadığı ve düzeylerin dengesi yalnız dinlenerek anlaşılır. Otomatik olarak yalnız şunlar sınandı: doğru metnin, bir Türkçe erkek sesiyle, yavaş ve kalın okutulmak üzere cihaza verildiği; ortam sesinin sessiz olmadığı ve kırpılmadığı (4 saniyede tepe 0,75, ortalama 0,11).
- **Ses cihaza bağlıdır:** Bu makinede tarayıcının sunduğu tek Türkçe ses Microsoft Tolga'dır (erkek); anlatıcı onu seçer. Başka cihazlarda ses farklı, bazılarında kadın sesi olur; Türkçe ses yoksa anlatım yazıyla sürer ve bunu söyleyen bir not görünür.
- **Kalıcı ses kaynağı karar bekliyor (7.5):** `questions/S01-anlatici-sesinin-kaynagi.md`. Karar gelene kadar faz kapatılmaz.
- **Kayıtlı ses yolu denenmedi:** Şema ve çalma kodu yazıldı, ama depoda ses dosyası olmadığı için gerçek bir dosyayla çalıştırılmadı.
- **Ayak sesi ve müzik yok;** yalnız konuşma ve ocak sesi var.
- **Ağız hareketi sözcükleri izlemez:** Heceye benzer bir tempoda açılıp kapanır; dudak biçimleri (o, u, m) yoktur.
- **Konuşan sesin düzeyi anında değişmez:** Bir adımın cümleleri cihaza baştan, o anki düzeyle verilir; konuşma kaydırıcısı okunmakta olan adımı etkilemez, sonraki adımdan itibaren geçerlidir.

## Ayrıntılar

### 7.1 — Ses ayarı (açık/kapalı) saklanır ve bir düğmeyle değiştirilir.

- **Mevcut durum:** Ses yoktur; ayarı da yoktur.
- **Problem:** Ses çıkaran her uygulamada oyuncu sesi kapatabilmelidir ve seçimi her açılışta yeniden yapmak zorunda kalmamalıdır.
- **Çözüm:** Ayar saf bir modüldür (`soundSettings.ts`): okunur, değiştirilir, saklanır; saklama yeri dışarıdan verilir. Ekranda bir düğme ve M tuşu ayarı değiştirir; düğmenin üstünde durumu yazar.
- **Dosyalar:** `src/scene3d/audio/soundSettings.ts`, `src/scene3d/audio/soundStage.ts`, `src/scene3d/scene.css`
- **Testler:** `tests/unit/sceneSound.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 7.2 — Anlatıcı, gösterilen adımı cihazın Türkçe sesiyle okur.

- **Mevcut durum:** Adımın metni yalnız panelde yazar.
- **Problem:** Anlatım sesli olmalı ve ses Fatih'e uygun olmalıdır (T115); depoya konabilecek lisanslı bir ses dosyası yoktur.
- **Çözüm:** Tarayıcının konuşma sentezi kullanılır; ses dosyası dağıtılmaz. Sesler arasından dili Türkçe olanlar alınır; adı bilinen erkek seslerinden biri varsa o, yoksa ilk Türkçe ses seçilir (`voiceChoice.ts`). Ses biraz kalın ve yavaş okutulur. Metin cümlelere bölünerek sıraya konur. Türkçe ses yoksa panelde kısa bir not görünür ve anlatım yazıyla sürer.
- **Dosyalar:** `src/scene3d/audio/voiceChoice.ts`, `src/scene3d/audio/narrator.ts`, `src/scene3d/briefing/briefingSession.ts`
- **Testler:** `tests/unit/sceneSound.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 7.3 — Kayıtlı ses dosyası olan adım kayıttan çalınır.

- **Mevcut durum:** Anlatım verisinde ses alanı yoktur.
- **Problem:** Kalıcı çözüm seçildiğinde (S1) kod yeniden yazılmamalıdır.
- **Çözüm:** Anlatım şemasına adım başına isteğe bağlı `audio` alanı eklenir (depodaki bir dosyanın yolu). Alan doluysa o adım dosyadan çalınır, boşsa cihazın sesi okur. Bugün hiçbir adımda dolu değildir.
- **Dosyalar:** `src/scene3d/briefing/briefingSchema.ts`, `src/scene3d/audio/narrator.ts`
- **Testler:** `tests/unit/sceneSound.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 7.4 — Ocak ve oda için ortam sesi kodla üretilir.

- **Mevcut durum:** Ocakta ateş yanar ama ses yoktur.
- **Problem:** Sessiz bir oda cansız durur; hazır ses dosyası kullanmak lisans yükü getirir.
- **Çözüm:** Ses, Web Audio ile üretilir: süzülmüş gürültüden bir ateş uğultusu ve rastgele aralıklı kısa çıtırtılar. Düzey, oyuncunun ocağa uzaklığına göre değişir ve konuşma sırasında düşer; bu hesap saf bir işlevdir. Üretilen sesin düzeyi otomatik sınanır (sessiz değil, kırpılmıyor).
- **Dosyalar:** `src/scene3d/audio/ambience.ts`, `src/scene3d/audio/ambienceLevel.ts`, `src/scene3d/SceneApp.ts`
- **Testler:** `tests/unit/sceneSound.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 7.5 — Anlatıcı sesinin kalıcı kaynağı karara bağlanır (S1).

- **Mevcut durum:** Cihazın sesi geçici çözümdür.
- **Problem:** Cihaz sesi her yerde aynı değildir ve Fatih'e özgü bir karakter taşımaz; kalıcı kaynak bir lisans ve maliyet kararıdır.
- **Çözüm:** Seçenekler `questions/S01-anlatici-sesinin-kaynagi.md` kartında sunulur; karar gelince dosyalar üretilir ve 7.3'teki alan doldurulur.
- **Dosyalar:** `docs/tasks/HJ-2/questions/S01-anlatici-sesinin-kaynagi.md`
- **Testler:** -
- **Durum:** ⏳ Bekliyor.

### 7.6 — Ocak sesi yeniden kurulur: metalik tıkırtı kalkar, düzey düşer.

- **Mevcut durum:** Çıtırtı, saniyede yaklaşık dört kez açılıp kapanan, 1700 Hz üstü parlak gürültü patlamalarıdır; uğultu 3 saniyelik bir döngüdür.
- **Problem:** Ses, bir pervanenin bir şeye çarpması ya da metale vurulması gibi duyuluyor; ortam sesi de fazla yüksek (T119). İlk sürümde yalnız düzey ölçülmüş, tını ölçülmemişti.
- **Çözüm:** Parlak patlamalar kaldırılır. Çıtırtı, seyrek (yaklaşık iki saniyede bir), alçak perdeli (320–900 Hz), yumuşak sönen kısa bir "pat" olur. Uğultu 11 saniyelik, ucu başına geçişli bir döngüdür ve yavaşça kabarıp iner. Ocağın yanındaki düzey 0,42'den 0,25'e iner; ortam ayrıca %50 düzeyle açılır. Sesin 2 kHz üstündeki enerji payı otomatik sınanır.
- **Ölçüm:** tepe 0,51, ortalama 0,10, 2 kHz üstü enerji payı 0,00008.
- **Dosyalar:** `src/scene3d/audio/ambience.ts`, `src/scene3d/audio/ambienceLevel.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟡 Kısmi. Tını ölçüldü ama dinlenmedi; kullanıcının onayı bekleniyor.

### 7.7 — Anlatıcının sesi kalınlaştırılır ve ağırlaştırılır.

- **Mevcut durum:** Cihazın sesi 0,8 perde ve 0,9 hızla okutuluyor.
- **Problem:** Ses ince; daha otoriter ve kalın olmalı, ama çok kalın değil, yaşına uygun (T119).
- **Çözüm:** Perde 0,55'e, hız 0,88'e indirilir. Doğru değer yalnız dinleyerek bulunabileceği için adres satırındaki `?pitch=` ve `?rate=` değerleri kodu değiştirmeden başka bir okuyuş dener. Bazı cihaz sesleri istenen perdeye uymaz; kalıcı ve denetimli çözüm kayıtlı sestir (S1).
- **Dosyalar:** `src/scene3d/audio/narrator.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟡 Kısmi. Değer dinlenerek onaylanmadı.

### 7.8 — Fatih konuşurken ağzı oynar.

- **Mevcut durum:** Figür konuşurken yüzü hareketsizdir.
- **Problem:** Ses var ama ağız kıpırdamıyor (T119). Baş taramasının iskeleti ve açık ağzı yoktur.
- **Çözüm:** Taramanın alt çenesine ait noktalar belirlenir (`jaw.ts`: çene ve alt dudak tam, çene eklemine doğru azalarak, üst dudak ve boyun hiç). Konuşma sırasında bu noktalar, hecelerin hızında düzensizce açılıp kapanan bir değerle aşağı ve hafifçe geriye iner; sakal birlikte hareket eder. Dudakların arasında gerilen şerit koyu boyanır, ağız açıklığı olarak okunur. Hareket sözcüklerin seslerini izlemez; yalnız konuşma sürerken oynar.
- **Dosyalar:** `src/scene3d/figure/jaw.ts`, `src/scene3d/figure/idle.ts`, `src/scene3d/figure/headShader.ts`, `src/scene3d/figure/hairShells.ts`, `src/scene3d/character.ts`, `src/scene3d/SceneApp.ts`
- **Testler:** `tests/unit/scene3d.test.ts`
- **Durum:** 🟡 Kısmi. Açık ağız sabit karede kontrol edildi; hareketli hâli görülmedi.

### 7.9 — Ana ses, konuşma ve ortam için ayrı düzey ayarı eklenir.

- **Mevcut durum:** Tek bir aç/kapa düğmesi vardır.
- **Problem:** Konuşma ile ortam sesi ayrı ayrı ayarlanabilmelidir (T120).
- **Çözüm:** Ayar üç düzey taşır: ana ses, konuşma, ortam. "Ses ayarları" düğmesi üç kaydırıcılı bir pano açar. Bir kanalın duyulan düzeyi kendi düzeyi ile ana sesin çarpımıdır; ses kapalıyken sıfırdır. Düzeyler saklanır; eski kayıt (yalnız aç/kapa) okunur ve eksikler varsayılanla tamamlanır.
- **Dosyalar:** `src/scene3d/audio/soundSettings.ts`, `src/scene3d/audio/soundStage.ts`, `src/scene3d/audio/narrator.ts`, `src/scene3d/scene.css`
- **Testler:** `tests/unit/sceneSound.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- MDN, Web Audio API best practices — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- Chrome, Autoplay policy — https://developer.chrome.com/blog/autoplay
- Piper `tr_TR-dfki` model kartı (veri kümesi lisansı CC BY-NC-SA 4.0) — https://huggingface.co/rhasspy/piper-voices
