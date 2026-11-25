---
id: S1
status: open
decider:
priority: major
asked: 2026-11-25
related: [K10]
---
# S1 — Anlatıcının sesi nereden gelsin?

**Mevcut durum:** Sahnede Fatih, fetih planını cihazın kendi Türkçe sesiyle (tarayıcının konuşma sentezi) anlatıyor; depoda ses dosyası yok.

**Soru:** Anlatımın kalıcı sesi hangi kaynaktan üretilsin?

## Bağlam

- Gereksinim (T115): Sahneye ses eklenir; ses Fatih'e uygun olmalıdır.
- Araştırma: Ücretsiz ve yerelde çalışan Türkçe ses modellerinin lisansları ticari kullanıma kapalıdır. Piper `tr_TR-dfki` CC BY-NC-SA 4.0, Coqui XTTS ticari olmayan lisans (CPML), Meta MMS-TTS CC BY-NC 4.0. Proje MIT lisanslıdır ve bir mağazada yayımlanabilir; bu modellerle üretilen ses dosyaları depoya konamaz.
- Uygulanan geçici çözüm ses dosyası dağıtmaz: metni, oyuncunun cihazında kurulu Türkçe ses okur. Sesin kalitesi ve cinsiyeti cihaza göre değişir; Türkçe ses kurulu olmayan cihazda anlatım yalnız yazıyla sürer.
- Yapı kayıtlı sese hazırdır: anlatım dosyasında bir adıma `audio` yolu yazıldığında o adım kayıttan çalınır, yazılmadığında cihazın sesi okur. Seçenek değişince kod değişmez.
- Sesin uygunluğu dinlenerek değerlendirilmelidir; bu değerlendirme otomatik yapılamaz.

## Seçenekler

### A — Cihazın kendi sesi kalsın

Bugünkü durum sürer; depoya ses dosyası girmez.

- Maliyet ve lisans sorunu yoktur; metin değişince ses de kendiliğinden değişir.
- Ses her cihazda farklıdır; bazı cihazlarda yalnız kadın sesi vardır, bazılarında Türkçe ses hiç yoktur.
- Fatih'e özgü bir ses karakteri kurulamaz.

### B — Ticari kullanıma izin veren bir ses sentezi hizmeti ⭐

Altı adımın metni, ticari kullanım hakkı veren ücretli bir hizmetle (ör. bulut ses sentezi sağlayıcıları) bir kez seslendirilir; dosyalar depoya eklenir.

- Her cihazda aynı, seçilmiş bir erkek sesi olur; çevrimdışı da çalışır.
- Bir hesap ve erişim anahtarı gerekir; anahtar depoya yazılmaz, yerel bir ortam değişkeninden okunur. Metin hizmete gönderilir (metin açık içeriktir, kişisel veri içermez).
- Hizmetin kullanım koşulları üretilen sesin yeniden dağıtımına ve ticari kullanımına izin vermelidir; seçilen planın koşulu ayrıca doğrulanır.
- Metin her değiştiğinde ilgili adım yeniden üretilir.

### C — Bir insanın seslendirmesi

Metni bir seslendirmen (ya da proje sahibi) okur; kayıtlar depoya eklenir.

- En doğal ve karaktere en uygun sonuç; hak durumu yazılı izinle nettir.
- Kayıt ve düzenleme emeği gerekir; metin değişince yeniden kayıt gerekir.

### D — Ticari olmayan açık model, yalnız yerel denemede

Piper `tr_TR-dfki` ile dosyalar yerelde üretilir ve depoya girmez.

- Sesin nasıl duracağı hemen denenebilir.
- Yayımlanan sürümde kullanılamaz; kalıcı çözüm değildir.

## Öneri

B. Her cihazda aynı ve seçilmiş bir ses, tek seferlik küçük bir maliyetle elde edilir; lisans koşulu baştan doğrulanabilir. Karar verilene kadar A çalışır durumdadır.

## Cevap

## Sonuç
