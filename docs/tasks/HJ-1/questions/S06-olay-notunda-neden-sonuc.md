---
id: S6
status: answered
decider: user
priority: minor
asked: 2026-11-24
related: [FR-2, FR-13, FR-27]
---
# S6 — Haritadaki olay notunda da neden, sonuç ve derinlik olsun mu?

**Mevcut durum:** Neden, sonuç ve derinlik ikon düğmeleri figür kartındaki "Yaptıkları" satırlarına kondu; haritanın altındaki olay notunda bu düğmeler yok.

**Soru:** "Aşağıdaki kartta neden sonuç ve derinlik butonları olmalı" derken haritanın altındaki olay notunu da kastettin mi?

## Bağlam

- T41'deki cümle iki şekilde okunabiliyor: figür kartındaki yazılı düğmelerin ikona çevrilmesi ya da haritanın altındaki olay notuna bu düğmelerin eklenmesi.
- İlk okuma uygulandı (Faz 12 → 12.2), çünkü "kartı büyütmeyecek şekilde" ifadesi yazılı düğmelerin kartı uzatmasıyla örtüşüyor.
- Olay notu yolculuk duraklarını anlatıyor. Durakların içerikte yalnız olay cümlesi var; neden, sonuç ve derinlik alanları yalnız "Yaptıkları" kayıtlarında bulunuyor.
- Bir durağı, yılı tuttuğu için bir "Yaptıkları" kaydıyla eşleştirmek tahmin olur: aynı yılda başka bir yerde yapılmış bir işin nedeni yanlış durağın altında görünebilir.

## Seçenekler

### A — Olduğu gibi kalsın ⭐

Düğmeler yalnız figür kartında durur; olay notu yalnız olayı yazar.

- Ek içerik gerekmez.
- Olay notu kısa kalır.

### B — Duraklara neden, sonuç ve derinlik alanları eklensin

İçerik şemasına durak başına üç isteğe bağlı alan eklenir; olay notunda ikon düğmeler çıkar.

- 50 figürün duraklarına yeni içerik yazılması gerekir (Atatürk için 29 durak).
- Yazılmamış duraklarda düğme görünmez.

### C — Durak, içerikte elle bir "Yaptıkları" kaydına bağlansın

Durak kaydına isteğe bağlı bir `action` alanı eklenir; bağlı durakların notunda o işin neden, sonuç ve derinliği açılır.

- Yeni metin yazılmaz, yalnız bağlantı kurulur.
- Çoğu durağın karşılığı olan bir iş yok; düğmeler az sayıda durakta çıkar.

## Öneri

A. İstenen şey figür kartındaki düğmelerse iş bitti. Olay notunda da isteniyorsa C en ucuz yol; B en doğru ama en çok içerik isteyen yol.

## Cevap

**A — Olduğu gibi kalsın**

Tamam, ilk versiyon için gerekli değil.

## Sonuç

A uygulandı; kod değişikliği gerekmedi. Neden, sonuç ve derinlik ikon düğmeleri yalnız figür kartındaki "Yaptıkları" satırlarında duruyor (Faz 12 → 12.2); haritanın altındaki olay notu yalnız olayı yazıyor. Duraklara neden ve sonuç eklemek ilk sürümün kapsamı dışında bırakıldı ve `PHASE12.md` → Kalan bölümüne not edildi.
