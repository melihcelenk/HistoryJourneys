# Faz 1 — Altyapı ve kendi kendine ilerleyen test sistemi

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Projenin iskeleti ve doğrulama araçları kurulur. Bitince tek bir komut tip denetimini, lint'i, birim testlerini ve tarayıcıda uçtan uca testleri çalıştırır; her uçtan uca test ekran görüntüsü bırakır.

## Problem

- Repoda kod yok; gereksinimlerin doğrulanacağı bir test düzeni de yok.
- Kullanıcı gece boyunca yok: testler ve görsel kontrol tamamen otomatik ilerlemeli (T4).

## Çözüm

- **Proje:** Vite, React ve TypeScript (strict) ile tek uygulama; alan mantığı `src/domain`, arayüz `src/ui`.
- **Testler:** Vitest (birim), Playwright (masaüstü ve telefon görünümü, ekran görüntüleri `tmp/screens/`).
- **Kalite:** ESLint ve `tsc --noEmit`; `npm run test:all` hepsini sırayla çalıştırır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 1.1 | Vite, React ve TypeScript iskeleti kurulur. | 🟢 Tamamlandı |
| 1.2 | Birim ve uçtan uca test düzeni kurulur. | 🟢 Tamamlandı |
| 1.3 | Lint ve tip denetimi tek komuta bağlanır. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] `npm run test:all` çalıştırılır; hepsi yeşil biter.
- [x] `tmp/screens/` altında masaüstü ve telefon ekran görüntüleri oluşur.

## Kalan

- Sonar bulguları alınamadı (IDE kapalıydı); yerine tip denetimi, ESLint ve iki tur `/h-review` kullanıldı.

## Ayrıntılar

### 1.1 — Vite, React ve TypeScript iskeleti kurulur.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Repoda kod yok; gereksinimlerin doğrulanacağı bir test düzeni de yok.
- **Çözüm:** Vite, React ve TypeScript iskeleti kurulur.
- **Dosyalar:** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`
- **Testler:** —
- **Durum:** 🟢 Tamamlandı.

### 1.2 — Birim ve uçtan uca test düzeni kurulur.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Repoda kod yok; gereksinimlerin doğrulanacağı bir test düzeni de yok.
- **Çözüm:** Birim ve uçtan uca test düzeni kurulur.
- **Dosyalar:** `vite.config.ts`, `playwright.config.ts`, `tests/`
- **Testler:** `tests/unit`, `tests/e2e`
- **Durum:** 🟢 Tamamlandı.

### 1.3 — Lint ve tip denetimi tek komuta bağlanır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Repoda kod yok; gereksinimlerin doğrulanacağı bir test düzeni de yok.
- **Çözüm:** Lint ve tip denetimi tek komuta bağlanır.
- **Dosyalar:** `eslint.config.js`, `package.json`
- **Testler:** `npm run test:all`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Sonar bulguları alınamadı (IDE kapalıydı); yerine tip denetimi, ESLint ve iki tur `/h-review` kullanıldı.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 1
- `docs/requirements/history-journeys.md`
