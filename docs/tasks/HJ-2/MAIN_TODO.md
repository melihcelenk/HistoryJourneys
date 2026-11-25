# TODO: [HJ-2] Tarihî figür için 3B sahne: Fatih Sultan Mehmed sarayın bir odasında

> **📌 Referans Dokümanlar:**
>
> - `MAIN_TODO.md` - Bu dosya (ana takip)
> - `PHASE{N}.md` - Her fazın detaylı implementasyon planı
> - `TALIMATLAR.md` - Kullanıcının her talimatı ve alındığı faz (yerel)
> - `REFERENCES.md` - Oda ve karakter için bakılan görsel ve yazılı kaynaklar
> - `../../requirements/history-journeys.md` - Platform gereksinimleri

<!-- Bu açık kaynak, kişisel bir projedir; Lima ve Jira kullanılmaz (HJ-1 → T7). -->
**🧪 Lima projesi:** `yok`

---

## 🌿 Branch Bilgisi

| Repo | Yol | Branch | Nereden açıldı | PR hedefi | Rolü |
|------|-----|--------|----------------|-----------|------|
| `HistoryJourneys` (ana repo) | `C:\Kodlar\HistoryJourneys` | `feature/HJ-1` | `main` | `main` | Web uygulaması; 3B sahne aynı dalda geliştirilir (T74) |

Başlamadan önceki durum `release/test` dalına kaydedildi (commit `6910be8`).

---

## 📊 Genel İlerleme

| Faz | Başlık | Durum | Tamamlanma | Dosya |
|-----|--------|-------|------------|-------|
| 1 | Sahne altyapısı ve kendi kendine ilerleyen görsel test düzeni | 🟢 Tamamlandı | 100% | `PHASE1.md` |
| 2 | Saray odası | 🟢 Tamamlandı | 100% | `PHASE2.md` |
| 3 | Fatih Sultan Mehmed karakteri | 🟡 Kısmi | 90% | `PHASE3.md` |
| 4 | Oyun hissi: dolaşma, ışık, etkileşim ve uygulamaya bağlama | 🟢 Tamamlandı | 100% | `PHASE4.md` |
| 5 | İlk kullanım geri bildirimi: karakter düzeltmeleri ve haritada fetih planı | 🟡 Kısmi | 90% | `PHASE5.md` |
| 6 | İkinci geri bildirim: dönem masası, dönemin haritası, Osmanlıca yazılar ve başarım | 🟡 Kısmi | 90% | `PHASE6.md` |

<!-- Durum ikonları: 🟢 Tamamlandı | 🟡 Kısmi | ⏳ Bekliyor | 🔴 Bloke -->

---

## ✅ Hazırlık Durumu

- [x] Mevcut durum `release/test` dalına kaydedildi.
- [x] Karakter için açık lisanslı kaynak bulundu ve indirildi (aşağıda Plan A).
- [x] Yarım saatlik değerlendirme alarmı kuruldu; çalışma 07:00'ye kadar sürer.
- [x] Plan bu dokümanda; uygulama talimatı T74 ile verildi ("kendi önerinle devam et").

---

## 📝 Task Definition

### Mevcut Durum

- Uygulama iki boyutludur: harita, kartlar ve portreler. Figürler haritada portre ya da simgeyle görünür.
- Üç boyutlu bir sahne, model ya da oyun motoru yoktur.

### İstenen

- Tarihî figürlerden biri için çok küçük, gerçek bir oyun gibi görünen üç boyutlu bir sahne: Fatih Sultan Mehmed, sarayın bir odasında (T73, T74).
- **Karakter düzgün olmalı:** gerçek bir insan gibi görünmeli ve Fatih'in bilinen portrelerindeki hatlara benzemeli.
- **Oda düzgün olmalı:** nasıl görüneceği araştırılarak ve kaynakla teyit edilerek kurulmalı.
- Sahne, sabit açılardan alınan ekran görüntüleriyle referanslara karşı kıyaslanarak geliştirilmeli; kabul edilebilir düzeyde eşleşmiyorsa çalışmaya devam edilmeli.
- Testler, oyun geliştirenlerin kullandığı yöntemlere bakılarak kurulmalı ve kendi kendine çalışmalı.
- Kapsam bilerek küçüktür: bir karakter, bir oda.

### Kabul ölçütleri

| # | Ölçüt | Nasıl ölçülür |
|---|-------|---------------|
| K1 | Sahne açılır ve hata vermeden çizilir. | Uçtan uca test: hazır işareti, konsolda hata yok |
| K2 | Oda, dönemin bir saray odası olarak tanınır: çinili duvar, kemerli nişler, ocak, sedir, halı, pencereden gelen ışık. | Sabit açılardan ekran görüntüleri, `REFERENCES.md` içindeki görsellerle yan yana |
| K3 | Karakter gerçek bir insan gibi görünür; kavuk, sakal ve kaftan dönemine uygundur. | Önden, yandan ve üç çeyrek açıdan ekran görüntüleri, Bellini ekolü portresiyle yan yana |
| K4 | Oyuncu odada dolaşabilir; duvarlardan ve eşyalardan geçemez. | Birim testi (çarpışma), uçtan uca test (klavye ile yürüme) |
| K5 | Akıcı çalışır. | Çizim çağrısı ve üçgen sayısı bütçesi testi |
| K6 | Kullanılan her hazır varlığın lisansı kayıtlıdır ve sahnede gösterilir. | İçerik denetimi, "Hakkında" metni |
| K7 | Figür, masadaki açık haritada fetih planını adım adım anlatır (T92). | Uçtan uca test: anlatım başlar, adımlar gezilir, biter |
| K8 | Anlatımın parçaları (adımlar arasında gezinme, harita panosu, panel) başka figürler için yeniden kullanılabilir (T92). | Anlatım yalnız veriyle tanımlanır; birim testleri veriyi doğrular |

### Test Senaryoları

| Senaryo | Tür |
|---------|-----|
| Sahne sayfası açılır, "hazır" işareti gelir, konsolda hata yoktur. | Uçtan uca |
| Her sabit kamera açısı için ekran görüntüsü alınır ve kayıtlı altın görüntüyle karşılaştırılır. | Görsel regresyon |
| Oda ölçüleri, duvarlar ve eşyalar tanımdan üretilir; oyuncu duvarın ve eşyanın içine giremez. | Birim |
| Çini ve halı desenleri aynı girdiyle hep aynı görüntüyü üretir. | Birim |
| Çizim çağrısı ve üçgen sayısı bütçenin altındadır. | Uçtan uca |
| Karaktere yaklaşınca adı ve kısa tanıtımı görünür; karttan sahneye, sahneden karta geçilir. | Uçtan uca |

### Error Cases

- WebGL açılamazsa sahne yerine açıklayıcı bir not gösterilir; uygulamanın geri kalanı etkilenmez.
- Karakter modeli yüklenemezse oda yine açılır ve bunu söyleyen bir not görünür.
- Dar ekranda (telefon) sahne dokunmatik denetimlerle kullanılabilir olmalıdır.

---

## 🔍 Preanalysis

### Mevcut Yapı

- Vite + React + TypeScript. Harita için PixiJS ve MapLibre zaten var; ikisi de iki boyutlu.
- Uçtan uca testler Playwright ile, yazılım tabanlı WebGL'de (SwiftShader) çalışıyor; ekran görüntüleri `tmp/screens/` altına yazılıyor.
- Portre işinde kurulan düzen yeniden kullanılabilir: her hazır varlığın kaydı, lisansı ve "Kaynaklar" gösterimi.

### Teknik Analiz

- **Motor:** Three.js (0.187). Gölge, fiziksel tabanlı malzeme, ton eşleme ve glTF yükleyici hazır geliyor.
- **Blender yok.** Bu makinede modelleme aracı yok; her geometri ya kodla üretilir ya da hazır dosyadan yüklenir.
- **Karakter kaynağı:** Three.js örneklerindeki "Lee Perry-Smith" baş taraması gerçek bir insanın yüksek çözünürlüklü taramasıdır (renk, parlaklık ve normal haritalarıyla). Lisansı Creative Commons Atıf 3.0'dır; atıf verilerek, değiştirilerek ve ticari olarak kullanılabilir. İndirildi ve açıldı.
- **Gövde:** Kaftan gövdeyi ayaklara kadar, kollar elleri örter. Bu yüzden gövde için iskeletli bir insan modeli gerekmez; kaftan, kuşak ve kollar kodla modellenebilir.
- **Sayfa:** Sahne ayrı bir giriş sayfası olur (`sahne.html`). Three.js yalnız o sayfada yüklenir; ana uygulamanın açılış süresi etkilenmez.

### Oyun geliştirenlerin test yöntemleri (araştırma)

| Yöntem | Buradaki karşılığı |
|--------|---------------------|
| Altın görüntü karşılaştırması: sahne sabit açıdan çizilir, kayıtlı görüntüyle piksel piksel kıyaslanır. | Playwright `toHaveScreenshot`, sabit kamera açıları, küçük bir fark payı |
| Belirlenimci çizim: zaman, rastgelelik ve animasyon sabitlenir; "hazır" işareti beklenir. | Adresle verilen `shot` ve `t` değerleri, tohumlu rastgelelik, `data-ready` |
| Yazılım tabanlı çizim: ekran kartından bağımsız sonuç. | Playwright zaten SwiftShader ile çalışıyor |
| Görüntü yerine durumun sınanması: çizimden bağımsız, hızlı ve kararlı. | Sahne tanımı, çarpışma ve desen üreticileri saf işlevlerdir; birim testleri onları sınar |
| Başarım bütçesi: çizim çağrısı ve üçgen sayısı sınırı. | `renderer.info` değerleri sayfadan okunur ve sınırla karşılaştırılır |
| Duman testi: sahne açılır, hata yoktur. | İlk uçtan uca test |

Not: Altın görüntüler ekran kartına ve işletim sistemine göre değişir; karşılaştırma yalnız bu makinedeki yazılım tabanlı çizimde anlamlıdır. Piksel karşılaştırması "bozuldu mu" sorusunu cevaplar; "iyi görünüyor mu" sorusunu cevaplamaz. O soru için görüntülere bakılır ve referansla kıyaslanır.

---

## 💡 Solution Suggestions

### Plan A — Gerçek baş taraması + kodla modellenen kıyafet ve oda ⭐

- Baş: Lee Perry-Smith taraması (CC BY 3.0). Üstüne kodla kavuk ve sakal; altına kaftan, kuşak, kollar.
- Oda: bütünüyle kodla; çini, halı, ahşap ve sıva dokuları da kodla üretilir.
- **Artısı:** Yüz gerçek bir insan yüzüdür; "gerçek gibi" ölçütünü karşılayabilecek tek yol. Telif açısından temiz: tek hazır varlık var ve lisansı açık.
- **Eksisi:** Yüz Fatih'in değil, taranan kişinin yüzüdür; benzerlik sakal, kavuk, kaş ve ten rengiyle kurulur. Baş taraması iskeletsizdir: karakter yürümez, ayakta durur ve yalnız küçük hareketler yapar (nefes, başını çevirme).

### Plan B — İskeletli, stilize hazır karakter

- Açık lisanslı (CC0) stilize bir temel karakter ve hazır animasyonlar.
- **Artısı:** Karakter yürür ve canlanır.
- **Eksisi:** Yüz çizgi film tarzındadır; "gerçek gibi" ölçütünü karşılamaz. İndirme, bir mağaza sayfasının arkasında.

### Plan C — Tamamı kodla

- **Artısı:** Hiçbir hazır varlık yok.
- **Eksisi:** Kodla yazılan bir yüz gerçekçi olmaz.

### Öneri

Plan A. İstenen şey tek bir "gerçek görünen" karakter; hareket değil, görünüm öncelikli. Karakterin yürümemesi, sahneyi oyuncunun dolaştığı ve karakterin onu izlediği bir oda olarak kurarak karşılanır.

---

## 🚀 Devops Notları

- Yeni bağımlılık: `three`. Sunucu tarafı yok; çıktı yine statik dosyalar.
- Baş taraması ve dokuları `public/models/` altında depoya girer (yaklaşık 1,4 MB).
- Altın görüntüler `tests/e2e/__screenshots__/` altında depoya girer.

---

## 🔎 Review

| Rapor | Kapsam | Sonuç |
|-------|--------|-------|
| `REVIEW/2026-11-25-0100.md` | 59 dosya, 403 birim (tamamı) | 0 kritik, 5 majör, 136 minör, 26 öneri |

- **Majörler kapatıldı:** beş majör bulgunun beşi düzeltildi (sahnenin kaynakları serbest bırakılıyor, pencere şebekesindeki sonsuz döngü ihtimali, tavan dokusunda kayık kabartma, çekim betiğinde açık kalan tarayıcı).
- **Minör ve öneriler açık:** 162 bulgu kullanıcı kararını bekliyor; çoğu adsız sayılar, boolean parametreler ve uzun kurucu işlevlerdir.
- **Sonar çalıştırılmadı:** IDE kapalıydı; yerine tsc ve ESLint kullanıldı (ikisi de temiz).

---

## 🎯 Faz Özetleri

### 🟢 Faz 1 — Sahne altyapısı ve kendi kendine ilerleyen görsel test düzeni

**Durum:** 🟡 Kısmi · **Tamamlanma:** sürüyor · **Ayrıntı:** [`PHASE1.md`](PHASE1.md)

Ayrı sahne sayfası, Three.js çizim döngüsü, adresle seçilen sabit kamera açıları, "hazır" işareti, ekran görüntüsü
betiği, duman testi ve başarım bütçesi testi.

### 🟢 Faz 2 — Saray odası

**Durum:** 🟡 Kısmi · **Tamamlanma:** sürüyor · **Ayrıntı:** [`PHASE2.md`](PHASE2.md)

Fatih dönemi bir saray odası: çinili duvarlar, kemerli nişler, ocak, pencereler, ahşap tavan, sedir, halı ve eşyalar.
Kaynaklar `REFERENCES.md` içinde.

### 🟡 Faz 3 — Fatih Sultan Mehmed karakteri

**Durum:** 🟡 Kısmi · **Tamamlanma:** sürüyor · **Ayrıntı:** [`PHASE3.md`](PHASE3.md)

Baş taraması, kavuk, sakal, kaftan, kuşak ve kollar; portreyle üç açıdan kıyaslama.

### 🟢 Faz 4 — Oyun hissi: dolaşma, ışık, etkileşim ve uygulamaya bağlama

**Durum:** 🟡 Kısmi · **Tamamlanma:** sürüyor · **Ayrıntı:** [`PHASE4.md`](PHASE4.md)

Odada yürüme ve çarpışma, ışık ve son işlem, karaktere yaklaşınca tanıtım, karttan sahneye geçiş, lisans gösterimi.

### 🟡 Faz 5 — İlk kullanım geri bildirimi: karakter düzeltmeleri ve haritada fetih planı

**Durum:** 🟡 Kısmi · **Ayrıntı:** [`PHASE5.md`](PHASE5.md)

Sakal ile kürk yaka ayrışır ve kıpırdamaz, bıyık düzelir; Fatih masadaki açık haritada fetih planını altı adımda anlatır.
Anlatımın parçaları figürden bağımsız, yeniden kullanılabilir modüllerdir.

### 🟡 Faz 6 — İkinci geri bildirim: dönem masası, dönemin haritası, Osmanlıca yazılar ve başarım

**Durum:** 🟡 Kısmi · **Ayrıntı:** [`PHASE6.md`](PHASE6.md)

Harita portolan tarzı bir deri harita olur ve Osmanlıca yazılır; bir düğme Latin harflerine çevirir. Masa alçak,
kakmalı bir kürsü olur.
