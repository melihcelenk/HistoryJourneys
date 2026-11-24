---
id: S4
status: open
decider:
priority: major
asked: 2026-11-24
related: [T4, NFR-3]
---
# S4 — Microsoft Store'a hangi paketle çıkalım?

**Mevcut durum:** Uygulama kurulabilir bir PWA: manifest, simgeler ve çevrimdışı çalışma hazır ve testli. Store paketinin kendisi üretilmedi, çünkü Partner Center hesabının kimlik bilgileri gerekiyor.

**Soru:** Store'a PWA paketiyle (PWABuilder) çıkmak uygun mu?

## Bağlam

"Bunu hem tarayıcıda hem Microsoft Store'da oyun gibi yayınlayabiliriz" demiştin (T4). Store iki yolu kabul eder:

| | PWA paketi (MSIX kabuğu) | Yerel kabuk (Tauri ya da Electron) |
|---|---|---|
| Uygulamada gereken değişiklik | Yok | Yeni bir derleme hattı |
| Güncelleme | Web sürümü güncellenince Store'daki de güncellenir | Her sürüm için yeni paket ve yeni onay |
| Önce web'de yayın gerekir mi | Evet (paket, yayındaki adresi açar) | Hayır |
| Steam gibi başka mağazalar | Kabul etmez | Kabul eder |

Adım adım yayın rehberi: `docs/general/STORE_PUBLISHING.md`.

Ne olur: Seçim, yayın için kalan işi belirler. Senden gerekenler her iki yolda da aynı: Partner Center geliştirici
hesabı ve uygulama adının ayrılması.

## Seçenekler

### A — PWA paketi (PWABuilder) ⭐ önerilen

- ✅ Kod değişmez; web ve Store tek sürümden beslenir
- ✅ En kısa yol: web'de yayınla, PWABuilder'a adresi ver, paketi yükle
- ❌ Steam gibi yerel paket isteyen mağazalara çıkılamaz

### B — Tauri ile yerel kabuk

- ✅ Her mağazaya çıkılabilir; küçük kurulum dosyası
- ❌ Ek derleme hattı, imzalama ve her sürümde paket onayı

### C — İkisi birden (önce A, sonra B)

- ✅ Hızlı çıkış, ileride genişleme
- ❌ B'nin işi yalnızca ertelenir

## Öneri

**A**: İlk yayın için en az iş ve en az risk. Steam hedefi netleşirse B eklenir; uygulama statik dosyalardan oluştuğu
için o gün de kod değişmez.

## Cevap

## Sonuç

**Geçici karar (T4 gereği soru açık):** A için gereken her şey hazırlandı (manifest, simgeler, çevrimdışı önbellek,
göreli dosya yolları, yayın rehberi). Paketi üretmek için senden gereken: web sürümünün yayınlanacağı adres ve Partner
Center'daki üç kimlik değeri (rehberde adım 2).
