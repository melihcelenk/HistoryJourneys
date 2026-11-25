# Faz 4 — Oyun hissi: dolaşma, ışık, etkileşim ve uygulamaya bağlama

> **Durum:** 🟢 Tamamlandı · **Tamamlanma:** 100% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Sahne bakılan bir resimden oynanan bir odaya dönüşür. Bitince oyuncu odada yürür, eşyalara ve figüre çarpar, figüre yaklaşınca onunla tanışır ve haritaya geri dönebilir.

## Problem

- Sahne yalnız sabit kameralardan tek kare çiziyor; oyuncu yok.
- Çizilen görüntü ham: parlak ışık taşmıyor, yansımalar odayı göstermiyor.
- Sahne ile harita uygulaması arasında geçiş yok; kullanılan modellerin lisansı sahnede yazmıyor.

## Çözüm

- **Yürüme:** Birinci kişi gözünden; klavye ya da dokunmatik çubukla yürünür, sürükleyerek bakılır. Adım, duvarlara ve eşyalara göre kısaltılır; oyuncu takılmaz, kenar boyunca kayar.
- **Görüntü:** Parlak ışık hafifçe taşar (bloom), köşeler kararır, renkler sıcak tonlanır; parlak yüzeyler odanın kendisini yansıtır.
- **Tanışma:** Oyuncu figüre yaklaşınca Huzura çık düğmesi belirir; basınca figürün kısa tanıtımı uygulamanın içerik kaydından okunarak gösterilir.
- **Bağlantılar:** Sahneden haritaya dönüş bağlantısı; Fatih'in kartından sahneye giriş. Kullanılan modellerin yapımcısı ve lisansı sahnede Kaynaklar başlığı altında yazar.
- **Açılamazsa:** WebGL yoksa sahne yerine bunu söyleyen bir not gösterilir.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 4.1 | Oyuncu odada yürür ve duvarlardan, eşyalardan, figürden geçemez. | 🟢 Tamamlandı |
| 4.2 | Görüntü işlenir: yansıma, parlama, köşe karartma ve renk tonu. | 🟢 Tamamlandı |
| 4.3 | Figüre yaklaşınca tanışma düğmesi ve tanıtım kartı görünür. | 🟢 Tamamlandı |
| 4.4 | Kullanılan modellerin lisansı sahnede yazar; açılamayan sahne bunu söyler. | 🟢 Tamamlandı |
| 4.5 | Fatih'in kartından sahneye geçilir. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir (K1–K6).

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K1 | WebGL açılamazsa açıklayıcı not gösterilir. | 4.4 |
| K4 | Oyuncu odada dolaşır; duvarlardan ve eşyalardan geçemez. | 4.1 |
| K6 | Lisanslar sahnede gösterilir. | 4.4 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Serbest adım atılır; duvara bir beden genişliğinden fazla yaklaşılmaz; engele girilmez, kenarı boyunca kayılır. | `tests/unit/scene3d.test.ts` | 🟢 Tamamlandı |
| Oyuncu klavyeyle figüre yürür, düğme görünür, figürün içinden geçemez, kartı okur; uzaklaşınca kart kapanır. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Kaynaklar listesi baş taramasının yapımcısını ve lisansını gösterir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Ekran üstü yazılar masaüstünde ve telefonda ekranın içinde kalır. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Cihaz üç boyutlu çizemiyorsa bunu söyleyen not görünür. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Fatih'in kartındaki düğme sahneyi açar. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [x] `sahne.html` açılır; W A S D ile yürünür, sürükleyerek bakılır.
- [x] Figüre yaklaşınca Huzura çık düğmesi görünür; E tuşu kartı açar.
- [x] Haritada Fatih Sultan Mehmed'in kartından sahneye geçilir ve sahneden haritaya dönülür.

## Kalan

- **Ses yok:** Ateş ve ayak sesi eklenmedi.
- **Dokunmatik denetim gerçek telefonda denenmedi;** testler klavyeyle yürür.

## Ayrıntılar

### 4.1 — Oyuncu odada yürür ve duvarlardan, eşyalardan, figürden geçemez.

- **Mevcut durum:** Oyuncu yoktur.
- **Problem:** Dolaşılamayan bir sahne oyun değildir; içinden geçilen eşya da gerçek görünmez.
- **Çözüm:** Yürüyüş saf işlevlerdir (`walk.ts`): oyuncu bir daire, engeller zemin planında kutulardır; adım önce bir eksende, sonra diğerinde denenir. `controls.ts` klavyeyi, fareyi ve dokunmayı adıma çevirir. Uzun bir kare oyuncuyu duvarın öbür yanına taşıyamaz.
- **Dosyalar:** `src/scene3d/walk.ts`, `src/scene3d/controls.ts`, `src/scene3d/SceneApp.ts`
- **Testler:** `tests/unit/scene3d.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.2 — Görüntü işlenir: yansıma, parlama, köşe karartma ve renk tonu.

- **Mevcut durum:** Sahne doğrudan ekrana çizilir.
- **Problem:** İşlenmemiş görüntü düz ve teknik gösteri gibi durur.
- **Çözüm:** Oda kurulduktan sonra göz hizasından bir ortam haritası çıkarılır ve yansımalar için kullanılır. Kare önce yüksek aralıklı bir ara görüntüye çizilir, sonra parlama, tonlama ve çıkış adımlarından geçer. `?q=low` bu adımları atlar.
- **Dosyalar:** `src/scene3d/post.ts`, `src/scene3d/SceneApp.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.3 — Figüre yaklaşınca tanışma düğmesi ve tanıtım kartı görünür.

- **Mevcut durum:** Sahnede yazı yoktur.
- **Problem:** Oyuncu kimin karşısında durduğunu sahneden öğrenemez.
- **Çözüm:** `hud.ts` başlığı, yeri, denetim ipucunu, düğmeyi ve kartı çizer. Kartın metni `content/figures/mehmed-ii.json` kaydından gelir; ayrı bir kopya tutulmaz. Uzaklaşınca kart kapanır.
- **Dosyalar:** `src/scene3d/hud.ts`, `src/scene3d/scene.css`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.4 — Kullanılan modellerin lisansı sahnede yazar; açılamayan sahne bunu söyler.

- **Mevcut durum:** Lisanslar yalnız dosyalarda durur.
- **Problem:** CC BY 3.0 atıf ister; atıf kullanıcının göreceği yerde olmalıdır.
- **Çözüm:** Kaynaklar başlığı altında her modelin yapımcısı, lisansı ve bağlantısı listelenir. Sahne kurulamazsa sayfada açıklayıcı bir not gösterilir.
- **Dosyalar:** `src/scene3d/hud.ts`, `src/scene3d/SceneApp.ts`, `public/models/*/LICENSE.txt`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### 4.5 — Fatih'in kartından sahneye geçilir.

- **Mevcut durum:** Sahneye yalnız adres yazılarak girilir.
- **Problem:** Kullanıcı sahnenin var olduğunu uygulamadan öğrenemez.
- **Çözüm:** Sahnesi olan figürlerin kaydı tek bir yerde tutulur; o figürün kartında sahneye giden bir düğme görünür.
- **Dosyalar:** `src/ui/FigureCard.tsx`, `src/ui/scenes.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı.

### Referanslar

- `MAIN_TODO.md` → Kabul ölçütleri → K1, K4, K6
