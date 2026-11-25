# Faz 16 — Yeni figür: I. Konstantin

> **Durum:** 🟡 Kısmi · **Tamamlanma:** 90% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

İstanbul'u başkent yapan Roma imparatoru I. Konstantin içeriğe eklenir. Bitince kartı, yolculuğu ve Fatih Sultan
Mehmed'e giden bağı uygulamada görünür.

## Problem

- İçerik Fatih Sultan Mehmed ile başlar; İstanbul'u ilk kez başkent yapan I. Konstantin yoktur (T125).
- Bu yüzden şehrin fetihten önceki bin yılı ve Fatih'in neden bu şehri başkent yaptığı kartlarda bir figüre bağlanamaz.

## Çözüm

- **Kart:** I. Konstantin kural setine göre yazılır: üç cümlelik özet, neden ve sonuçlarıyla üç eylem, kaynaklar.
- **Yolculuk:** Hayatı tarihli duraklarla verilir: Niş, İzmit, York, Trier, Roma, İznik, İstanbul ve yeniden İzmit.
- **Bağ:** Fatih Sultan Mehmed'e "etki" ilişkisi yazılır; iki figür arasında rota bu ilişkiden hesaplanır.
- **Portre:** Ayasofya'daki yaklaşık 1000 yılına ait mozaikten bir ayrıntı kullanılır: kamu malıdır, heykel değildir ve figürü tek başına gösterir. Yaşadığı dönemde yapılmadığı için "temsilî" olarak işaretlenir.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 16.1 | I. Konstantin'in kartı kural setine göre yazılır. | 🟢 Tamamlandı |
| 16.2 | Yolculuğu tarihli duraklarla haritada görünür. | 🟢 Tamamlandı |
| 16.3 | Fatih Sultan Mehmed'e bağlanır; aralarında rota bulunur. | 🟢 Tamamlandı |
| 16.4 | Portre incelenir; sonucu kayda geçer. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| Gereksinim (T125) | İstanbul'u başkent yapan I. Konstantin, yolculuğuyla birlikte figürler arasına eklenir. | 16.1, 16.2, 16.3 |
| CG-1…CG-8 | Kart, yazılı kural setine göre ve kaynak gösterilerek üretilir. | 16.1 |
| DR-5 | Portre yalnız kural setine uyuyorsa kullanılır. | 16.4 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Gerçek içerik şemadan ve içerik denetiminden hatasız geçer. | `tests/unit/konstantin.test.ts` | 🟢 Tamamlandı |
| I. Konstantin Niş'te doğar, İzmit yakınlarında ölür; durakları zaman sırasındadır ve harita bölgesinin içindedir. | `tests/unit/konstantin.test.ts` | 🟢 Tamamlandı |
| İstanbul durağı ortak yer kaydıyla aynıdır. | `tests/unit/konstantin.test.ts` | 🟢 Tamamlandı |
| I. Konstantin ile Fatih Sultan Mehmed arasında rota bulunur. | `tests/unit/konstantin.test.ts` | 🟢 Tamamlandı |
| Kartı uygulamada açılır ve haritada işareti görünür. | `tests/e2e/konstantin.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [ ] Figür seçicide "Konstantin" aranır; kartı açılır.
- [ ] Yolculuk oynatılır; işaret Niş'ten başlayıp York, Trier, Roma ve İznik üzerinden İstanbul'a gelir.
- [ ] Başlangıç I. Konstantin, varış Fatih Sultan Mehmed seçilir; rota bulunur.

## Kalan

- İçeriği bir kişi (tarih bilen biri) gözden geçirmedi; kart "generated" durumundadır.
- Britannica adresi otomatik isteklere kapalı olduğu için komut satırından doğrulanamadı.
- Fatih Sultan Mehmed dışında gerçek bir ilişki bulunmadığı için tek ilişkisi vardır.
- Figür hiçbir hatta değildir; figür seçicide "Diğer figürler" altında görünür.

## Ayrıntılar

### 16.1 — I. Konstantin'in kartı kural setine göre yazılır.

- **Mevcut durum:** Figür yok.
- **Problem:** İstanbul'u başkent yapan kişi içerikte yer almıyor (T125).
- **Çözüm:** `content/figures/konstantin-i.json` yazılır. Tür olarak "lider" kullanılır; şemada imparator için ayrı bir tür yoktur ve "padişah" Osmanlı hükümdarlarına aittir. Eylemler: Hristiyanlığı serbest bırakması (313), İznik Konsili (325), başkenti taşıması (330). Tartışmalı ya da sadeleştirilmiş noktalar "derinlik" notuna yazılır.
- **Dosyalar:** `content/figures/konstantin-i.json`, `content/rules/AGENT_BRIEF.md`
- **Testler:** `tests/unit/konstantin.test.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 16.2 — Yolculuğu tarihli duraklarla haritada görünür.

- **Mevcut durum:** Figür yok.
- **Problem:** Yolculukları da isteniyor (T125).
- **Çözüm:** Sekiz durak yazılır; yıllar yalnız gerçekten orada bulunduğu yıllardır (R17). İstanbul, İzmit ve Roma için var olan yer kayıtları kullanılır; yeni yerler ortak yer listesine eklenir.
- **Dosyalar:** `content/figures/konstantin-i.json`, `content/places-registry.md`
- **Not:** Roma dışındaki beş yer (Niş, İzmit, York, Trier, İznik) yenidir. İzmit durağının yılları (293–305) saraya bağlı olduğu dönemi gösterir; bu yıllarda doğu seferlerine de katıldı.
- **Testler:** `tests/unit/konstantin.test.ts`, `tests/e2e/konstantin.spec.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 16.3 — Fatih Sultan Mehmed'e bağlanır; aralarında rota bulunur.

- **Mevcut durum:** Rotalar figürler arasındaki ilişkilerden hesaplanır; ilişkisi olmayan figüre rota bulunmaz.
- **Problem:** I. Konstantin öbür figürlerden bin yıl önce yaşadı; aile, hizmet ya da hocalık ilişkisi yoktur.
- **Çözüm:** Tarihsel olarak gerçek tek bağ yazılır: kurduğu başkenti Fatih'in fethedip kendi başkenti yapması ("etki"). Uydurma ikinci bir ilişki yazılmaz.
- **Dosyalar:** `content/figures/konstantin-i.json`
- **Testler:** `tests/unit/konstantin.test.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 16.4 — Portre incelenir; sonucu kayda geçer.

- **Mevcut durum:** Portreler yalnız kamu malı ya da CC0, eski ve figürü tek başına gösteren eserlerden alınır; heykel ve büst fotoğrafı kullanılmaz (R20–R22).
- **Problem:** Wikidata'nın gösterdiği dört görselden üçü heykel fotoğrafıdır ve kullanılamaz.
- **Çözüm:** Dördüncüsü, Ayasofya'nın güneybatı girişindeki mozaikten (1000 dolayları) I. Konstantin'i tek başına gösteren ayrıntıdır; Commons'ta kamu malı olarak kayıtlıdır. Görsele bakıldı, kabul edildi ve "temsilî" olarak işaretlendi. Karar `content/portraits/REVIEW.md` içine yazıldı.
- **Dosyalar:** `content/figures/konstantin-i.json`, `content/portraits/REVIEW.md`, `public/portraits/konstantin-i.webp`
- **Testler:** `tests/unit/portraits.test.ts` (var olan)
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### Referanslar

- `content/rules/RULESET.md` → kural seti
- `PHASE2.md` → içeriğin ilk üretimi
- `PHASE14.md` → portre kuralları
