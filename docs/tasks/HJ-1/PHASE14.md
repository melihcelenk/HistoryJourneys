# Faz 14 — Figür portreleri

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Figür kartlarında, haritada ve seçme pencerelerinde madalyon yerine kişinin portresi gösterilir. Portresi olmayan
figürde bugünkü madalyon kalır.

## Problem

- Figürler yalnız türlerine göre seçilen simgelerle (ay yıldız, taç, lale …) gösteriliyor; kişiler birbirinden ayırt edilemiyor (T53).
- Görsellerin nereden alınacağı ve telif açısından hangilerinin güvenli olduğu belirlenmemişti.

## Çözüm

- **Kaynak:** Wikimedia Commons, Wikidata P18 üzerinden; yalnız kamu malı ve CC0, eseri de eski olan dosyalar. Gerekçe ve ölçüm `PORTRAITS_ANALYSIS.md` içindedir.
- **İçerik:** Her figürün içerik dosyasına isteğe bağlı bir `portrait` kaydı eklenir: dosya, eser adı, yazar, tarih, lisans, kaynak adresi.
- **Görseller:** Depoya indirilir, madalyon boyutuna küçültülür ve uygulamayla birlikte dağıtılır.
- **Arayüz:** Portresi olan figürde madalyonun içinde portre, olmayanda bugünkü simge gösterilir. Atıf "Kaynaklar" sekmesinde ve "Hakkında" penceresinde yer alır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 14.1 | Kaynak analizi yapılır ve kaynak seçilir. | 🟢 Tamamlandı |
| 14.2 | Aday dosyalar tek tek incelenir; kabul edilenler lisans kaydıyla birlikte içeriğe yazılır. | 🟢 Tamamlandı |
| 14.3 | İçerik şemasına ve veritabanına portre kaydı eklenir; görseller indirilip küçültülür. | 🟢 Tamamlandı |
| 14.4 | Madalyon portreyi gösterir; atıf kaynaklarda ve "Hakkında" penceresinde yer alır. | 🟢 Tamamlandı |
| 14.5 | Ölçüt genişletilir; Atatürk ve belgesi eksik eski portreler eklenir. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-1, FR-29 | Figür, varsa portresiyle, yoksa türünün simgesiyle gösterilir. | 14.4 |
| DR-5, FR-6 | Her görselin kaynağı, yazarı ve lisansı içerikte kayıtlıdır ve oyuncuya gösterilir. | 14.2, 14.3, 14.4 |
| NFR-6 | Görseller uygulamayla birlikte dağıtılır; oyuncunun cihazı üçüncü bir sunucuya bağlanmaz. | 14.3 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Lisansı kamu malı ya da CC0 olmayan bir portre kaydı içerik denetiminden geçmez. | `tests/unit/portraits.test.ts` | 🟢 Tamamlandı |
| Kaynak adresi, yazarı ya da tarihi eksik bir portre kaydı içerik denetiminden geçmez. | `tests/unit/portraits.test.ts` | 🟢 Tamamlandı |
| Portre kaydı olan her figürün görsel dosyası depoda vardır; kaydı olmayan görsel dosyası yoktur. | `tests/unit/portraits.test.ts` | 🟢 Tamamlandı |
| Portresi olan figürün kartında portre, olmayanın kartında simge görünür. | `tests/e2e/portraits.spec.ts` | 🟢 Tamamlandı |
| Portrenin atfı "Kaynaklar" sekmesinde görünür; temsilî portre öyle işaretlenir. | `tests/e2e/portraits.spec.ts` | 🟢 Tamamlandı |
| Uygulama çevrimdışıyken portreler görünür. | `tests/e2e/portraits.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Fatih Sultan Mehmed'in kartı açılır; madalyonda portresi görünür, "Kaynaklar" sekmesinde "Temsilî" notu yazar.
- [x] Kâtip Çelebi'nin kartı açılır; madalyonda bugünkü simge görünür.
- [x] "Kaynaklar" sekmesinde portrenin eser adı, yazarı, tarihi, lisansı ve kaynak bağlantısı yazar.
- [x] İnternet bağlantısı kesilip sayfa yenilenir; portreler görünmeye devam eder.

## Kalan

- **Kapsam:** 41 figür portreyle, 9 figür simgeyle gösteriliyor (ilk ölçütle 28 idi; 14.5'te genişletildi). Gerekçeler `content/portraits/REVIEW.md` içinde.
- **Portresi olmayan 9 figür:** Akşemseddin, Ali Kuşçu, Cem Sultan, Evliya Çelebi, İbrahim Müteferrika, Kâtip Çelebi, Kösem Sultan, Mimar Sinan, Pîrî Reis. Commons'taki görselleri heykel, büst ya da türbe fotoğrafı, CC BY-SA lisanslı, iki kişiyi birlikte gösteren ya da kimliği kesin olmayan görseller.
- **ABD'deki durum belirsiz:** Atatürk'ün 1932 ve İnönü'nün 1938 tarihli fotoğrafları Türkiye'de kamu malı; ABD'de korumanın yeniden canlanmış olabileceği dışlanamıyor. Commons ve Vikipedi bu dosyaları kamu malı olarak barındırıyor.
- **Çözünürlük:** Wikimedia Commons art arda yapılan indirmeleri zaman zaman reddediyor (HTTP 429). Faz 15'te 23 kaynak 960 pikselden alındı; 20 portre 360–500 piksellik kopyalardan üretiliyor. Sınır kalkınca `tmp/portrait-sources` içindeki küçük dosyalar silinip `npm run portraits:build -- --force` çalıştırılabilir.
- **Review bulguları:** `REVIEW/2026-11-24-2100.md` içindeki 9 bulgudan 8'i kapatıldı (tek majör dahil: kırpma mantığının testi yoktu). Açık kalan: bir portre kaydı değiştirilip `--force` unutulursa eski görsel kalır; bunu yakalayan bir denetim yok.
- **Sonar:** IDE kapalı olduğu için review Sonar'sız yapıldı. 14.5'teki içerik değişikliği (14 kayıt, 14 görsel, kural metni) review'dan sonra yapıldı; kod değişmediği için yeniden review çalıştırılmadı.
- **Kırpmalar gözle ayarlandı:** Yüzün madalyondaki yeri her portre için elle girildi (`crop`); insan gözüyle bir kez daha bakılması iyi olur.
- **Başlık düzeni:** Portreler geldiğine göre kart başlığının düzeni (S7'deki D seçeneği) yeniden değerlendirilebilir.
- **Haritadaki bayraklar:** Simgeyle kaldı; portre yalnız kartlarda, şeritlerde, seçme penceresinde ve ilişki grafında.

## Ayrıntılar

### 14.1 — Kaynak analizi yapılır ve kaynak seçilir.

- **Mevcut durum:** Figürlerin görseli yok; madalyonda türe göre simge gösteriliyor.
- **Problem:** Görsellerin kaynağı ve hangi lisansların güvenli olduğu bilinmiyordu (T53).
- **Çözüm:** Altı kaynak incelendi ve 50 figür için Wikidata ile Commons sorgulandı. Karar: Wikimedia Commons, yalnız kamu malı ve CC0, eser 1900 öncesi ya da yazarının ölümü belgeli.
- **Dosyalar:** `docs/tasks/HJ-1/PORTRAITS_ANALYSIS.md`, `docs/tasks/HJ-1/questions/S08-portre-kaynagi.md`
- **Testler:** Yok (analiz).
- **Durum:** 🟢 Tamamlandı.

### 14.2 — Aday dosyalar tek tek incelenir; kabul edilenler lisans kaydıyla birlikte içeriğe yazılır.

- **Mevcut durum:** 49 figür için Commons'ta aday dosya var; 45'i kamu malı ya da CC0 beyanlı.
- **Problem:** Commons'taki lisans yükleyenin beyanıdır; güncel fotoğraflar ve 20. yüzyıl fotoğrafları ayrıca incelenmeli.
- **Çözüm:** Her aday için dosya sayfası okunur: eserin ne olduğu, yazarı, tarihi, lisans gerekçesi. Analizdeki ölçütü
  karşılayanlar için figürün içerik dosyasına `portrait` kaydı yazılır; kişinin ölümünden sonra yapılmış portre `representative`
  olarak işaretlenir. Reddedilenler ve gerekçeleri `content/portraits/REVIEW.md` içinde listelenir. İçerik kural setine
  (`content/rules/RULESET.md`) portre kuralı eklenir.
- **Dosyalar:** `content/figures/*.json` (28 dosya), `content/portraits/REVIEW.md`, `content/rules/RULESET.md`
- **Testler:** `tests/unit/portraits.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 14.3 — İçerik şemasına ve veritabanına portre kaydı eklenir; görseller indirilip küçültülür.

- **Mevcut durum:** İçerik şemasında görsel alanı yok.
- **Problem:** Görsel ve lisans bilgisi uygulamaya taşınamıyor.
- **Çözüm:** `figureSchema` içine isteğe bağlı `portrait` nesnesi eklenir; izin verilen lisanslar şemada sayılır ve başka
  lisans reddedilir. `scripts/build-portraits.py` kayıtlardaki dosyaları Commons'tan indirir, kayıttaki kareyi kırpar, 200 piksele küçültür ve
  `public/portraits/<slug>.webp` olarak yazar; görseller depoya girer. Veritabanına `portrait_json` sütunu eklenir (şema
  sürümü 3); `FigureSummary` portre kaydını taşır, görselin yolu figürün slug'ından bulunur. Görseller PWA önbelleğine alınır.
- **Dosyalar:** `src/domain/contentSchema.ts`, `src/domain/types.ts`, `src/data/dbSchema.ts`, `src/data/buildDatabase.ts`, `src/data/SqliteContentRepository.ts`, `src/data/contentValidation.ts`, `scripts/build-portraits.py`, `public/portraits/*.webp`, `vite.config.ts`, `package.json`
- **Testler:** `tests/unit/portraits.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 14.4 — Madalyon portreyi gösterir; atıf kaynaklarda ve "Hakkında" penceresinde yer alır.

- **Mevcut durum:** `Medallion` yalnız figür türünün simgesini çizer; haritadaki bayraklar da aynı simgeyi kullanır.
- **Problem:** Kişiler görsel olarak ayırt edilemiyor (T53).
- **Çözüm:** `Medallion` portre yolu verildiğinde portreyi altın çerçevenin içinde gösterir; yol yoksa ya da görsel
  yüklenemezse simgeye döner. Kart başlığı, rota şeritleri, figür seçme penceresi ve ilişki grafı portreyi kullanır;
  haritadaki bayraklar simgeyle kalır. "Kaynaklar" sekmesine portrenin atfı, "Hakkında" penceresine görsellerin kaynağı
  ve lisans ölçütü eklenir.
- **Dosyalar:** `src/ui/Medallion.tsx`, `src/ui/FigureCard.tsx`, `src/ui/CardDetails.tsx`, `src/ui/RoutePanel.tsx`, `src/ui/TopBar.tsx`, `src/ui/dialogs/*.tsx`, `src/domain/relationGraph.ts`, `src/ui/theme/base.css`, `src/ui/theme/card.css`
- **Testler:** `tests/e2e/portraits.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 14.5 — Ölçüt genişletilir; Atatürk ve belgesi eksik eski portreler eklenir.

- **Mevcut durum:** Ölçüt, eserin tarihinin ya da yazarının dosya sayfasında belgelenmesini istiyor; 28 figür portre aldı.
- **Problem:** Atatürk'ün portresi yok; binlerce fotoğrafı olan bir figür için bu kabul edilemez. Vikipedi'nin kullandığı görsellerin neden kullanılamadığı soruldu (T58, T59).
- **Çözüm:** R21 genişletilir: Commons'ta kamu malı ya da CC0 olarak işaretli görsel, tarihi 70 yıldan eski ve yazarı bilinmeyen bir fotoğrafsa ya da 70 yıldan uzun süre önce ölmüş bir figürün açıkça eski bir portresiyse (gravür, minyatür, yağlıboya, hayattayken çekilmiş fotoğraf) alınır. Geri çevrilen adaylara yeniden bakıldı; 13 figür daha portre aldı. Atatürk için gösterilen 1932 tarihli fotoğraf, Fatih için gösterilen Bellini ekolü portresi kullanıldı. Heykel ve büst fotoğrafları ile CC BY-SA dosyaları yine alınmıyor.
- **Dosyalar:** `content/figures/*.json` (14 dosya), `public/portraits/*.webp`, `content/rules/RULESET.md`, `content/portraits/REVIEW.md`
- **Testler:** `tests/unit/portraits.test.ts`, `tests/e2e/portraits.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `PORTRAITS_ANALYSIS.md`
- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 14
- `docs/requirements/history-journeys.md` → D8, DR-5, FR-6, NFR-6
