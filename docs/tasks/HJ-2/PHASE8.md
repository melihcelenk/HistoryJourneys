# Faz 8 — Harita ile sahne arasında geçiş ve arayüz sesleri

> **Durum:** 🟡 Kısmi · **Tamamlanma:** 90% · **Efor:** tahmin yazılmadı · **Task:** HJ-2

Harita ile üç boyutlu sahne birbirine bağlanır ve iki tarafta da arayüz ses verir. Bitince haritada Fatih'in
işaretinden odasına girilir, odanın kapısından haritaya dönülür, düğmeler ve parşömenler ses çıkarır ve harita
tarafında da ses kapatılabilir.

## Problem

- Haritada bir figüre tıklanınca işaretin üstünde yalnız adı görünür; unvanı ve yılları görünmez (T122).
- Haritadan sahneye geçiş kartın köşesindeki küçük bir simgededir; işaretin üstünde açık bir "Ziyaret et" düğmesi yoktur (T122).
- Sahnede haritaya dönüş yalnız üst köşedeki bağlantıdır; kapıya gidince çıkış önerilmez (T122).
- Tıklamalar ve parşömenler sessizdir; ses yalnız sahnede, anlatım ve ocak için vardır (T122).
- Harita tarafında sesi kapatacak bir düğme yoktur (T122).

## Çözüm

- **İşaretin levhası:** Seçili figürün haritadaki işaretinin üstünde adıyla birlikte unvanı ve yaşam–görev yılları görünür. Sahnesi olan figürde levhada "Ziyaret et" düğmesi vardır; sahneyi açar.
- **Kapıdan çıkış:** Oyuncu kapıya yaklaşınca "Haritaya dön" düğmesi (ve E tuşu) belirir; figürün haritadaki kartına götürür.
- **Arayüz sesleri:** Tıklama ve parşömen sesi kodla üretilir (ses dosyası yoktur) ve iki sayfada aynı modülden gelir. Her düğme ve bağlantı tıklamasında tıklama; bir kart, pencere ya da anlatım adımı açıldığında parşömen sesi duyulur.
- **Ortak ses ayarı:** Ses ayarı iki sayfada aynıdır ve aynı yerde saklanır; "Arayüz" için dördüncü bir düzey eklenir. Harita tarafında üst çubukta sesi kapatıp açan bir düğme vardır.

## Alt fazlar

| # | Ne yapılıyor | Durum |
|---|--------------|-------|
| 8.1 | Seçili figürün haritadaki işaretinde unvanı ve yılları görünür. | 🟢 Tamamlandı |
| 8.2 | Sahnesi olan figürün işaretinde "Ziyaret et" düğmesi sahneyi açar. | 🟢 Tamamlandı |
| 8.3 | Sahnede kapıya gelince "Haritaya dön" düğmesi belirir. | 🟢 Tamamlandı |
| 8.4 | Tıklama ve parşömen sesleri kodla üretilir ve iki sayfada çalınır. | 🟢 Tamamlandı |
| 8.5 | Harita tarafında ses kapatılıp açılır; ayar iki sayfada ortaktır. | 🟢 Tamamlandı |

## Gereksinimler

Bu projede Lima kullanılmıyor; gereksinimler `MAIN_TODO.md` içindeki kabul ölçütleridir.

| Gereksinim | Kısa cümle | Alt faz |
|------------|------------|---------|
| K11 (T122) | Haritadan sahneye figürün işaretinden girilir; sahneden haritaya kapıdan dönülür. | 8.1, 8.2, 8.3 |
| K12 (T122) | Arayüz iki tarafta da ses verir ve ses iki tarafta da kapatılabilir. | 8.4, 8.5 |

## Test senaryoları

| Senaryo | Dosya | Durum |
|---------|-------|-------|
| Seçili figürün işaretinde unvan ve yıllar yazar; seçili olmayanda yazmaz. | `tests/unit/app.test.ts`, `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| "Ziyaret et" yalnız sahnesi olan figürde görünür ve sahne sayfasına götürür. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Sahnede kapıdan uzakta çıkış düğmesi görünmez; kapıya yürüyünce görünür ve figürün kartına götürür. | `tests/unit/scene3d.test.ts`, `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Arayüz için ayrı bir ses düzeyi vardır ve saklanır. | `tests/unit/sceneSound.test.ts` | 🟢 Tamamlandı |
| Üretilen tıklama ve parşömen sesleri sessiz değildir, kırpılmaz ve kısadır. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |
| Harita tarafındaki ses düğmesi sesi kapatır; ayar sahne sayfasında da geçerlidir. | `tests/e2e/scene.spec.ts` | 🟢 Tamamlandı |

## Nasıl kontrol edilir

- [ ] Haritada Fatih Sultan Mehmed'in işaretine tıklanır; adının altında unvanı ve yılları, altında "Ziyaret et" görünür.
- [ ] "Ziyaret et" sahneyi açar. Kapıya geri yürünür; "Haritaya dön" belirir ve haritadaki karta götürür.
- [ ] Düğmelere basınca tıklama, kart ya da anlatım açılınca parşömen sesi duyulur; iki sayfada da.
- [ ] Haritada ses düğmesiyle ses kapatılır; sahne açılınca ses orada da kapalıdır.

## Kalan

- Tıklama ve parşömen sesinin kulağa uygunluğu dinlenerek onaylanmadı; testler yalnız düzeyi ve süreyi ölçer.
- Kapıdan çıkış telefonda otomatik denenmedi (yürüme testi masaüstü klavyesiyledir).
- Telefonda üst çubukta "Hakkında" düğmesi yerine ses düğmesi durur; "Hakkında" ayarlar penceresinden açılır.

## Ayrıntılar

### 8.1 — Seçili figürün haritadaki işaretinde unvanı ve yılları görünür.

- **Mevcut durum:** İşaretin üstünde yalnız figürün adı yazar.
- **Problem:** Haritada figüre tıklayınca kartın başlığındaki bilgiler (unvan satırı ve yıllar satırı) işarette görünmüyor (T122).
- **Çözüm:** İşaretin verisine unvan ve yıllar eklenir; yıllar kartın başlığındakiyle aynı işlevle yazılır. İşaret seçiliyken adın altında bu iki satır görünür; seçili değilken yalnız ad görünür (üzerine gelince).
- **Dosyalar:** `src/map/MapView.ts`, `src/map/mapScene.ts`, `src/map/markerElements.ts`, `src/ui/figureLabels.ts`, `src/ui/theme/map.css`
- **Testler:** `tests/unit/app.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 8.2 — Sahnesi olan figürün işaretinde "Ziyaret et" düğmesi sahneyi açar.

- **Mevcut durum:** Sahneye, kartın köşesindeki küp simgesinden girilir.
- **Problem:** Geçiş göze çarpmıyor; işaretin üstünde açık bir düğme isteniyor (T122).
- **Çözüm:** Sahnesi olan figür seçiliyken işaretin levhasında "Ziyaret et" bağlantısı görünür ve o figürün sahne sayfasına götürür. Hangi figürün sahnesi olduğu tek yerde tutulur (`scenes.ts`). İşaret, içinde bağlantı taşıyabilmesi için düğme yerine bir kapsayıcı olur; tıklanan bölümü yine bir düğmedir.
- **Dosyalar:** `src/map/markerElements.ts`, `src/map/mapScene.ts`, `src/ui/scenes.ts`, `src/ui/theme/map.css`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 8.3 — Sahnede kapıya gelince "Haritaya dön" düğmesi belirir.

- **Mevcut durum:** Haritaya dönüş yalnız üst köşedeki bağlantıdır.
- **Problem:** Odadan çıkmak, oyunda olduğu gibi kapıya giderek yapılabilmeli (T122).
- **Çözüm:** Kapının yeri oda planından okunur. Oyuncu kapıya belirli bir uzaklıktan yakınsa ekranın altında "Haritaya dön" düğmesi görünür; E tuşu da aynı işi yapar. Giriş noktası bu uzaklığın dışındadır; düğme sahne açılır açılmaz görünmez.
- **Dosyalar:** `src/scene3d/hud.ts`, `src/scene3d/SceneApp.ts`, `src/scene3d/exit.ts`
- **Testler:** `tests/unit/scene3d.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 8.4 — Tıklama ve parşömen sesleri kodla üretilir ve iki sayfada çalınır.

- **Mevcut durum:** Arayüz sessizdir.
- **Problem:** Tıklama ve parşömen sesi isteniyor, hem sahnede hem haritada (T122).
- **Çözüm:** `src/audio/uiSounds.ts` iki sesi Web Audio ile üretir: tıklama kısa, tok bir vuruş; parşömen kısa, düzensiz bir hışırtıdır. Sayfadaki her düğme ve bağlantı tıklamasında tıklama çalınır. Parşömen, harita tarafında bir kart ya da pencere açıldığında, sahnede anlatım başladığında ve adım değiştiğinde çalınır. Seslerin düzeyi ve süresi otomatik ölçülür.
- **Dosyalar:** `src/audio/uiSounds.ts`, `src/audio/soundBoard.ts`, `src/ui/useUiSounds.ts`, `src/scene3d/audio/soundStage.ts`, `src/scene3d/SceneApp.ts`
- **Testler:** `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### 8.5 — Harita tarafında ses kapatılıp açılır; ayar iki sayfada ortaktır.

- **Mevcut durum:** Ses ayarı yalnız sahne sayfasındadır.
- **Problem:** Harita tarafında da ses kapatılabilmeli (T122).
- **Çözüm:** Ses ayarı modülü iki sayfanın ortak klasörüne taşınır ve "Arayüz" düzeyi eklenir. Harita tarafında üst çubukta ses düğmesi durur. Ayar aynı yerde saklandığı için bir sayfada yapılan seçim öbüründe de geçerlidir.
- **Dosyalar:** `src/audio/soundSettings.ts`, `src/audio/soundBoard.ts`, `src/ui/TopBar.tsx`, `src/ui/Icon.tsx`
- **Testler:** `tests/unit/sceneSound.test.ts`, `tests/e2e/scene.spec.ts`
- **Durum:** 🟢 Tamamlandı; testleri geçti.

### Referanslar

- `PHASE7.md` → ses ayarı ve en iyi uygulamalar
- `questions/S01-anlatici-sesinin-kaynagi.md` → anlatıcı sesinin kaynağı (bu fazın kapsamında değil)
