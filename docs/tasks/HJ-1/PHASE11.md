# Faz 11 — Üçüncü geri bildirim: olay notu ve olaylar arasında adım düğmeleri

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-1

Faz 10'dan sonra gelen iki istek uygulanır. Bitince haritadaki durak işaretleri olay notunun üstüne çıkmaz ve oynat
düğmesinin iki yanındaki düğmelerle olaylar arasında elle gezilir.

## Problem

- Haritadaki durak işaretleri (numara ve etiket) olay notunun üstünde çiziliyor; not okunmuyor (T38).
- Olaylar arasında yalnız oynatarak ya da haritadaki numaraya tıklayarak gezilebiliyor; bir sonraki ya da bir önceki olaya geçen düğme yok (T38).

## Çözüm

- **Olay notu üstte:** Harita katmanı kendi yığınlama bağlamını oluşturur; işaretler yalnız kendi aralarında sıralanır, haritanın üstüne konan notlar (olay notu, durak grupları) hep üstte kalır.
- **Adım düğmeleri:** Oynat düğmesinin solunda "önceki olay", sağında "sonraki olay" düğmesi durur. Tıklanınca oynatma durur ve zaman o olaya gider.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 11.1 | Olay notu haritadaki işaretlerin üstünde kalır. | 🟢 Tamamlandı |
| 11.2 | Oynat düğmesinin yanındaki düğmelerle önceki ve sonraki olaya geçilir. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor (T7); gereksinimler `docs/requirements/history-journeys.md` içindedir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| FR-14 | Olaylar oynatılarak ya da adım adım, önceki ve sonraki olaya geçilerek izlenir. | 11.2 |
| FR-32 | Haritanın üstüne konan notlar harita işaretleriyle örtülmez. | 11.1 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Anlatılan olaydan sonraki ve önceki olay bulunur; aynı yılın iki olayı sırayla anlatılır. | `tests/unit/chronicleSteps.test.ts` | 🟢 Tamamlandı |
| Hiçbir olay anlatılmıyorken adım seçili yıldan başlar; uçlarda gidilecek olay yoktur. | `tests/unit/chronicleSteps.test.ts` | 🟢 Tamamlandı |
| Sonraki ve önceki düğmeleri olay notunu değiştirir; ilk olayda önceki düğmesi kapalıdır. | `tests/e2e/event-steps.spec.ts` | 🟢 Tamamlandı |
| Olay notunun hiçbir noktası bir harita işaretiyle örtülmez. | `tests/e2e/event-steps.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] Atatürk kartı açıkken "sonraki olay" düğmesine basılır; olay notu açılır, tekrar basılınca sıradaki olaya geçer.
- [x] "Önceki olay" düğmesine basılır; bir önceki olaya dönülür. İlk olayda düğme kapalıdır.
- [x] Olay notunun altında kalan durak işaretleri notun üstüne çıkmaz.

## Kalan

- **Review bulguları:** `REVIEW/2026-11-24-1115.md` içindeki 7 bulgudan 5'i kapatıldı (tek majör dahil: eksik bir regresyon testi). Açık kalan 2 düşük öncelikli bulgu: grup hesabındaki küçük tekrar ve uçtan uca testte elle yazılmış bir yıl ile rota sırası.
- **Sonar:** IDE kapalı olduğu için review Sonar'sız yapıldı.
- **Telefon:** Dar ekranda düğmelere yer açmak için yıl çubuğu komut çubuğunda kendi satırına alındı; gerçek telefonda denenmedi.

## Ayrıntılar

### 11.1 — Olay notu haritadaki işaretlerin üstünde kalır.

- **Mevcut durum:** İşaretlerin `z-index` değerleri (1–3, üstüne gelinince 10) olay notununkiyle (1) aynı yığınlama bağlamında yarışıyor.
- **Problem:** Notun altına düşen durak numarası ve etiketi notun üstünde çiziliyor (T38).
- **Çözüm:** `.stage__map` için `isolation: isolate`; işaretler harita katmanının içinde kalır.
- **Dosyalar:** `src/ui/theme/layout.css`
- **Testler:** `tests/e2e/event-steps.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 11.2 — Oynat düğmesinin yanındaki düğmelerle önceki ve sonraki olaya geçilir.

- **Mevcut durum:** Zaman çubuğunda oynat ve hız düğmeleri var.
- **Problem:** Olaylar arasında tek tek ileri geri gidilemiyor (T38).
- **Çözüm:** `neighbourEvent` anlatılan olayın listedeki komşusunu verir; hiçbir olay anlatılmıyorsa sonraki, seçili
  yıldan itibaren ilk olaydır, önceki, o yıldan önceki son olaydır. Düğmeler oynatmayı durdurur ve olayı anlatır;
  gidilecek olay yoksa kapalıdır. Olay listesi (`useChronicle`) oynatmayla ortaktır: kart açıkken o figürün durakları,
  genel görünümde bütün rota.
- **Dosyalar:** `src/domain/chronicle.ts`, `src/ui/usePlayback.ts`, `src/ui/CommandBar.tsx`, `src/ui/Icon.tsx`, `src/ui/theme/layout.css`
- **Testler:** `tests/unit/chronicleSteps.test.ts`, `tests/e2e/event-steps.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `MAIN_TODO.md` → 🎯 Faz Özetleri → Faz 11
- `docs/requirements/history-journeys.md` → FR-14, FR-32
