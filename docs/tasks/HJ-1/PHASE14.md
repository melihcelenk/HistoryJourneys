# Faz 14 — Figür portreleri

> **Durum:** ⏳ Bekliyor · **Tamamlanma:** 0% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Figür kartlarında, haritada ve seçme pencerelerinde madalyon yerine kişinin portresi gösterilir. Portresi olmayan
figürde bugünkü madalyon kalır. Bu faz planlanmıştır; uygulamaya başlanması için onay beklenir.

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
| 14.2 | Aday dosyalar tek tek incelenir; kabul edilenler lisans kaydıyla birlikte içeriğe yazılır. | ⏳ Bekliyor |
| 14.3 | İçerik şemasına ve veritabanına portre kaydı eklenir; görseller indirilip küçültülür. | ⏳ Bekliyor |
| 14.4 | Madalyon portreyi gösterir; atıf kaynaklarda ve "Hakkında" penceresinde yer alır. | ⏳ Bekliyor |

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
| Lisansı kamu malı ya da CC0 olmayan bir portre kaydı içerik denetiminden geçmez. | `tests/unit/data.test.ts` | ⏳ Bekliyor |
| Kaynak adresi, yazarı ya da tarihi eksik bir portre kaydı içerik denetiminden geçmez. | `tests/unit/data.test.ts` | ⏳ Bekliyor |
| Portre kaydı olan her figürün görsel dosyası depoda vardır; kaydı olmayan görsel dosyası yoktur. | `tests/unit/contentIntegrity.test.ts` | ⏳ Bekliyor |
| Portresi olan figürün kartında portre, olmayanın kartında simge görünür. | `tests/e2e/portraits.spec.ts` | ⏳ Bekliyor |
| Portrenin atfı "Kaynaklar" sekmesinde görünür; temsilî portre öyle işaretlenir. | `tests/e2e/portraits.spec.ts` | ⏳ Bekliyor |
| Uygulama çevrimdışıyken portreler görünür. | `tests/e2e/portraits.spec.ts` | ⏳ Bekliyor |

## Nasıl kontrol edilir

- [ ] Fatih Sultan Mehmed'in kartı açılır; madalyonda portresi görünür.
- [ ] Kâtip Çelebi'nin kartı açılır; madalyonda bugünkü simge görünür.
- [ ] "Kaynaklar" sekmesinde portrenin eser adı, yazarı, tarihi, lisansı ve kaynak bağlantısı yazar.
- [ ] İnternet bağlantısı kesilip sayfa yenilenir; portreler görünmeye devam eder.

## Kalan

- 14.2–14.4: uygulama. Başlamak için onay beklenir (S8).
- **Başlık düzeni:** Portreler geldiğinde kart başlığının düzeni (S7'deki D seçeneği) yeniden değerlendirilecek.

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
- **Dosyalar:** `content/figures/*.json`, `content/portraits/REVIEW.md`, `content/rules/RULESET.md`
- **Testler:** `tests/unit/data.test.ts`
- **Durum:** ⏳ Bekliyor.

### 14.3 — İçerik şemasına ve veritabanına portre kaydı eklenir; görseller indirilip küçültülür.

- **Mevcut durum:** İçerik şemasında görsel alanı yok.
- **Problem:** Görsel ve lisans bilgisi uygulamaya taşınamıyor.
- **Çözüm:** `figureSchema` içine isteğe bağlı `portrait` nesnesi eklenir; izin verilen lisanslar şemada sayılır ve başka
  lisans reddedilir. `scripts/build-portraits.ts` kayıtlardaki dosyaları indirir, kare kırpar, küçültür ve `public/portraits/`
  altına yazar. Veritabanına portre alanları eklenir; `FigureSummary` portrenin yolunu ve temsilî olup olmadığını taşır.
  Görseller PWA önbelleğine alınır.
- **Dosyalar:** `src/domain/contentSchema.ts`, `src/domain/types.ts`, `src/data/dbSchema.ts`, `src/data/buildDatabase.ts`, `src/data/SqliteContentRepository.ts`, `src/data/contentValidation.ts`, `scripts/build-portraits.ts`, `vite.config.ts`
- **Testler:** `tests/unit/data.test.ts`, `tests/unit/contentIntegrity.test.ts`
- **Durum:** ⏳ Bekliyor.

### 14.4 — Madalyon portreyi gösterir; atıf kaynaklarda ve "Hakkında" penceresinde yer alır.

- **Mevcut durum:** `Medallion` yalnız figür türünün simgesini çizer; haritadaki bayraklar da aynı simgeyi kullanır.
- **Problem:** Kişiler görsel olarak ayırt edilemiyor (T53).
- **Çözüm:** `Medallion` portre yolu verildiğinde portreyi altın çerçevenin içinde gösterir; yol yoksa ya da görsel
  yüklenemezse simgeye döner. Kart başlığı, rota şeritleri, figür seçme penceresi ve ilişki grafı portreyi kullanır;
  haritadaki bayraklar simgeyle kalır. "Kaynaklar" sekmesine portrenin atfı, "Hakkında" penceresine görsellerin kaynağı
  ve lisans ölçütü eklenir.
- **Dosyalar:** `src/ui/Medallion.tsx`, `src/ui/FigureCard.tsx`, `src/ui/CardDetails.tsx`, `src/ui/dialogs/InfoDialogs.tsx`, `src/ui/theme/base.css`
- **Testler:** `tests/e2e/portraits.spec.ts`
- **Durum:** ⏳ Bekliyor.

### Referanslar

- `PORTRAITS_ANALYSIS.md`
- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 14
- `docs/requirements/history-journeys.md` → D8, DR-5, FR-6, NFR-6
