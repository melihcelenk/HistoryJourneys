---
id: S5
status: open
decider:
priority: major
asked: 2026-11-24
related: [CG-7, CG-8, DR-5, D2]
---
# S5 — Kaynaklar çeliştiğinde karta hangisi yazılsın?

**Mevcut durum:** 50 figürün kartı üretildi; doğum ve ölüm yılları Wikidata ile karşılaştırıldı ve 46 figürde uyuştu, 4 figürde kaynaklar birbirini tutmuyor.

**Soru:** Çelişen yıllarda TDV İslâm Ansiklopedisi mi esas alınsın?

## Bağlam

`npm run content:verify` çıktısı (rapor: `tmp/wikidata-report.md`):

| Figür | Kartta | Wikidata | Not |
|---|---|---|---|
| Alemdar Mustafa Paşa, doğum | 1765 | 1755 | Kart TDV'ye göre yazıldı; Vikipedi 1755 diyor |
| Evliya Çelebi, ölüm | 1685 | 1682 | Ölüm yılı ve yeri kaynaklarda kesin değil |
| Hürrem Sultan, doğum | 1504 | 1505 / 1507 | Kaynaklar 1502–1507 arasında değişiyor |
| Köprülü Mehmed Paşa, doğum | 1575 | 1578 / 1580 | Doğum yılı kesin bilinmiyor |

Ayrıca içerik ajanları şunu bildirdi: doğum, ölüm ve saltanat yılları ile kaynak adresleri tek tek doğrulandı; eylemlerin
ayrıntıları (savaş tarihleri, sayılar, anlatılar) ise satır satır kaynakla karşılaştırılmadı. Kartların hepsi
"üretildi, insan onayından geçmedi" olarak işaretli ve bu, kartın Ayrıntılar bölümünde okura gösteriliyor.

Ne olur: Seçilen kural, kural setine (`content/rules/RULESET.md`) yazılır ve kartlar ona göre yeniden üretilir (CG-3).

## Seçenekler

### A — TDV esas, fark Derinlik notunda ⭐ önerilen

Karta TDV'nin yılı yazılır; başka kaynak farklı diyorsa "Bazı kaynaklara göre …" diye Derinlik notuna eklenir.

- ✅ Tek ve akademik bir kaynak önceliği; "önce basit, istenirse derin" ilkesine (D5) uyar
- ❌ TDV'nin maddesi olmayan figürlerde ikinci bir kural gerekir

### B — Wikidata esas

- ✅ Makineyle denetlenebilir; her dile hazır
- ❌ Wikidata'da aynı kişi için birden çok yıl olabiliyor (yukarıda iki örnek)

### C — Kesin olmayan yılı "yaklaşık" diye göster

- ✅ En dürüst gösterim ("1575 dolayları")
- ❌ Kart arayüzünde ve veri modelinde ek alan gerekir

## Öneri

**A**: Kural seti zaten TDV'yi tercih edilen kaynak sayıyor (R14); eksik olan, çelişkide ne yapılacağının yazılması.
C ileride eklenebilir.

## Cevap

## Sonuç

**Geçici karar (T4 gereği soru açık):** Kartlardaki yıllara dokunulmadı; dördü de TDV ya da ajanın seçtiği kaynağa göre
duruyor. A seçilirse yapılacak iş: kural setine çelişki kuralının eklenmesi, dört kartın Derinlik notuna farkın
yazılması ve eylem ayrıntılarının kaynakla satır satır karşılaştırılması için ikinci bir üretim turu.
