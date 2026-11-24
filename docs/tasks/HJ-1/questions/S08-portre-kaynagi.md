---
id: S8
status: answered
decider: user
priority: major
asked: 2026-11-24
related: [D8, DR-5, FR-1, FR-6, NFR-6]
---
# S8 — Figür portreleri nereden alınsın?

**Mevcut durum:** Figürlerin görseli yok; kaynak analizi yapıldı ve Wikimedia Commons'taki kamu malı ile CC0 dosyalar seçildi, uygulamaya başlanmadı.

**Soru:** Seçilen kaynak ve ölçütle (seçenek A) Faz 14'ün uygulanmasına başlansın mı?

## Bağlam

- Gereksinim (T53): Figür kartlarında kişilerin portresi gösterilir. Portresi olmayan figür bugünkü madalyonla gösterilir. Görsellerin kaynağı telif ve lisans sorunu doğurmayacak biçimde seçilir; seçim analizle birlikte yapılır.
- Analiz ve ölçüm: `docs/tasks/HJ-1/PORTRAITS_ANALYSIS.md`. Uygulama planı: `docs/tasks/HJ-1/PHASE14.md`.
- Ölçüm: 50 figürün 49'unda Commons'ta görsel var; 45'i kamu malı ya da CC0, 4'ü CC BY-SA beyanlı, 1 figürün görseli yok.
- Commons'taki lisans yükleyenin beyanıdır. Güncel fotoğraflar (5 figür) ve 20. yüzyıl fotoğrafları (5 figür) tek tek incelenmeden alınmaz.
- Karar bu kartta uygulanmış sayılır ama kart açıktır; farklı bir seçenek seçilirse plan ona göre değişir.

## Seçenekler

### A — Commons, yalnız kamu malı ve CC0, eser eski ⭐

Eser 1900'den önce yapılmış ya da yazarının 70 yıldan uzun süre önce öldüğü belgelenmiş olmalı. Görseller depoya indirilir; atıf gösterilir.

- Telif riski en düşük seçenek: atıf, aynı lisansla paylaşma ya da ticari kullanım koşulu doğmaz.
- Beklenen kapsam: 50 figürün yaklaşık 38–43'ü; kalanında madalyon.
- Atatürk, İnönü ve Enver Paşa'nın portresi, dosyanın yazarı ve yayın yılı belgelenemezse gösterilmez.

### B — Commons, CC BY ve CC BY-SA dosyaları da kabul

A'ya ek olarak atıf isteyen lisanslar da alınır.

- Dört figür daha portre kazanır (Akşemseddin, Evliya Çelebi, İbrahim Müteferrika, Kösem Sultan).
- Görünür atıf zorunlu olur; kırpılmış görseller aynı lisansla paylaşılmak zorundadır. Projenin içeriği zaten CC BY-SA 4.0 ile lisanslı olduğu için (D8) bu lisans projeyle uyumludur.
- Bu dört dosyanın bir bölümü heykel ya da anıt fotoğrafıdır; heykelin kendi hakkı ayrıca sorun olabilir.

### C — Commons'taki her dosya, beyan edilen lisansa güvenerek

Tek tek inceleme yapılmaz; Wikidata'nın gösterdiği dosya lisans etiketine bakılarak alınır.

- En hızlı yol; 49 figür portre kazanır.
- Yanlış etiketlenmiş bir dosyanın riski projeye geçer.

### D — Portre gösterilmez

Bugünkü madalyonlar kalır.

- Risk yok.
- Kişiler görsel olarak ayırt edilemez.

## Öneri

A. Ölçüt "telif sorunu yaşanmaması" olduğu için en dar kapsam seçildi; figürlerin büyük çoğunluğu 1900'den önce yaşadığından kayıp küçüktür. Kapsam yetersiz bulunursa B'ye geçmek yalnız dört dosyanın incelenmesini gerektirir.

## Cevap

**A — Commons, yalnız kamu malı ve CC0, eser eski**

## Sonuç

A uygulandı (Faz 14). 49 aday dosya tek tek incelendi; ölçütü karşılayan 28 figür portre aldı, 22 figür bugünkü simgeyle gösteriliyor. Kapsam, analizde öngörülen 38–43'ün altında kaldı: dokuz sultan portresinin dosyasında eserin tarihi ve yazarı belgeli değil, Atatürk, İnönü ve Enver Paşa'nın fotoğraflarının yazarı bilinmiyor. Kabul ve ret gerekçeleri `content/portraits/REVIEW.md`, kurallar `content/rules/RULESET.md` → 8. bölümdedir. Görseller depoya indirildi; uygulama başka bir sunucuya bağlanmıyor.

**Güncelleme (T58, T59):** 28 figürlük sonuç, Atatürk'ün portresi bulunmadığı için kabul edilmedi ve Vikipedi'nin kullandığı görsellerin kullanılması istendi. Ölçütün "eserin tarihi ya da yazarı dosyada belgeli olmalı" koşulu genişletildi (`content/rules/RULESET.md` → R21): Commons'ta kamu malı ya da CC0 olarak işaretli, açıkça eski olan görseller alınıyor. 13 figür daha portre aldı; toplam 41. Lisans koşulu (yalnız kamu malı ve CC0) ve heykel fotoğraflarının alınmaması değişmedi.
