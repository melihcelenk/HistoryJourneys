---
id: S7
status: open
decider:
priority: minor
asked: 2026-11-24
related: [FR-1, FR-13]
---
# S7 — Kart başlığındaki iki harita düğmesi nerede dursun?

**Mevcut durum:** Roller ve yıllar artık başlığın altında kartın bütün genişliğine yayılıyor; iki harita düğmesi (yolculuk, çizgiler) adın sağında duruyor (seçenek A).

**Soru:** Mock'lardaki dört yerleşimden hangisi kalsın?

## Bağlam

- Mock'lar: `docs/tasks/HJ-1/mocks/card-header.html` (tarayıcıda açılır), görüntüsü `docs/tasks/HJ-1/mocks/card-header.png`.
- Dört seçenekte de kart aynı genişlikte ve aynı içerikte; fark yalnız düğmelerin yerinde.
- T45'te iki fikir vardı: düğmeleri alt alta koymak (D) ve madalyonla aynı sütuna almak (B). İkisi de mock'larda var; yanlarına iki seçenek daha eklendi.
- Mock'lar statik sayfadır ve oyunun yazı tiplerini taşımaz; oran ve yerleşim aynıdır, harflerin biçimi oyundakinden biraz farklı görünür.

## Seçenekler

### A — Düğmeler adın yanında, roller tam genişlikte

Şu an uygulanan hâl.

- Düğmelerin altı boş kalmaz; roller iki satıra iner.
- Uzun ad, düğmeler yüzünden yine üç satıra bölünebilir.

### B — Düğmeler madalyonun altında

- Ad en geniş yeri alır.
- Roller madalyon sütunu kadar dar kalır; düğmeler 28 piksele küçülür.

### C — Düğmeler sekme satırının ucunda ⭐

- Başlıkta hiç boşluk kalmaz; ad ve roller bütün genişliği kullanır.
- Düğmeler "Yolculuğu" sekmesinin yanında, ilgili oldukları şeyin yakınında durur.
- Sekmeler daralır; "Kaynaklar" yerine "Kaynak" gibi kısa bir ad gerekebilir.

### D — Düğmeler sağda alt alta

- Düğme sütunu yarıya iner; ad biraz daha geniş yer bulur.
- Yazı iki yandan sıkışır, roller üç satıra çıkar; dört seçeneğin en yükseği olur.

## Öneri

C. Başlığı yalnız kişiye bırakan tek seçenek; düğmeler de anlam olarak yolculuk sekmesine yakın. A şimdiden çalışıyor ve en az riskli olan; B ve D'de yazı bir yerden sıkışmaya devam ediyor.

## Cevap

**A — Düğmeler adın yanında, roller tam genişlikte**

Mevcut yerleşim (A) yeterli bulundu. D seçeneği de kabul edilebilir görüldü ancak gereksiz boşluk bıraktığı için şimdilik seçilmedi; figür portreleri eklendiğinde yeniden değerlendirilebilir. (Cevap sohbet üzerinden verildi, T53.)

## Sonuç

A uygulanmış durumdaydı; kod değişikliği gerekmedi. Başlık düzeninin portrelerle birlikte yeniden değerlendirilmesi `PHASE14.md` → Kalan bölümüne not edildi.
