# Faz 13 — Beşinci geri bildirim: kartın düzeni, kart sekmeleri ve ilk duraktan başlama

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Faz 12'den sonra gelen geri bildirim uygulanır. Bitince bir kişi açıldığında yolculuğu ilk durağından başlar, kartın
sekmeleri başlığın hemen altındadır ve kart alanını daha verimli kullanır.

## Problem

- Bir kişi açıldığında zaman onun "etkin yılına" gidiyor; Atatürk 28. durakta (Ankara, 1923) açılıyor. Yolculuk sondan başlıyormuş gibi görünüyor (T45).
- Rotadaki sonraki karta geçen düğme küçük ve sağa yaslı; önemli bir geçiş olduğu anlaşılmıyor.
- Kart başlığında sağ üstteki iki düğmenin altı boş; roller ve yıllar dar bir sütuna sıkışıyor.
- "Yaptıkları" satırlarında üç ikon düğme metni dar bir sütuna sıkıştırıyor.
- Derinlik notu italik yazılıyor; okunması zor.
- Sekmeler kartın en altında; yolculuk listesini görmek için özeti ve yaptıklarını kaydırıp geçmek gerekiyor.

## Çözüm

- **İlk durak:** Bir kişi açıldığında zaman yolculuğunun ilk durağının yılına gider. Bağlantıdan gelen yıl ve okuyucunun kendi seçtiği yıl korunur.
- **Sonraki kart düğmesi:** Kartın altında, içerik genişliğini kaplayan, aşağıyı gösteren yayvan bir sancak; rengi karttaki diğer düğmelerden farklı.
- **Başlık:** Roller ve yıllar başlığın altında kartın bütün genişliğine yayılır. Düğmelerin yeri için birkaç seçenek mock olarak hazırlanır ve sorulur (S7).
- **Yaptıkları:** İkon düğmeler metnin son satırının ucuna, metnin içine alınır; metin bütün genişliği kullanır.
- **Derinlik notu:** Düz yazılır.
- **Kart sekmeleri:** Başlığın hemen altında dört sekme: "Özet" (özet ve yaptıkları), "Yolculuğu", "İlişkileri", "Kaynaklar". Biri her zaman açıktır; seçim kartlar arasında korunur.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 13.1 | Bir kişi açıldığında zaman yolculuğunun ilk durağına gider. | 🟢 Tamamlandı |
| 13.2 | Sonraki karta geçen düğme geniş ve belirgin bir sancak olur. | 🟢 Tamamlandı |
| 13.3 | Başlıkta roller ve yıllar bütün genişliğe yayılır; düğme yerleşimi için mock'lar hazırlanır. | 🟢 Tamamlandı |
| 13.4 | Yaptıkları satırında düğmeler metni sıkıştırmaz; derinlik notu düz yazılır. | 🟢 Tamamlandı |
| 13.5 | Kartın bölümleri başlığın altında sekmeler olur. | 🟢 Tamamlandı |
| 13.6 | Sonraki kart sancağı tek satıra iner; karttaki mürekkep düğmelerinden alçaktır. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-13, FR-14 | Bir figür açıldığında harita ve zaman yolculuğunun başındadır. | 13.1 |
| FR-10 | Rotada sonraki karta geçiş kartın altında belirgin bir düğmedir. | 13.2 |
| FR-1, FR-3, FR-6 | Kartın bölümleri (özet, yolculuk, ilişkiler, kaynaklar) başlığın altında sekmelerdir. | 13.3, 13.5 |
| FR-2, FR-27 | Neden, sonuç ve derinlik düğmeleri metni daraltmaz; açılan notlar düz yazıyla okunur. | 13.4 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Kart açılınca yıl ilk durağın yılıdır; kart sonradan yüklenirse yıl o zaman ayarlanır. | `tests/unit/store.test.ts` | 🟢 Tamamlandı |
| Bağlantıdaki yıl ve okuyucunun seçtiği yıl, kart yüklenince değişmez. | `tests/unit/store.test.ts` | 🟢 Tamamlandı |
| Atatürk açıldığında haritada 1 numaralı durak bulunulan duraktır. | `tests/e2e/card-layout.spec.ts` | 🟢 Tamamlandı |
| Sonraki kart düğmesi kart içeriğinin bütün genişliğini kaplar ve 32 pikselden yüksek değildir. | `tests/e2e/card-layout.spec.ts` | 🟢 Tamamlandı |
| Roller satırı başlık düğmelerinin altına kadar uzanır. | `tests/e2e/card-layout.spec.ts` | 🟢 Tamamlandı |
| Yaptıkları metni satırın bütün genişliğini kullanır; derinlik notu italik değildir. | `tests/e2e/card-layout.spec.ts` | 🟢 Tamamlandı |
| Sekmeler başlığın hemen altındadır; "Yolculuğu" seçilip sonraki karta geçilince seçim korunur. | `tests/e2e/card-details.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk → Fatih yolculuğu başlatılır; yıl 1881'dir, haritada Atatürk 1. durakta (Selanik) durur.
- [x] Kartın altındaki geniş sancağa basılır; sıradaki kart açılır ve o da ilk durağından başlar.
- [x] Başlıkta roller ve yıllar kartın sağ kenarına kadar uzanır.
- [x] Yaptıkları satırında ikonlar metnin son satırının ucundadır.
- [x] Derinlik notu düz yazılıdır.
- [x] "Yolculuğu" sekmesi seçilir; özet ve yaptıkları kaybolur, liste başlığın hemen altındadır. Sıradaki kartta da "Yolculuğu" açıktır.

## Kalan

- **Başlık düğmelerinin yeri (S7 → A):** Mevcut yerleşim kaldı. D seçeneği, figür portreleri eklendiğinde yeniden değerlendirilecek (`PHASE14.md` → Kalan).
- **Review bulguları:** `REVIEW/2026-11-24-1915.md` içindeki 21 bulgudan 8'i kapatıldı. Tek majör bulgu: sapma içeren bir bağlantıda yıl, kart yüklenince ilk durağa çekiliyordu. Açık kalan 13 düşük öncelikli bulgu çoğunlukla test dosyası adları, test içi sabitler ve küçük öneriler.
- **Sonar:** IDE kapalı olduğu için review Sonar'sız yapıldı.
- **Diğer figürlerin ilk durağı:** Yolculuğu olmayan bir figür doğum yılında açılır; içerikteki 50 figürün hepsinin yolculuğu var.

## Ayrıntılar

### 13.1 — Bir kişi açıldığında zaman yolculuğunun ilk durağına gider.

- **Mevcut durum:** Kart açılınca yıl `activeYear` olur: hükümdarlar için tahta çıkış yılı, diğerleri için 30 yaş.
- **Problem:** Atatürk 1923'te, yani 28. durakta açılıyor; yolculuk ortasından ya da sonundan başlıyor (T45).
- **Çözüm:** Kart açılınca yıl, yolculuğun ilk durağının başlangıç yılıdır. Kart henüz yüklenmemişse yıl geçici olarak
  doğum yılına gider ve kart gelince, okuyucu o arada zamanı değiştirmediyse, ilk durağa ayarlanır. Bağlantıdan gelen yıl
  olduğu gibi kalır. `activeYear` yalnız figürleri zamanda sıralamak için (oyun) kullanılmaya devam eder.
- **Dosyalar:** `src/app/store.ts`
- **Testler:** `tests/unit/store.test.ts`, `tests/e2e/card-layout.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 13.2 — Sonraki karta geçen düğme geniş ve belirgin bir sancak olur.

- **Mevcut durum:** Kartın altında solda "önceki", sağda "sonraki" küçük mürekkep düğmeleri var.
- **Problem:** Sonraki karta geçiş sağda küçük bir düğme; yolculuğun asıl ilerleme adımı olduğu anlaşılmıyor (T45).
- **Çözüm:** Sonraki kart düğmesi kart içeriğinin genişliğini kaplayan, alt kenarı aşağıyı gösteren koyu taş zeminli,
  altın yazılı bir sancak olur; üstünde "Sıradaki" yazar. Önceki karta dönüş, sancağın üstünde küçük bir bağlantı olarak kalır.
- **Dosyalar:** `src/ui/RoutePanel.tsx`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-layout.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 13.6 — Sonraki kart sancağı tek satıra iner; karttaki mürekkep düğmelerinden alçaktır.

- **Mevcut durum:** 13.2'de yapılan sancak üç satırlı (etiket, ad, ok) ve yaklaşık 90 piksel yüksekliğinde.
- **Problem:** Geniş ama alçak bir düğme istenmişti; sancak eski düğmenin üç katı yer kaplıyor (T51).
- **Çözüm:** Etiket, ad ve ok tek satıra alınır; sancak 30 piksel yüksekliğindedir (mürekkep düğmeleri 34) ve alt kenarı
  yalnız 7 piksellik sığ bir uçla aşağıyı gösterir. Sığmayan uzun ad üç nokta ile kısalır.
- **Dosyalar:** `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-layout.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 13.3 — Başlıkta roller ve yıllar bütün genişliğe yayılır; düğme yerleşimi için mock'lar hazırlanır.

- **Mevcut durum:** Madalyon, ad, roller ve yıllar tek sütunda; sağdaki iki düğme o sütunu bütün yükseklik boyunca daraltıyor.
- **Problem:** Düğmelerin altı boş kalıyor, roller üç satıra bölünüyor (T45).
- **Çözüm:** Başlık iki satır olur: üstte madalyon, ad ve düğmeler; altta kartın bütün genişliğinde roller ve yıllar.
  Düğmelerin yeri için dört seçenek `docs/tasks/HJ-1/mocks/card-header.html` dosyasında yan yana gösterilir ve S7 ile sorulur.
- **Dosyalar:** `src/ui/FigureCard.tsx`, `src/ui/theme/card.css`, `docs/tasks/HJ-1/mocks/card-header.html`
- **Testler:** `tests/e2e/card-layout.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 13.4 — Yaptıkları satırında düğmeler metni sıkıştırmaz; derinlik notu düz yazılır.

- **Mevcut durum:** Üç ikon düğme satırın sağında ayrı bir sütun; metin kalan dar alanda üç satıra bölünüyor. Derinlik notu italik.
- **Problem:** Metin sıkışıyor; italik not zor okunuyor (T45).
- **Çözüm:** Düğmeler metnin ardına alınır ve son satırın sağ ucuna yaslanır; metin satırın bütün genişliğini kullanır.
  Son satırda yer yoksa düğmeler alt satırın sağ ucuna iner. Derinlik notundan italik kaldırılır.
- **Dosyalar:** `src/ui/ActionItem.tsx`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-layout.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 13.5 — Kartın bölümleri başlığın altında sekmeler olur.

- **Mevcut durum:** Özet ve yaptıkları her zaman açık; yolculuk, ilişkiler ve kaynaklar kartın en altında açılıp kapanan bölümler.
- **Problem:** Özet bir kez okunup geçiliyor ama yolculuk listesi sürekli görülmek isteniyor; liste en altta kalıyor (T45).
- **Çözüm:** Başlığın altında dört sekme durur; "Özet" özet ve yaptıklarını taşır ve varsayılandır. Biri her zaman
  açıktır. Seçim store'da tutulur (`cardTab`), böylece sıradaki karta geçince aynı sekme açık kalır.
- **Dosyalar:** `src/app/store.ts`, `src/ui/FigureCard.tsx`, `src/ui/CardDetails.tsx`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-details.spec.ts`, `tests/unit/store.test.ts`
- **Durum:** 🟢 Tamamlandı.

### Uygulama sırasında eklenenler

- **Önceki kart:** Geniş sancak yalnız ileri gider; önceki karta dönüş, sancağın üstünde küçük bir "Önceki: …" satırıdır.
- **Yolculuk listesinin yüksekliği:** Liste kendi içinde kayar ve yüksekliği pencereye göre ayarlanır; böylece başlık, sekmeler ve sonraki kart sancağı aynı anda görünür kalır.
- **Güncellenen eski testler:** Rota sekmesi olmadığını `tablist` rolüyle sınayan test, kartın kendi sekmeleri geldiği için sekme adlarına bakacak şekilde değişti. Haritayı sürükleme testi sabit bir noktadan başlıyordu ve artık o noktaya bir durak işareti düşüyor; test boş bir harita noktası arayıp oradan sürüklüyor.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 13
- `docs/requirements/history-journeys.md` → FR-1, FR-2, FR-3, FR-10, FR-13
