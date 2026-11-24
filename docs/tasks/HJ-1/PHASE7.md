# Faz 7 — Kalıcı bağlantılar, PWA ve Microsoft Store hazırlığı

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Uygulama paylaşılabilir ve kurulabilir hale gelir. Bitince her durumun kendi bağlantısı vardır, uygulama çevrimdışı açılır ve Store paketi için gerekenler hazırdır.

## Problem

- Her figür, rota ve kartın kalıcı bağlantısı olmalı (NFR-3).
- Kullanıcının sözü: "Bunu hem tarayıcıda hem Microsoft Store'da oyun gibi yayınlayabiliriz" (T4).

## Çözüm

- **Bağlantı:** Uygulama durumu (figürler, rota, açık kart, yıl) adres çubuğuyla iki yönlü eşlenir.
- **PWA:** Manifest, simgeler ve çevrimdışı önbellek; tam ekran oyun gibi açılır.
- **Store:** PWABuilder ile MSIX paketi adımları `docs/general/STORE_PUBLISHING.md` içinde; yayın kullanıcının hesabıyla yapılır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 7.1 | Uygulama durumu adresle eşlenir. | 🟢 Tamamlandı |
| 7.2 | PWA manifesti, simgeler ve çevrimdışı önbellek eklenir. | 🟢 Tamamlandı |
| 7.3 | Store yayın adımları ve proje dokümanları yazılır. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Bir kart açıkken adres kopyalanıp yeni sekmede açılır; aynı kart açılır.
- [x] `npm run build && npm run preview` sonrası tarayıcı "Uygulamayı yükle" seçeneğini sunar.

## Kalan

- Store paketi üretilmedi: Partner Center kimlik değerleri ve yayındaki web adresi gerekiyor (S4, `docs/general/STORE_PUBLISHING.md`).

## Ayrıntılar

### 7.1 — Uygulama durumu adresle eşlenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Her figür, rota ve kartın kalıcı bağlantısı olmalı (NFR-3).
- **Çözüm:** Uygulama durumu adresle eşlenir.
- **Dosyalar:** `src/app/urlState.ts`
- **Testler:** `tests/unit/app.test.ts`, `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 7.2 — PWA manifesti, simgeler ve çevrimdışı önbellek eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Her figür, rota ve kartın kalıcı bağlantısı olmalı (NFR-3).
- **Çözüm:** PWA manifesti, simgeler ve çevrimdışı önbellek eklenir.
- **Dosyalar:** `vite.config.ts`, `public/icons/*`
- **Testler:** `tests/e2e/map-and-games.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 7.3 — Store yayın adımları ve proje dokümanları yazılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Her figür, rota ve kartın kalıcı bağlantısı olmalı (NFR-3).
- **Çözüm:** Store yayın adımları ve proje dokümanları yazılır.
- **Dosyalar:** `docs/general/STORE_PUBLISHING.md`, `docs/general/ARCHITECTURE.md`, `README.md`
- **Testler:** —
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Store paketi üretilmedi: Partner Center kimlik değerleri ve yayındaki web adresi gerekiyor (S4, `docs/general/STORE_PUBLISHING.md`).

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 7
- `docs/requirements/history-journeys.md`
