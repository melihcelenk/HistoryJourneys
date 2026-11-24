# Faz 12 — Dördüncü geri bildirim: kart sekmeleri, haritayla bağlı yolculuk listesi ve ilişki grafı

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Faz 11'den sonra gelen geri bildirim uygulanır. Bitince figür kartı daha derli topludur, karttaki yolculuk listesi
haritayla birlikte gezilir ve bir figürün ilişkileri graf olarak görülür.

## Problem

- Haritada kartı zaten açık olan figürün bayrağına tıklanınca zaman figürün "etkin yılına" dönüyor; Atatürk 26. duraktayken 28. durağa (Ankara, 1923) sıçrıyor (T41).
- "Neden", "Sonuç", "Derinlik" düğmeleri yazılı ve her işin altında ayrı bir satır kaplıyor; kart uzuyor.
- Yolculuk, ilişkiler ve kaynaklar tek bir "Ayrıntılar" düğmesinin arkasında, alt alta açılıyor.
- Karttaki yolculuk listesi haritadan kopuk: haritada gezilirken hangi kayıtta olunduğu görünmüyor, kayda tıklanamıyor.
- Bir figürün ilişkileri yalnız liste olarak görülüyor.

## Çözüm

- **Bayrak:** Kartı açık figürün bayrağına tıklamak zamanı ve anlatılan olayı değiştirmez.
- **İkon düğmeler:** Neden, sonuç ve derinlik düğmeleri işin satırında, yalnız ikon olarak durur; nedenin simgesi soru işaretidir.
- **Sekmeler:** "Ayrıntılar" düğmesi yerine üç sekme: "Yolculuğu", "İlişkileri", "Kaynaklar". Açık sekmeye tekrar basılınca kapanır.
- **Bağlı yolculuk listesi:** Haritada bulunulan durak listede kırmızı zeminli, seçili görünür ve görünür alana kaydırılır. Listedeki bir kayda tıklanınca harita o durağa gider ve olayı yazılır.
- **İlişki grafı:** "İlişkileri" sekmesinin başındaki düğme geniş bir pencere açar; figür ortada, ilişkili kişiler çevresinde, bağlantılar ilişki türüyle etiketli. Bir kişiye tıklanınca onun kartı açılır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 12.1 | Kartı açık figürün bayrağına tıklamak zamanı değiştirmez. | 🟢 Tamamlandı |
| 12.2 | Neden, sonuç ve derinlik düğmeleri ikon olur; nedenin simgesi soru işaretidir. | 🟢 Tamamlandı |
| 12.3 | Ayrıntılar üç sekmeye ayrılır. | 🟢 Tamamlandı |
| 12.4 | Karttaki yolculuk listesi haritayla birlikte gezilir. | 🟢 Tamamlandı |
| 12.5 | Figürün ilişkileri graf olarak görülür. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-2, FR-27 | Bir işin nedeni, sonucu ve derinliği kartı uzatmayan ikon düğmelerle açılır. | 12.2 |
| FR-3, FR-6 | Yolculuk, ilişkiler ve kaynaklar kartta sekmeler hâlinde durur. | 12.3 |
| FR-13 | Karttaki yolculuk listesi ile harita aynı durağı gösterir; listeden durağa gidilir. | 12.1, 12.4 |
| FR-11 | Bir figürün ilişkileri graf olarak görülür; graftan başka bir figüre geçilir. | 12.5 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Kartı açık figür yeniden açılınca yıl ve anlatılan olay değişmez. | `tests/unit/store.test.ts`, `tests/e2e/card-details.spec.ts` | 🟢 Tamamlandı |
| Neden, sonuç ve derinlik düğmeleri yazısızdır ve işin satırındadır. | `tests/e2e/card-details.spec.ts` | 🟢 Tamamlandı |
| Üç sekme vardır; açık sekmeye basılınca kapanır. | `tests/e2e/card-details.spec.ts` | 🟢 Tamamlandı |
| Listedeki kayda tıklanınca harita o durağa gider; sonraki olaya geçilince seçili kayıt değişir. | `tests/e2e/card-details.spec.ts` | 🟢 Tamamlandı |
| Graf, figürü ve her ilişkili kişiyi bir kez, ilişki türleriyle verir. | `tests/unit/relationGraph.test.ts` | 🟢 Tamamlandı |
| Graf penceresinde bir kişiye tıklanınca onun kartı açılır. | `tests/e2e/card-details.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk bir durağa götürülür, sonra haritadaki bayrağına tıklanır; durak ve yıl değişmez.
- [x] Kartta her işin sağında üç küçük ikon düğme vardır; soru işaretine basılınca neden açılır.
- [x] Kartın altında "Yolculuğu", "İlişkileri", "Kaynaklar" sekmeleri vardır.
- [x] "Yolculuğu" açıkken sonraki olay düğmesine basılır; listede kırmızı zeminli kayıt bir sonrakine geçer.
- [x] Listede başka bir kayda tıklanır; harita o durağa gider, olay notu açılır.
- [x] "İlişkileri" sekmesinde "Graf olarak gör"e basılır; pencere açılır, bir kişiye tıklanınca onun kartı açılır.

## Kalan

- **Olay notunda neden ve sonuç (S6 → A):** Düğmeler yalnız figür kartında durur. Haritanın altındaki olay notuna eklenmesi ilk sürüm için gerekli görülmedi; ileride istenirse duraklara içerik alanı eklemek gerekir (`questions/S06-olay-notunda-neden-sonuc.md`).
- **Review bulguları:** `REVIEW/2026-11-24-1150.md` içindeki 15 bulgudan 7'si kapatıldı; majör ya da kritik bulgu yok. Açık kalan 8 düşük öncelikli bulgu: test dosyası adları ve test yardımcılarındaki tekrarlar, iki erişilebilirlik önerisi, iki adlandırılmış sabit önerisi.
- **Sonar:** IDE kapalı olduğu için review Sonar'sız yapıldı.
- **Graf tek katmanlı:** Graf yalnız figürün doğrudan ilişkilerini gösterir; ilişkili kişilerin kendi aralarındaki bağlar çizilmez.
- **Telefonda graf:** Dar ekranda bağlantı etiketleri ve yıllar gizlenir; ilişki türü yalnız çizgi biçiminden okunur.

## Ayrıntılar

### 12.1 — Kartı açık figürün bayrağına tıklamak zamanı değiştirmez.

- **Mevcut durum:** `openFigure` her çağrıda yılı figürün etkin yılına (`activeYear`) çeker ve anlatılan olayı siler.
- **Problem:** Kartı zaten açık olan Atatürk'ün bayrağına tıklanınca zaman 1923'e, yani 28. durağa sıçrıyor (T41).
- **Çözüm:** Açılmak istenen figür zaten okuyucunun önündeyse `openFigure` yalnız açık pencereyi kapatır ve kartı yeniden yüklemeyi dener; yıl, oynatma ve anlatılan olay yerinde kalır.
- **Dosyalar:** `src/app/store.ts`
- **Testler:** `tests/unit/store.test.ts`, `tests/e2e/card-details.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 12.2 — Neden, sonuç ve derinlik düğmeleri ikon olur; nedenin simgesi soru işaretidir.

- **Mevcut durum:** Üç yazılı düğme her işin altında ayrı bir satırda.
- **Problem:** Kart gereksiz uzuyor (T41).
- **Çözüm:** Düğmeler işin satırının sağ ucuna, yalnız ikon olarak alınır; erişilebilir adları ("Neden", "Sonuç", "Derinlik") ve ipuçları kalır. Neden için soru işareti ikonu eklenir.
- **Dosyalar:** `src/ui/ActionItem.tsx`, `src/ui/Icon.tsx`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-details.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 12.3 — Ayrıntılar üç sekmeye ayrılır.

- **Mevcut durum:** "Ayrıntılar" düğmesi yolculuğu, ilişkileri ve kaynakları alt alta açıyor.
- **Problem:** Aranan bölüme ulaşmak için uzun bir bloğu kaydırmak gerekiyor (T41).
- **Çözüm:** Kartın altında üç sekme durur; biri açıkken yalnız o bölüm görünür, açık sekmeye basılınca kapanır. Kart kapalı sekmelerle açılır.
- **Dosyalar:** `src/ui/FigureCard.tsx`, `src/ui/CardDetails.tsx`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-details.spec.ts`, `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 12.4 — Karttaki yolculuk listesi haritayla birlikte gezilir.

- **Mevcut durum:** Yolculuk listesi düz metin; haritayla ilişkisi yok.
- **Problem:** Haritada gezilirken listede nerede olunduğu görünmüyor; listeden durağa gidilemiyor (T41).
- **Çözüm:** Figürün o an bulunduğu durak (anlatılan durak, yoksa seçili yılın durağı) listede seçili görünür ve görünür
  alana kaydırılır. Kaydı olmayan yılda hiçbir kayıt seçili değildir. Her kayıt bir düğmedir ve `goToStop` çağırır.
- **Dosyalar:** `src/ui/CardDetails.tsx`, `src/domain/journey.ts`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/card-details.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 12.5 — Figürün ilişkileri graf olarak görülür.

- **Mevcut durum:** İlişkiler yalnız liste.
- **Problem:** Bir figürün çevresi bir bakışta görülmüyor (T41).
- **Çözüm:** `buildRelationGraph` figürü merkeze, ilişkili her kişiyi çevresine bir kez koyar; aynı kişiyle birden fazla
  ilişki tek bağlantıda birleşir, bağlantı türü (doğrudan ya da etki) içerikten gelir. Pencere tüm ekranı kaplamayan geniş
  bir diyalogdur; kişiye tıklanınca kartı açılır ve pencere kapanır.
- **Dosyalar:** `src/domain/relationGraph.ts`, `src/ui/dialogs/RelationGraphDialog.tsx`, `src/ui/CardDetails.tsx`, `src/ui/GameScreen.tsx`, `src/app/store.ts`, `src/ui/theme/dialogs.css`
- **Testler:** `tests/unit/relationGraph.test.ts`, `tests/e2e/card-details.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 12
- `docs/requirements/history-journeys.md` → FR-2, FR-3, FR-11, FR-13
