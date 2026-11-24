---
id: S1
status: resolved
decider:
priority: blocker
asked: 2026-11-24
related: [D1, D6, NFR-1, NFR-2, NFR-3, NFR-4, FR-13, FR-29, FR-30, FR-31, FR-32]
resolved: 2026-11-24
---
# S1 — Prototip hangi teknoloji yığınıyla yazılsın?

**Mevcut durum:** Arayüzün bir strateji oyunu gibi görünmesi kararlaştırıldı (FR-29–33), ancak site, harita ve veri için teknoloji seçimi henüz yapılmadı.

**Soru:** İlk sürüm Vite + React ile, haritası MapLibre (açık kaynak web haritası) ile kurulup PixiJS'e sonra mı geçilsin?

## Bağlam

Hedeflenen his: *Medieval: Total War* (2002) kampanya haritası ve olay kartları (T1). Bu görünüm iki ayrı işten oluşur:

| Parça | Ne gerektirir | Web'de nasıl |
|---|---|---|
| **Harita** | Boyalı arazi ve kabartma, deniz, kaydırma ve yakınlaştırma, şehir ve figür işaretleri, akıcı animasyon | Bir oyun çizim motoru (WebGL). Normal web haritası (MapLibre/OSM) bu hissi vermez, "Google Maps'e kaplama" gibi durur. |
| **Kartlar, paneller, mini harita, komut çubuğu** | Parşömen doku, süslü çerçeve, özel yazı tipi, geçiş animasyonları | Normal HTML/CSS ile tamamen yapılabilir (border-image, dokular, yazı tipleri, Framer Motion). Metin gerçek metin kalır, Türkçe karakterler net görünür, erişilebilirlik korunur. |

Asıl iş teknoloji değil **görsel varlıklar**: parşömen dokusu, çerçeveler, ikonlar, kale ve şehir işaretleri, boyalı arazi. Arazi için [Natural Earth](https://www.naturalearthdata.com) kabartmalı raster verisi (kamu malı) iyi bir temel; üzerine renk ve doku işlenip oyun haritası görünümüne getirilir. Sınırlar OpenHistoricalMap'ten çizilir.

Next.js'in getirdiği sunucu tarafı sayfa üretimi, oyun ekranında işe yaramaz: harita ve kartlar tek bir ekranda, tarayıcıda çalışır. Paylaşılan bağlantıların önizlemesi (NFR-3) ise build sırasında figür başına küçük statik HTML sayfaları üretilerek ayrıca çözülebilir.

Ne olur: Bu seçim, haritanın neye benzeyeceğini ve projenin bütün yapısını belirler.

## Seçenekler

### A — Next.js + MapLibre (önceki öneri)

- ✅ Sayfa başına HTML, iyi paylaşım önizlemesi
- ❌ MapLibre bir web haritasıdır; boyalı oyun haritası hissini vermez
- ❌ Next.js'in sayfa modeli tek ekranlı oyun arayüzüne gereksiz katman ekler

### B — Vite + React + TypeScript, harita PixiJS ile

Oyun ekranı tek bir React uygulaması. Harita, PixiJS (2D WebGL oyun motoru) ile tuval üzerinde çizilir: boyalı arazi dokusu, sınır çizgileri, animasyonlu işaretler, kamera. Coğrafi konumlar d3-geo ile harita koordinatlarına çevrilir. Kartlar ve HUD (mini harita, komut çubuğu, tarih) HTML/CSS olarak haritanın üstünde durur.

- ✅ Harita tam bir oyun haritası gibi çizilir, oyun döngüsü ve animasyon doğal
- ✅ Kartlar gerçek metin: net, çevrilebilir, erişilebilir (NFR-4)
- ✅ Hafif ve mobilde hızlı (NFR-1, NFR-2), statik barındırma, sunucu yok (D6)
- ✅ Her figür, rota ve kartın kendi URL'si istemci tarafı yönlendirmeyle (NFR-3)
- ❌ Harita katmanını (projeksiyon, sınır çizimi, kamera) kendimiz yazarız
- ❌ Paylaşım önizlemesi için build'e küçük bir statik sayfa üretme adımı gerekir

### C — Oyun motoru (Godot veya Unity, web çıktısı)

- ✅ En "oyun" hissi, hazır editör
- ❌ İlk yükleme onlarca MB; mobil web'de yavaş (NFR-1, NFR-2)
- ❌ Yoğun metin, Türkçe karakter, erişilebilirlik ve bağlantı paylaşımı zayıf
- ❌ Bu proje bir oyundan çok, oyun gibi görünen bir bilgi uygulaması; motorun getirisi maliyetini karşılamıyor

### D — Vite + React + TypeScript; ilk sürümde harita MapLibre, sonra PixiJS ⭐ önerilen

B ile aynı uygulama; tek fark haritanın ilk sürümde MapLibre ile çizilmesi (T3). Harita, uygulamanın geri kalanından bir arayüzle (`MapView`: odakla, işaret koy, rota çiz, tarih seç) ayrılır; PixiJS'e geçişte yalnız bu katman değişir.

- ✅ OpenHistoricalMap'in tarihe göre filtrelenen sınır katmanları MapLibre'de hazır gelir; tarihî sınırlar neredeyse bedava
- ✅ Kendi harita stilimizle (sıcak renkler, kabartma gölgesi, parşömen tonları) oyun hissinin bir kısmı ucuza yakalanır
- ✅ Toplam iş B'ye göre yaklaşık üçte bir daha az (Ayrıntı: 100'e karşı ~140)
- ❌ İlk sürümün haritası Total War hissini tam vermez
- ❌ PixiJS'e geçince harita katmanı ikinci kez yazılır (toplamın ~%10'u)

## Öneri

**D**: İlk sürüm hızlı çıkar, kartlar ve oyun arayüzü baştan oyun gibi olur; boyalı harita sonraki adımda. B'nin gerekçesi geçişten sonra da geçerli: oyun hissini veren iki şey, yani boyalı harita ve süslü kartlar, bu ikili yapıyla tam karşılanıyor. Hız, metin kalitesi ve bağlantı paylaşımından da vazgeçilmiyor. Yığının geri kalanı:

- **Dil:** TypeScript
- **Harita:** İlk sürüm MapLibre GL ve OpenHistoricalMap; sonra PixiJS v8, pixi-viewport (kamera), d3-geo (projeksiyon), Natural Earth tabanlı boyalı arazi.
- **Arayüz:** React, CSS (dokular, border-image), Framer Motion (geçişler)
- **Ses (isteğe bağlı):** Howler.js ile kart açılışı ve tıklama sesleri
- **Veri:** Repoda sürümlenen JSON/YAML dosyaları
- **Test:** Vitest (birim), Playwright (uçtan uca ve ekran görüntüsü karşılaştırma, mobil görünüm dahil)

## Cevap

## Sonuç

**Geçici karar (kullanıcı uyurken, T4 gereği soru açık bırakıldı):** D uygulandı ve süre kaldığı için PixiJS adımı da
tamamlandı.

- **Uygulanan yığın:** Vite, React, TypeScript, Zustand; testler Vitest ve Playwright.
- **Harita:** `MapView` arayüzünün arkasında iki uygulama var: boyalı harita (PixiJS) ve sade harita (MapLibre).
  İkisi de Natural Earth verisini yerelden çizer; karo sunucusu yoktur.
- **Değişen ayrıntı:** PixiJS'te projeksiyon için d3-geo yerine kendi Mercator hesabımız, kamera için pixi-viewport
  yerine kendi `Camera` sınıfımız kullanıldı (iki bağımlılık eksildi).
- **Farklı seçersen:** A ya da C seçilirse proje iskeleti değişir (büyük iş). B seçilirse sade harita kaldırılır
  (küçük iş). Hangi haritanın varsayılan olacağı ayrı sorudur: S2.

