# Figür portreleri: kaynak analizi ve karar

> **Task:** HJ-1 · **Tarih:** 2026-11-24 · **İlgili:** T53, S8, `PHASE14.md`

Figür kartlarında madalyon yerine kişinin portresinin gösterilmesi için görsellerin nereden alınacağı incelendi.
Ölçüt: telif ve lisans sorunu yaşanmaması. Portresi olmayan figürde bugünkü madalyon gösterilmeye devam eder.

## Karar

> **Güncelleme (T58, T59):** İlk ölçüt her eserin tarihinin ya da yazarının dosya sayfasında belgelenmesini istiyordu; 28 figür portre aldı ve Atatürk dışarıda kaldı. Bu sonuç kabul edilmedi. Ölçüt genişletildi: Commons'ta kamu malı ya da CC0 olarak işaretli, Vikipedi'nin de kullandığı, açıkça eski olan görseller alınır. Sonuç: 41 figür. Aşağıdaki tablo ilk hâlidir; geçerli kural `content/rules/RULESET.md` → R21'dir.

**Kaynak Wikimedia Commons'tır; görsele Wikidata'daki "görsel" (P18) alanı üzerinden ulaşılır ve yalnız kamu malı
(Public Domain) ya da CC0 olan, eserin kendisi de eski olduğu için kamu malı sayılan dosyalar alınır.**

Kararın parçaları:

| Konu | Karar |
|------|-------|
| Kaynak | Wikimedia Commons, Wikidata P18 üzerinden |
| Kabul edilen lisans | Yalnız Public Domain ve CC0 |
| Ek koşul | Eser (tablo, minyatür, gravür, fotoğraf) 1900'den önce yapılmış olmalı ya da yazarının 70 yıldan uzun süre önce öldüğü belgelenmiş olmalı |
| Kabul edilmeyen | CC BY ve CC BY-SA dosyaları; heykel, büst ve anıtların güncel fotoğrafları; yükleyenin "kendi eserim" diye lisansladığı güncel dosyalar |
| Dağıtım | Görsel depoya indirilir ve küçültülür; uygulama Commons'a canlı bağlanmaz |
| Kayıt | Her görsel için eser adı, yazar, tarih, lisans ve kaynak adresi içerikte tutulur; kartın "Kaynaklar" sekmesinde ve "Hakkında" penceresinde gösterilir |
| Portre yoksa | Bugünkü madalyon gösterilir |
| Temsilî portre | Kişinin ölümünden sonra yapılmış portre "temsilî" olarak işaretlenir |

## Ölçüm: 50 figür için durum

Wikidata ve Commons, içerikteki 50 figür için sorgulandı (2026-11-24). Sorgu yalnız okuma yaptı; hiçbir görsel indirilmedi.

| Durum | Figür sayısı |
|-------|--------------|
| Wikidata kaydı bulunan | 50 |
| Wikidata'da görseli (P18) olan | 49 |
| Commons'ta "Public domain" beyanlı | 42 |
| Commons'ta CC0 beyanlı | 3 |
| Commons'ta CC BY-SA beyanlı | 4 |
| Görseli olmayan | 1 |

Kararın ek koşulu uygulandığında tablo değişir, çünkü Commons'taki lisans yükleyenin beyanıdır:

| Grup | Figürler | Sonuç |
|------|----------|-------|
| 1900'den önce yapılmış tablo, minyatür, gravür ya da fotoğraf | 45 kamu malı ve CC0 dosyanın büyük bölümü: örneğin Fatih (Nakkaş Osman, 1579), Kanuni (Tiziano çevresi, 1530'lar), III. Selim (Kapıdağlı, 1803), Abdülaziz (Abdullah Biraderler, 1876 öncesi) | Alınır |
| Güncel fotoğraf ya da yükleyenin kendi adına lisansladığı dosya | Mimar Sinan (2009), Pîrî Reis (2014), II. Bayezid (2020), IV. Murad (2015), II. Süleyman (2012) | Dosya tek tek incelenir; eski bir eserin düz reprodüksiyonuysa alınır, heykel ya da büst fotoğrafıysa alınmaz |
| 20. yüzyıl fotoğrafı | Atatürk, İsmet İnönü, Enver Paşa, V. Mehmed, VI. Mehmed | Dosya tek tek incelenir; yazarı ve yayın yılı belgelenen dosya alınır (V. ve VI. Mehmed'in fotoğrafları Bain News Service arşivinden, Kongre Kütüphanesi'nde kamu malı) |
| CC BY-SA | Akşemseddin, Evliya Çelebi, İbrahim Müteferrika, Kösem Sultan | Alınmaz; madalyon gösterilir |
| Görseli yok | Kâtip Çelebi | Madalyon gösterilir |

Bu tablo dosyalar incelenmeden önce yazılmıştı ve 38–43 figür öngörüyordu. **İnceleme sonucu (Faz 14 → 14.2): 28 figür portre aldı, 22 figür madalyonla kaldı.** Fark, "1900 öncesi" diye varsayılan dokuz sultan portresinin dosyasında tarih ve yazar yazmamasından geliyor; ölçüt belge istediği için bunlar alınmadı. Dosya dosya sonuç ve gerekçeler: `content/portraits/REVIEW.md`.

## İncelenen kaynaklar

| Kaynak | Kapsam | Lisans durumu | Sonuç |
|--------|--------|---------------|-------|
| Wikimedia Commons (Wikidata P18 ile) | 50 figürün 49'u | Dosya başına makinece okunur lisans, yazar ve tarih bilgisi | ⭐ Seçildi |
| Müze açık erişim koleksiyonları (Metropolitan, Rijksmuseum, Cleveland ve benzerleri) | Osmanlı figürleri için dağınık ve az | Çoğu CC0 | Tek başına yetmez; Commons'taki dosyaların bir bölümü zaten bu koleksiyonlardan gelir |
| Kongre Kütüphanesi, Europeana | Geç dönem figürleri (19. ve 20. yüzyıl) için iyi | Kayıt başına değişir | Yedek kaynak: Commons'taki bir dosyanın kökeni doğrulanırken kullanılır |
| Türkiye'deki kurum siteleri (TDV İslâm Ansiklopedisi, Millî Saraylar, Atatürk Araştırma Merkezi, ajans arşivleri) | İyi | Açık lisans yok; tüm hakları saklı | Kullanılmaz |
| Yapay zekâ ile üretilmiş portre | Tam | Telif açısından tartışmalı | Kullanılmaz: gerçek bir kişiye uydurma bir yüz verir; projenin "her bilgi kaynağa dayanır" ilkesiyle çelişir |
| Sipariş edilen özgün çizimler | Tam | Sözleşmeyle projeye ait | İlk sürüm için maliyetli; ileride tek tip bir görsel dil istenirse değerlendirilir |

## Neden yalnız kamu malı ve CC0

- **Kamu malı ve CC0** dosyalar atıf zorunluluğu olmadan, değiştirilerek ve ticari olarak kullanılabilir. Madalyon içine
  kırpmak, küçültmek ve uygulamayı Microsoft Store'da dağıtmak ek koşul doğurmaz. Atıf yine de gösterilir, çünkü
  projede her bilginin kaynağı gösterilir.
- **CC BY-SA** dosyalar kullanılabilir ama iki yük getirir: görünür atıf zorunludur ve dosyadan türetilen görsel
  (kırpılmış, renklendirilmiş hâli) aynı lisansla paylaşılmak zorundadır. Projenin üretilmiş içeriği zaten CC BY-SA 4.0
  ile lisanslıdır (D8), yani bu lisans projeyle uyumludur; yine de dört figür için ayrı atıf ve lisans yükümlülüğü
  üstlenmek yerine madalyon gösterilir. İstenirse sonradan eklenebilir (S8 → B).
- **Heykel ve büst fotoğrafları** iki ayrı hak taşır: heykeltıraşın ve fotoğrafçının. Fotoğrafçı kendi hakkını CC0 ile
  bıraksa bile heykelin hakkı sürüyor olabilir. Türkiye'de kamuya açık eserlerin fotoğrafı için tanınan serbestlik
  dardır. Bu yüzden bu dosyalar alınmaz.

## Neden "eser eski olmalı" koşulu

Commons'taki lisans etiketi yükleyenin beyanıdır ve yanlış olabilir. Eserin kendisi eskiyse beyana güvenmek gerekmez:

- Türkiye'de ve Avrupa Birliği'nde koruma, yazarın ölümünden sonra 70 yıl sürer. 1900'den önce yapılmış bir eserin
  yazarı pratikte 70 yıldan uzun süre önce ölmüştür.
- Amerika Birleşik Devletleri'nde 1931'den önce yayımlanmış eserler kamu malıdır (2026 itibarıyla; süre yayından sonra 95 yıldır).
- Kamu malı iki boyutlu bir eserin (tablo, minyatür, gravür) düz reprodüksiyonu yeni bir hak doğurmaz: ABD'de yargı
  kararıyla, Avrupa Birliği'nde 2019 tarihli telif direktifinin 14. maddesiyle.

20. yüzyıl fotoğraflarında bu güvence yoktur. Fotoğrafçı 1956'dan sonra öldüyse eser Türkiye'de hâlâ korunuyor
olabilir. Bu yüzden Atatürk, İnönü ve Enver Paşa için dosya, yazarı ve ilk yayın yılı belgelenebiliyorsa alınır;
belgelenemiyorsa madalyon gösterilir.

## Neden depoya indirilir

- Uygulama çevrimdışı çalışır (PWA); canlı bağlantı çevrimdışıyken görsel göstermez.
- Commons'taki bir dosya silinebilir, yeniden adlandırılabilir ya da lisansı değişebilir; depodaki kopya ve yanındaki
  kayıt, alındığı gündeki durumu belgeler.
- Canlı bağlantı, oyuncunun IP adresini üçüncü bir sunucuya gönderir; ilk sürümde kişisel veri toplanmaz (D6, NFR-6).

## Doğrulanmayan ve dikkat edilmesi gerekenler

- Bu belge hukuki görüş değildir. Kurallar genel bilgiye dayanır; ülkeden ülkeye fark edebilir.
- Lisanslar dosya sayfaları tek tek açılarak okunmadı; yalnız Commons'un makinece okunur alanları sorgulandı.
- Wikidata'daki görselin gerçekten o kişiyi gösterdiği doğrulanmadı. Erken dönem figürlerinin çoğunun çağdaşı portresi
  yoktur; görsellerin bir bölümü sonraki yüzyıllarda yapılmış temsilî portrelerdir.
- Görsellerin çözünürlüğü değişkendir (en küçüğü 408×583 piksel); madalyon boyutu için hepsi yeterlidir.

## Referanslar

- Ölçümün ham çıktısı: `tmp/portrait-survey.json` (depoya girmez; `tmp/survey-portraits.mjs` ile yeniden üretilir)
- Wikimedia Commons lisans rehberi: <https://commons.wikimedia.org/wiki/Commons:Licensing>
- Creative Commons BY-SA 4.0 lisans metni: <https://creativecommons.org/licenses/by-sa/4.0/legalcode>
- `docs/requirements/history-journeys.md` → D6, D8, DR-5, NFR-6
