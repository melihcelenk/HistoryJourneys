# Faz 2 — Saray odası

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Fatih döneminin bir saray odası kurulur: kaynaklara bakılarak tasarlanır, geometrisi ve dokuları kodla üretilir. Bitince oda beş sabit kameradan dönemin bir saray odası olarak tanınır.

## Problem

- Sahnede oda yok; yalnız bir zemin var.
- Odanın neye benzeyeceği tahminle değil, dönemin ayakta kalan yapılarına ve yazılı kaynaklara bakılarak belirlenmeli.
- Hazır doku ve model kullanılmayacağı için her yüzey ve eşya kodla üretilmeli.

## Çözüm

- **Kaynaklar:** Çinili Köşk (1472), Topkapı'nın Fatih dönemi bölümleri ve 15. yüzyıl Bursa–Edirne iç mekânları incelenir; kullanılan her bilgi `REFERENCES.md` içinde kaynağıyla yazılır.
- **Dönemin çinisi:** Duvarın alt bölümü altıgen ve üçgen, firuze ve lacivert, altın yaldızlı çinidir. Beyaz zeminli kırmızı laleli İznik çinisi 16. yüzyıl ortasından sonraya ait olduğu için kullanılmaz.
- **Oda:** Kuzeyde davlumbazlı ocak ve nişler, doğuda iki sıra pencere ve altında sedir, batıda dolap nişleri, güneyde kapı; boyalı ahşap tavan, halı, mangal, şamdan.
- **Işık:** Alçak güneş doğu pencerelerinden girer, parmaklıkların gölgesini zemine ve figüre düşürür; ocak ateşi titrer.
- **Çarpışma verisi:** Eşyaların zemin planındaki kutuları oda tanımından üretilir ve oyuncunun yürüyüşünde kullanılır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 2.1 | Odanın kaynakları incelenir ve REFERENCES.md yazılır. | 🟢 Tamamlandı |
| 2.2 | Odanın kabuğu kurulur: duvarlar, çini, pencereler, nişler, zemin ve tavan. | 🟢 Tamamlandı |
| 2.3 | Eşyalar yerleştirilir: ocak, sedir, halı, mangal, şamdan, kandil. | 🟢 Tamamlandı |
| 2.4 | Işık kurulur: pencereden giren güneş, dolgu ışığı ve ateş. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir (K1–K6).

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K2 | Oda, dönemin bir saray odası olarak tanınır. | 2.1–2.4 |
| K4 | Oyuncu eşyaların içinden geçemez. | 2.3 |
| K5 | Çizim bütçesi aşılmaz. | 2.2, 2.3 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Aynı tohumla desenler hep aynı çıkar. | `tests/unit/sceneRoom.test.ts` | 🟢 Tamamlandı |
| Çarpışma kutuları odanın içindedir; figürün yeri ve girişten ona giden yol boştur. | `tests/unit/sceneRoom.test.ts` | 🟢 Tamamlandı |
| Odanın dört kameradan görüntüsü altın görüntüyle eşleşir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] `entrance`, `hearth`, `windows`, `back` ve `ceiling` kameralarının görüntüleri `REFERENCES.md` içindeki kaynaklarla yan yana bakıldığında aynı tür odayı gösterir.
- [x] Hiçbir yüzey dokusuz ve düz değildir; desenlerde gözle görülür tekrar ya da titreşim yoktur.

## Kalan

- **Fotoğrafla kıyas yapılmadı:** Araştırma sayfa metinlerinden yapıldı; oda, kaynak fotoğraflarıyla yan yana konarak karşılaştırılmadı.
- **Canlandırma olan ögeler:** Sedir, düz boyalı tavan, davlumbazın biçimi ve taşınır eşyalar bir kaynağa bağlanamadı; `REFERENCES.md` bunları ayrı listeler.
- **Görsel zayıflıklar:** Güney duvarı ve kapı loş; halıdaki parmaklık gölgeleri yumuşak; üst pencerelerden gelen ışık renkli değil; halı yeni gibi duruyor.
- **Oda 4,8 m yüksek** (planlanan 4,6 m): iki sıra pencere ve tavan kuşağı sığsın diye.

## Ayrıntılar

### 2.1 — Odanın kaynakları incelenir ve REFERENCES.md yazılır.

- **Mevcut durum:** Oda için bakılmış bir kaynak yoktur.
- **Problem:** Kaynaksız kurulan bir oda döneme ait olmayan ögeler (ör. 16. yüzyıl İznik çinisi) içerebilir.
- **Çözüm:** Web'de araştırma yapılır; her ögenin hangi kaynaktan alındığı ve hangisinin bilgiye dayalı canlandırma olduğu yazılır.
- **Dosyalar:** `docs/tasks/HJ-2/REFERENCES.md`
- **Testler:** -
- **Durum:** 🟢 Tamamlandı.

### 2.2 — Odanın kabuğu kurulur: duvarlar, çini, pencereler, nişler, zemin ve tavan.

- **Mevcut durum:** Yer tutucu bir zemin vardır.
- **Problem:** Oda yoksa sahne yoktur.
- **Çözüm:** Oda planı saf veri olarak tutulur (`layout.ts`); duvarlar açıklıklarıyla birlikte bu plandan üretilir. Çini, sıva, ahşap ve taş dokuları Canvas ile kodda boyanır; kabartma haritaları yükseklik verisinden türetilir.
- **Dosyalar:** `src/scene3d/room/`
- **Testler:** `tests/unit/sceneRoom.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 2.3 — Eşyalar yerleştirilir: ocak, sedir, halı, mangal, şamdan, kandil.

- **Mevcut durum:** Odada eşya yoktur.
- **Problem:** Boş bir oda saray odası olarak okunmaz.
- **Çözüm:** Eşyalar kodla modellenir, plana göre yerleştirilir ve çarpışma kutuları çıkarılır.
- **Dosyalar:** `src/scene3d/room/`
- **Testler:** `tests/unit/sceneRoom.test.ts`
- **Durum:** 🟢 Tamamlandı.

### 2.4 — Işık kurulur: pencereden giren güneş, dolgu ışığı ve ateş.

- **Mevcut durum:** Düz, yönsüz bir ışık vardır.
- **Problem:** Bir iç mekânı oyun gibi gösteren şey ışıktır.
- **Çözüm:** Gölge düşüren tek bir güneş ışığı pencerelerden girer; dolgu ışıkları gölgeleri açar; ateşin ışığı zamana bağlı titrer.
- **Dosyalar:** `src/scene3d/room/lights.ts`
- **Testler:** `tests/e2e/scene.spec.ts` (altın görüntüler)
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `REFERENCES.md`
- `MAIN_TODO.md` → Kabul ölçütleri → K2
