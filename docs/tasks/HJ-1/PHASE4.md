# Faz 4 — Oyun arayüzü: ekran, parşömen kartlar ve rota zinciri

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Uygulamanın yüzü kurulur: tek bir oyun ekranı, parşömen kartlar, rota zinciri ve komut çubuğu. Bitince iki figür seçilip rota kart kart okunabilir; ekran bir strateji oyunu gibi görünür.

## Problem

- Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- Kartlar kısa kalmalı ama istenince derinleşmeli (D5, FR-27).

## Çözüm

- **Ekran:** Harita sahnesi üstünde paneller; sayfa değişmez (FR-29). Telefon önce (NFR-1).
- **Kartlar:** Parşömen doku, süslü çerçeve, mühür, amblem (FR-31); metin gerçek metin.
- **Zincir:** Önceki ve sonraki kartlar hep görünür (FR-10); dallanıp aynı yere dönülür (FR-11).
- **Derinlik:** Neden ve Sonuç düğmeleri, derinlik simgesi, kavram ve köken penceresi (FR-2, FR-5, FR-27).

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 4.1 | Oyun ekranının iskeleti ve görsel dili kurulur. | 🟢 Tamamlandı |
| 4.2 | Figür seçimi ve rota seçenekleri yapılır. | 🟢 Tamamlandı |
| 4.3 | Parşömen kart ve rota zinciri yapılır. | 🟢 Tamamlandı |
| 4.4 | Neden, Sonuç ve derinlik simgesi eklenir. | 🟢 Tamamlandı |
| 4.5 | Bağlantılar, kavram penceresi ve rotaya dönüş eklenir. | 🟢 Tamamlandı |
| 4.6 | Kaynaklar ve hakkında penceresi eklenir. | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk ve Fatih seçilir; rota kart zinciri olarak açılır.
- [x] I. Ahmed kartında Neden'e basılır; açıklama açılır. Derinlik simgesine basılır; ek not görünür.
- [x] *ekber ve erşed* bağlantısına basılır; kök ve ilgili sözcükler görünür.
- [x] Telefon genişliğinde (390 piksel) yatay kaydırma olmaz.

## Kalan

- Figür portreleri yok; açık lisanslı görsellerin tek tek lisans kaydı gerekir (FR-33). Yerine türe göre amblemler kullanıldı.

## Ayrıntılar

### 4.1 — Oyun ekranının iskeleti ve görsel dili kurulur.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- **Çözüm:** Oyun ekranının iskeleti ve görsel dili kurulur.
- **Dosyalar:** `src/ui/theme/*.css`, `src/ui/GameScreen.tsx`
- **Testler:** `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.2 — Figür seçimi ve rota seçenekleri yapılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- **Çözüm:** Figür seçimi ve rota seçenekleri yapılır.
- **Dosyalar:** `src/ui/dialogs/FigurePickerDialog.tsx`, `src/ui/RouteTabs.tsx`, `src/ui/TopBar.tsx`
- **Testler:** `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.3 — Parşömen kart ve rota zinciri yapılır.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- **Çözüm:** Parşömen kart ve rota zinciri yapılır.
- **Dosyalar:** `src/ui/FigureCard.tsx`, `src/ui/RoutePanel.tsx`
- **Testler:** `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.4 — Neden, Sonuç ve derinlik simgesi eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- **Çözüm:** Neden, Sonuç ve derinlik simgesi eklenir.
- **Dosyalar:** `src/ui/ActionItem.tsx`
- **Testler:** `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.5 — Bağlantılar, kavram penceresi ve rotaya dönüş eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- **Çözüm:** Bağlantılar, kavram penceresi ve rotaya dönüş eklenir.
- **Dosyalar:** `src/ui/RichText.tsx`, `src/ui/dialogs/ConceptDialog.tsx`, `src/domain/markup.ts`
- **Testler:** `tests/unit/domain.test.ts`, `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.6 — Kaynaklar ve hakkında penceresi eklenir.

- **Mevcut durum:** Repoda kod yoktu; bu task'ta ilk kez yazıldı.
- **Problem:** Kullanıcının sözü: "bir oyun UI'ı istiyorum, gerçekten oyun hissiyatı versin istiyorum" (T1) ve "UI'ın gerçekten oyun standartlarında olması" (T6).
- **Çözüm:** Kaynaklar ve hakkında penceresi eklenir.
- **Dosyalar:** `src/ui/FigureCard.tsx`, `src/ui/dialogs/InfoDialogs.tsx`
- **Testler:** `tests/e2e/journey.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Doğrulanmayan / dikkat edilmesi gereken

- Figür portreleri yok; açık lisanslı görsellerin tek tek lisans kaydı gerekir (FR-33). Yerine türe göre amblemler kullanıldı.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 4
- `docs/requirements/history-journeys.md`
