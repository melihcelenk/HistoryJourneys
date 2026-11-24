# TODO: [HJ-1] History Journeys ilk sürüm: oyun arayüzlü çalışan uygulama

> **📌 Referans Dokümanlar:**
>
> - `MAIN_TODO.md` - Bu dosya (ana takip)
> - `PHASE{N}.md` - Her fazın detaylı implementasyon planı
> - `TALIMATLAR.md` - Kullanıcının her talimatı ve alındığı faz
> - `questions/` - Açık kararlar (soru kartları S1–S5)
> - `../../requirements/history-journeys.md` - Platform gereksinimleri (FR, DR, CG, NFR)

<!-- Lima'daki projeler (MBL, HLABEL, HAP) şirket ürünleridir; bu açık kaynak proje onlardan biri değildir. Bu yüzden
     Lima'ya gereksinim ya da senaryo yazılmadı; gereksinimler `docs/requirements/` altındadır. -->
**🧪 Lima projesi:** `yok`

---

## 🌿 Branch Bilgisi

| Repo | Yol | Branch | Nereden açıldı | PR hedefi | Rolü |
|------|-----|--------|----------------|-----------|------|
| `HistoryJourneys` (ana repo) | `C:\Kodlar\HistoryJourneys` | `feature/HJ-1` | `main` | `main` | Web uygulaması, içerik ve dokümanlar |

---

## 📊 Genel İlerleme

| Faz | Başlık | Durum | Tamamlanma | Dosya |
|-----|--------|-------|------------|-------|
| 1 | Altyapı ve kendi kendine ilerleyen test sistemi | 🟢 Tamamlandı | 100% | `PHASE1.md` |
| 2 | Veri modeli, SQLite ve yaklaşık 50 figürün içeriği | 🟢 Tamamlandı | 100% | `PHASE2.md` |
| 3 | İki figür arasında rota hesaplayan motor | 🟢 Tamamlandı | 100% | `PHASE3.md` |
| 4 | Oyun arayüzü: ekran, parşömen kartlar ve rota zinciri | 🟢 Tamamlandı | 100% | `PHASE4.md` |
| 5 | Harita (MapLibre) ve zaman çizelgesi | 🟢 Tamamlandı | 100% | `PHASE5.md` |
| 6 | Öğrenme oyunu | 🟢 Tamamlandı | 100% | `PHASE6.md` |
| 7 | Kalıcı bağlantılar, PWA ve Microsoft Store hazırlığı | 🟢 Tamamlandı | 100% | `PHASE7.md` |
| 8 | PixiJS ile boyalı oyun haritası | 🟢 Tamamlandı | 100% | `PHASE8.md` |

<!-- Durum ikonları: 🟢 Tamamlandı | 🟡 Kısmi | ⏳ Bekliyor | 🔴 Bloke -->

---

## ✅ Hazırlık Durumu

| Bölüm | Durum | Kapsadığı | Son kontrol |
|-------|-------|-----------|-------------|
| Genel Dokümanlar | 🟢 Tamam | `docs/general/ARCHITECTURE.md`, `docs/general/STORE_PUBLISHING.md`, `README.md` | çalışma ağacı (commit yok) |
| Devops Notları | 🟢 Tamam | "🚀 Devops Notları" bölümü (derleme ve yayın adımları) | çalışma ağacı (commit yok) |

---

## 📝 Task Definition

### Mevcut Durum

Repoda yalnız gereksinim dokümanları var (`docs/requirements/`), kod yok. Gereksinimler bu branch'te kullanıcının
kararlarıyla güncellendi: oyun arayüzü (FR-29–33), "önce basit, istenirse derin" (D5, FR-27), kullanıcı verisi
tutulmaması (D6), üretilen içeriğin CC BY-SA 4.0 olması (D8).

### İstenen

Sabaha, kullanıcıdan hiçbir şey beklemeden bitmiş bir ilk sürüm (T4):

1. İki figür seçilir, aralarındaki rota hesaplanır, alternatif rotaya geçilebilir (FR-7–12, FR-28).
2. Rota, parşömen kartlardan oluşan dikey bir zincir olarak gösterilir; her eylemin Neden ve Sonuç düğmesi,
   sadeleştirilmiş bilgilerde derinlik simgesi vardır (FR-1–6, FR-27).
3. Arayüz bir strateji oyunu gibi görünür ve hissettirir: harita sahnesi, mini harita, komut çubuğu, tarih (FR-29–33).
   **Bu, işin kabul ölçütüdür: arayüz gerçek oyun standardında olmalıdır (T6).**
4. Harita önce MapLibre ile (03.00'e kadar), süre kalırsa PixiJS ile boyalı oyun haritası olarak (05.00'e kadar) yapılır.
5. Veri şimdilik SQLite'ta tutulur; sonra değiştirilebilecek şekilde bir depo arayüzünün arkasındadır.
6. Uygulama hem tarayıcıda hem Microsoft Store'da oyun gibi yayınlanabilecek yapıda olur.
7. Testler tamamen otomatik ilerler; ekran görüntüleri düzenli incelenir.
8. Kod temiz kalır: her fazdan sonra `/h-review` ve `/h-review-fix` çalıştırılır (T6).
9. Sabah en çok 5 açık soru kalır; her birinde seçim yapılmış ve uygulanmıştır, kullanıcı farklı seçerse değiştirilir.

### Açıklayıcı Örnekler

- Atatürk ve Fatih seçilir. "Osmanlı saltanatı üzerinden" rotası, Atatürk → Vahdeddin → … → I. Ahmed → … → Fatih
  zincirini verir; her bağlantıda ilişki adı yazar ("hizmetinde çalıştı", "tahtta selefi").
- I. Ahmed kartında "Kardeşi Mustafa'yı öldürtmedi…" eyleminde Neden düğmesi III. Mehmed'in 19 kardeşini anlatır;
  derinlik simgesi kuralın yıllar içinde yerleştiğini ekler; *ekber* sözcüğü k-b-r köküne ve *kibir*, *tekbir*'e açılır.
- Zaman çizelgesi 1609'a çekilince haritada I. Ahmed İstanbul'da görünür.

### Test Senaryoları

- Birim: rota motoru (alternatifler, kronoloji, anlamsız bağlantıların elenmesi), içerik şeması, veri deposu, bağlantı
  işaretleme ayrıştırıcısı, takvim çevirisi.
- Uçtan uca (Playwright, masaüstü ve telefon görünümü): figür seçimi → rota → kart açma → Neden/Sonuç → derinlik →
  kavram → dallanıp rotaya dönme → harita ve zaman çizelgesi → oyun → bağlantıyla aynı durumu açma.
- Görsel: her fazda ekran görüntüsü alınır ve oyun hissi açısından incelenir.

### Error Case'leri

- İki figür arasında anlamlı rota yoksa: "Bu iki figür arasında anlamlı bir rota bulunamadı" kartı.
- Aynı figür iki kez seçilirse: rota yerine o figürün kartı açılır.
- Bağlantıda bilinmeyen figür ya da bozuk durum varsa: başlangıç ekranı açılır, hata verilmez.
- İçerik dosyası şemaya uymuyorsa ya da var olmayan bir figüre bağlantı veriyorsa: veritabanı derlemesi hata ile durur.
- Veritabanı dosyası yüklenemezse: oyun tarzı bir hata ekranı ve "Yeniden dene" düğmesi.

---

## 🔍 Preanalysis

### Mevcut Yapı

Kod yok. Gereksinimler: `docs/requirements/history-journeys.md` (platform), `ataturk-life-journey.md` (ilk içerik
paketi), `religion-history-diagrams.md` (ertelendi).

### Teknik Analiz

**Sorunlar:**

- Oyun hissi iki ayrı işten oluşur: harita (çizim motoru ister) ve kartlar ile oyun arayüzü (HTML/CSS ile yapılır).
- Hazır web haritaları modern sınırları ve adları gösterir; tarihî bir oyunda yanlış durur. Çözüm: harita karoları
  yerine Natural Earth (kamu malı) kara, göl ve nehir verisi yerelde çizilir; yer adları kendi verimizden gelir.
  Böylece uygulama çevrimdışı da çalışır (Store paketi ve kararlı testler için gerekli).
- İçerik üretimi en büyük iş: yaklaşık 50 figür için özet, eylem, neden, sonuç, derinlik notu, yolculuk ve kaynak.
- İnsan onayı yok (D2); her bilginin kaynağı tutulur ve içerik "üretildi" durumuyla işaretlenir.

### Best Practice Uygunluğu

- Alan mantığı (rota motoru, takvim, işaretleme) arayüzden bağımsız, saf TypeScript ve birim testli.
- Veri erişimi bir depo arayüzünün arkasında; SQLite sonra başka bir depoyla değiştirilebilir.
- Harita bir `MapView` arayüzünün arkasında; MapLibre ve PixiJS aynı arayüzü uygular.

### Teknik Borç

- Tarihî sınırlar (FR-15) bu task'ta yok; OpenHistoricalMap verisinin işlenmesi ayrı bir iş.
- Figür portreleri yok; açık lisanslı görsellerin tek tek lisans kaydı gerekir (FR-33).

---

## 💡 Solution Suggestions

### Plan A: Vite + React + TypeScript, harita arayüzün arkasında (Recommended)

**Efor:** Bir gece (8 faz).
**Risk:** Orta; en büyük risk içerik hacmi ve oyun hissinin yalnız CSS ile yakalanması.
**Ölçeklenebilirlik:** Statik dosyalar; sunucu yok. Depo ve harita arayüzleri değiştirilebilir.
**Teknik Borç:** Tarihî sınırlar ve portreler sonraya kalır.

**Planlanan Akış:**

```
content/*.json ──(şema denetimi)──► scripts/build-db.ts ──► public/data/hj.sqlite
                                                                    │
tarayıcı: sql.js ──► ContentRepository ──► rota motoru ──► oyun ekranı (React)
                                                              ├─ MapView: MapLibre | PixiJS
                                                              └─ kartlar, zincir, HUD, oyun
```

### Plan B: Oyun motoru (Godot / Unity web çıktısı)

**Efor:** Çok daha yüksek.
**Risk:** Yüksek; yoğun metin, Türkçe karakter, bağlantı paylaşımı ve mobil yükleme süresi zayıf.
**Ölçeklenebilirlik:** Store için iyi, web için kötü.
**Teknik Borç:** Erişilebilirlik ve içerik güncelleme akışı.

### Karşılaştırma

| Kriter | Plan A | Plan B |
|--------|--------|--------|
| Efor | Düşük-orta | Yüksek |
| Risk | Orta | Yüksek |
| Ölçeklenebilirlik | Web ve Store (PWA) | Store ağırlıklı |

### Öneri

Plan A. Ayrıntılı gerekçe: `questions/S01-teknoloji-yigini.md`.

### ✅ Karar Kılınan Çözüm

Kullanıcı planın bütününü ayrıca onaylamadı; "ilk versiyonu oluştur, soruların cevabını sen seç, sorular açık kalsın"
dedi (T4). Bu yüzden Plan A **geçici karar** olarak uygulanıyor; S1–S5 açık duruyor ve kullanıcı farklı seçerse
değiştirilecek.

---

## 🚀 Devops Notları

- **Gereksinim:** Node.js 22 ya da üstü. Sunucu, veritabanı sunucusu ve ortam değişkeni yoktur.
- **Derleme:** `npm install`, ardından `npm run build`; çıktı `dist/` klasöründeki statik dosyalardır.
- **Yayın:** `dist/` içeriği HTTPS veren herhangi bir statik barındırmaya yüklenir (PWA için HTTPS şarttır).
- **Store:** adımlar `docs/general/STORE_PUBLISHING.md` içinde; karar S4.
- **Doğrulama:** `npm run test:all` (tip denetimi, lint, birim ve uçtan uca testler).

---

## 🎯 Faz Özetleri

### 🟢 Faz 1 — Altyapı ve kendi kendine ilerleyen test sistemi

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE1.md`](PHASE1.md)

Proje iskeleti (Vite, React, TypeScript), birim testi (Vitest), uçtan uca test ve ekran görüntüsü (Playwright),
tip denetimi ve lint kurulur. Bitince tek komut (`npm run test:all`) her şeyi doğrular.

### 🟢 Faz 2 — Veri modeli, SQLite ve yaklaşık 50 figürün içeriği

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE2.md`](PHASE2.md)

İçerik şeması, kural seti, içerik dosyalarından SQLite veritabanı üreten derleme ve tarayıcıdaki veri deposu yazılır.
Ana hat (Fatih'ten Vahdeddin'e 30 padişah ve Atatürk) ile ek hatların figürleri kural setine göre üretilir.

### 🟢 Faz 3 — İki figür arasında rota hesaplayan motor

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE3.md`](PHASE3.md)

İlişki türleri ve ağırlıklarıyla, kronolojiye uyan ve birbirinden farklı birkaç rota hesaplanır. Her rota kısa bir
açıklama ("saltanat üzerinden", "aile üzerinden") ve her adım ilişki adı taşır.

### 🟢 Faz 4 — Oyun arayüzü: ekran, parşömen kartlar ve rota zinciri

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE4.md`](PHASE4.md)

Tek bir oyun ekranı kurulur: figür seçimi, rota seçenekleri, parşömen kart zinciri, Neden ve Sonuç, derinlik simgesi,
kavram ve köken penceresi, dallanıp rotaya dönme, komut çubuğu. Telefon ekranı önce tasarlanır.

### 🟢 Faz 5 — Harita (MapLibre) ve zaman çizelgesi

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE5.md`](PHASE5.md)

Natural Earth verisinden parşömen tonlu bir harita çizilir; figürlerin yolculukları, rota ve mini harita gösterilir.
Zaman çizelgesi oynatıldıkça figürler o yılda bulundukları yere gider.

### 🟢 Faz 6 — Öğrenme oyunu

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE6.md`](PHASE6.md)

Aynı veriden iki küçük oyun: figürleri kronolojik sıraya dizme ve eylemi nedeniyle eşleştirme. Puan yalnız o oturumda
gösterilir, saklanmaz (D6).

### 🟢 Faz 7 — Kalıcı bağlantılar, PWA ve Microsoft Store hazırlığı

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE7.md`](PHASE7.md)

Her figür, rota ve kartın kendi bağlantısı olur. Uygulama kurulabilir ve çevrimdışı çalışır hale gelir (PWA); Store
paketi için gerekenler ve yayın adımları yazılır.

### 🟢 Faz 8 — PixiJS ile boyalı oyun haritası

**Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Ayrıntı:** [`PHASE8.md`](PHASE8.md)

Aynı `MapView` arayüzü PixiJS ile ikinci kez uygulandı: gerçek kabartmalı boyalı arazi, kıyı sığlıkları, bulut
gölgeleri. Uygulama bu haritayla açılır; desteklemeyen cihazda sade haritaya düşer (S2).
