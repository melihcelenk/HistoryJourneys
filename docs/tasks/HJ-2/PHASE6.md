# Faz 6 — İkinci geri bildirim: dönem masası, dönemin haritası, Osmanlıca yazılar ve başarım

> **Durum:** 🟡 Kısmi · **Tamamlanma:** 90% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Anlatım sahnesinin ilk denemesinden gelen geri bildirim uygulanır. Bitince harita, dönemin bir deniz haritası gibi
görünür ve Osmanlıca harflerle yazılıdır; bir düğme yazıları Latin harflerine çevirir; harita dönemine uygun alçak,
kakmalı bir masanın üstünde durur.

## Problem

- Masa modern bir masa gibi duruyor: düz tabla, dört düz ayak (T102).
- Harita düz renkli, temiz kenarlı bir levha; dönemin kâğıdına ve çizim tarzına benzemiyor (T102).
- Haritadaki yazılar Latin harfleriyle; dönemde Arap harfleriyle yazılırdı (T102).
- Yeni harita, şimdiki kadar net okunmalı (T102).
- Beyaz kara ve mavi deniz günümüz baskısı gibi duruyor; dönemin haritalarında böyle boyama yok (T105).
- Simgeler (şehir, hisar, ordugâh) bilgisayar çıktısı gibi; elle çizilmiş gibi durmalı (T107).
- Oyun yavaş: küçük bir odaya göre fazla kasıyor (T107).

## Çözüm

- **Masa:** Alçak, geniş bir kürsü: kalın tabla, kenarında kakma bordür, yanlarında sivri kemerli açıklıklar ve geometrik kakma panolar. Yükseklik oturarak ya da ayakta bakmaya uygun tutulur.
- **Harita:** Pîrî Reis haritaları örnek alınır: düzensiz kenarlı, eskimiş deri zemin; kara ve deniz boyanmaz; kıyılar ince kızıl-kahve mürekkeple, kara tarafında hafif aşı boyası gölgeyle çizilir; boyalı rüzgâr güllerinden kerte çizgileri yayılır.
- **Elle çizim:** Yer simgeleri ve yollar, titreyen ve iki kez üstünden geçilen mürekkep çizgileriyle çizilir; içlerine ince boya sürülür.
- **Tek görsel:** Haritanın parçaları yalnız çizilirken ayrıdır; sonuç tek bir doku ve tek bir yüzeydir. Doku yalnız gösterdiği şey değişince yeniden çizilir.
- **Başarım:** Kare süresi gerçek ekran kartında ölçülür; gölgeler bir kez çizilir, kıl katmanları azaltılır, parlama yarı boyutta hesaplanır ve zayıf kartlarda çözünürlük kendiliğinden düşer.
- **İşaretler:** Anlatılan yerler, dizideki gibi, haritaya konmuş mavi cam taşlarla ve kırmızı mürekkep halkasıyla gösterilir.
- **Osmanlıca yazılar:** Her yer adının iki yazımı tutulur: Arap harfli Osmanlıca ve Latin harfli. Harita Osmanlıca açılır; "Çeviri" düğmesi (ve T tuşu) Latin harflerine çevirir, yeniden basınca geri döner. Yıl, haritada hicrî olarak (857) yazılır; Latin yazımda 1453'tür.
- **Yazı tipi:** Arap harfleri için açık lisanslı Amiri (SIL OFL) kullanılır; harita, yazı tipleri yüklendikten sonra çizilir.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 6.1 | Her yer adının Osmanlıca ve Latin yazımı veriye eklenir. | 🟢 Tamamlandı |
| 6.2 | Harita portolan tarzı bir deri harita olarak çizilir. | 🟢 Tamamlandı |
| 6.3 | Çeviri düğmesi haritanın yazısını Osmanlıca ile Latin arasında değiştirir. | 🟢 Tamamlandı |
| 6.4 | Masa, dönemine uygun alçak ve kakmalı bir kürsü olur. | 🟢 Tamamlandı |
| 6.5 | Haritanın simgeleri ve çizgileri elle, mürekkeple çizilmiş gibi olur. | 🟢 Tamamlandı |
| 6.6 | Sahne akıcı çalışır: kare süresi ölçülür ve düşürülür. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K2 | Sahnedeki eşya dönemine uygundur. | 6.2, 6.4 |
| K7 | Harita anlatımı taşır; yazıları okunur. | 6.1, 6.2, 6.3 |
| K9 (T102) | Haritanın yazıları Osmanlıca harflerledir ve bir düğmeyle Latin harflerine çevrilir. | 6.1, 6.3 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Haritadaki her adın Osmanlıca ve Latin yazımı vardır; Osmanlıca yazım yalnız Arap harfleri ve rakamlarından oluşur. | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Yazı seçimi Osmanlıca başlar, çevrilince Latin olur, yeniden çevrilince geri döner. | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Çeviri düğmesi görünür, basınca üstündeki yazı ve haritanın yazı durumu değişir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Masa oyuncuyu durdurur ve figürle çakışmaz (yeni ölçülerle). | `tests/unit/briefing.test.ts` | 🟢 Tamamlandı |
| Anlatımın bir adımı, Osmanlıca ve Latin yazıyla, altın görüntülerle eşleşir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Masaya bakılır: alçak, kemerli ve kakmalı bir kürsüdür.
- [x] Harita düzensiz kenarlı bir deri üstündedir; kerte çizgileri ve mürekkep kıyılar görünür; adlar Arap harfleriyledir.
- [x] "Çeviri" düğmesine basılır; adlar Latin harflerine döner. Yeniden basılır; Osmanlıcaya döner.
- [x] Anlatım sırasında işaretlenen yerlerde mavi cam taşlar ve kırmızı halka görünür.

## Kalan

- **Osmanlıca yazımlar doğrulatılmadı:** Yazımları ben yazdım. Yer adları (قسطنطينيه, غلطه, خليج) yerleşik yazımlardır; "Gemilerin karadan yolu" ve "Haliç'e inen gemiler" gibi kurulmuş ifadeler dönemin imlâsına tam uymayabilir. Osmanlıca bilen biri `conquestMap.ts` içinde düzeltebilir; bu yüzden faz kapatılmadı.
- **Kara ile deniz artık renkle ayrılmıyor:** Ayrımı kıyı çizgisi ve kara tarafındaki hafif gölge yapıyor; önceki sürüme göre ilk bakışta daha az belirgin.
- **Başarım tek makinede ölçüldü:** Ölçüm bu makinenin tümleşik ekran kartında (Intel Arc), 1920×1080'de yapıldı. Başka makinelerde sonuç farklı olur; çözünürlük ayarı bunun için var.
- **Masanın yan yüzleri** (kemerler, kakma) ekran görüntüsünde doğrulanmadı; anlatım kamerası onları göstermiyor.
- **Kakma deseni canlandırmadır;** bir kaynağa bağlı değildir.
- **Review yapılmadı:** Faz 5 ve Faz 6 kodu `/h-review`'dan geçmedi.

## Ayrıntılar

### 6.1 — Her yer adının Osmanlıca ve Latin yazımı veriye eklenir.

- **Mevcut durum:** Harita tanımında her adın tek, Latin harfli yazımı var.
- **Problem:** Osmanlıca yazım için veri yok (T102).
- **Çözüm:** Ad alanı iki yazımlı olur (`latin`, `ottoman`). Yazımlar dönemin imlâsına göre yazılır (ör. قسطنطينيه, غلطه, خليج, روم ايلى حصارى). Hangi yazımın gösterileceği saf bir işlevle seçilir.
- **Dosyalar:** `src/scene3d/briefing/mapDefinition.ts`, `src/scene3d/briefing/conquestMap.ts`
- **Testler:** `tests/unit/briefing.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 6.2 — Harita portolan tarzı bir deri harita olarak çizilir.

- **Mevcut durum:** Harita düz renkli kara ve deniz alanlarından oluşan dikdörtgen bir levha.
- **Problem:** Dönemin haritasına benzemiyor (T102). Kullanıcının verdiği örnek, kerte çizgili ve mürekkeple çizilmiş bir deniz haritasıdır.
- **Çözüm:** Zemin eskimiş deri rengidir; kenarı düzensizdir ve köşeleri hafifçe kalkıktır. Bir rüzgâr gülünden on altı yöne kerte çizgileri yayılır. Kıyılar koyu mürekkeple, kıyı boyunca içe doğru solan mavi-yeşil yıkamayla çizilir; kara boyanmaz. Yer işaretleri ve çizgi kalınlıkları bugünkü okunaklılıkta kalır.
- **Dosyalar:** `src/scene3d/briefing/mapBoard.ts`, `src/scene3d/briefing/table.ts`
- **Testler:** `tests/e2e/scene.spec.ts` (altın görüntüler)
- **Durum:** 🟢 Tamamlandı.

### 6.3 — Çeviri düğmesi haritanın yazısını Osmanlıca ile Latin arasında değiştirir.

- **Mevcut durum:** Yazı seçimi yok.
- **Problem:** Osmanlıca yazıyı okuyamayan oyuncu haritayı izleyemez (T102).
- **Çözüm:** Ekranda bir "Çeviri" düğmesi durur; basınca (ya da T tuşuyla) harita öbür yazıyla yeniden çizilir ve düğmenin üstü hangi yazıya geçileceğini söyler. Seçim anlatım boyunca korunur. Adres satırındaki `script=latin` sabit karelerde Latin yazıyı seçer.
- **Dosyalar:** `src/scene3d/briefing/briefingSession.ts`, `src/scene3d/briefing/mapBoard.ts`, `src/scene3d/hud.ts`, `src/scene3d/SceneApp.ts`, `src/scene3d/main.ts`, `src/scene3d/scene.css`
- **Testler:** `tests/unit/briefing.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 6.4 — Masa, dönemine uygun alçak ve kakmalı bir kürsü olur.

- **Mevcut durum:** Düz tablalı, dört düz ayaklı, 80 cm yüksekliğinde bir masa.
- **Problem:** Modern görünüyor (T102). Dönemin Osmanlı iç mekânında mobilya alçaktır.
- **Çözüm:** Masa alçaltılır ve kürsü biçimini alır: kalın tabla, kenarında açık renk kakma bordür; dört yanında sivri kemerli açıklıklar bırakan panolar; panolarda geometrik yıldız kakma. Kamera ve çarpışma kutusu yeni ölçülere göre ayarlanır.
- **Dosyalar:** `src/scene3d/briefing/table.ts`, `src/scene3d/briefing/tableLayout.ts`, `src/scene3d/shots.ts`
- **Testler:** `tests/unit/briefing.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 6.5 — Haritanın simgeleri ve çizgileri elle, mürekkeple çizilmiş gibi olur.

- **Mevcut durum:** Simgeler düz dolgulu geometrik biçimlerdir; yollar düzgün kesikli çizgilerdir.
- **Problem:** Bilgisayar çıktısı gibi duruyor (T107).
- **Çözüm:** `inkPen.ts` elle çizimi sağlar: noktaları hafifçe kayan, her parçası hafifçe eğilen ve iki kez üstünden geçilen çizgiler; çizginin dışına biraz taşan ince boya. Titreme tohumlu rastgelelikten gelir, bu yüzden harita her seferinde aynıdır. `mapSigns.ts` her yer türünü küçük bir eskiz olarak çizer: kuleli hisar, kubbeli ve surlu şehir, flamalı çadırlar, tekerlekli top, yelkenli kadırgalar. Sur kuleli bir çizgi, zincir yan yana baklalar, karadan yol kesik çizgi ve ok olur.
- **Dosyalar:** `src/scene3d/briefing/inkPen.ts`, `src/scene3d/briefing/mapSigns.ts`, `src/scene3d/briefing/mapBoard.ts`
- **Testler:** `tests/e2e/scene.spec.ts` (altın görüntüler)
- **Durum:** 🟢 Tamamlandı.

### 6.6 — Sahne akıcı çalışır: kare süresi ölçülür ve düşürülür.

- **Mevcut durum:** Ölçüm (Intel Arc, 1920×1080, yüksek kalite): kapıda 24 fps, masada 21 fps, anlatım sırasında 12 fps.
- **Problem:** Küçük bir oda için çok yavaş (T107). Ölçüm üç neden gösterdi: anlatımda haritanın dokusu (1600×1000) her karede yeniden çizilip ekran kartına gönderiliyordu; gölgeler her karede bütün sahne için baştan çiziliyordu; sakal ve kürk 60'tan fazla katmanla çiziliyordu.
- **Çözüm:** Harita yalnız gösterdiği şey değişince yeniden çizilir (halkalar artık atmıyor). Gölge düşüren hiçbir şey hareket etmediği için gölgeler sahne kurulunca bir kez çizilir. Kıl katmanları azaltılır (sakal 34 → 20, kürk 18 → 10, kaş 10 → 6) ve kürk kendi gölgesini düşürmez. Kenar yumuşatma 4 örnekten 2'ye iner, parlama yarı boyutta hesaplanır, çok ince ekranlarda piksel oranı 1,5 ile sınırlanır. Kareler yine yavaşsa (ortalama 25 ms üstü) çözünürlük adım adım, en çok %70'e kadar düşer (`dynamicResolution.ts`). Ölçüm için `scripts/dev/measure-scene.ts` eklendi.
- **Sonuç (aynı makine, aynı boyut):** kapıda 60 fps, masada 56 fps, anlatım sırasında 56 fps; kare başına üçgen 720 binden 340 bine, çizim çağrısı 162'den 98'e indi.
- **Dosyalar:** `src/scene3d/SceneApp.ts`, `src/scene3d/dynamicResolution.ts`, `src/scene3d/post.ts`, `src/scene3d/briefing/mapBoard.ts`, `src/scene3d/briefing/briefingSession.ts`, `src/scene3d/character.ts`, `src/scene3d/figure/kaftan.ts`, `scripts/dev/measure-scene.ts`
- **Testler:** `tests/unit/scene3d.test.ts`, `tests/e2e/scene.spec.ts` (çizim bütçesi)
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- Pîrî Reis, Kitâb-ı Bahriye, Avrupa haritası (İstanbul Üniversitesi Kütüphanesi, 6605) — Wikimedia Commons, `Piri reis world map 01.jpg`
- Kullanıcının verdiği sahneler (yerel, `tmp/` altında): kerte çizgili deri harita, mavi cam taşlar.
- Amiri yazı tipi, SIL Open Font License 1.1 — `@fontsource/amiri`
