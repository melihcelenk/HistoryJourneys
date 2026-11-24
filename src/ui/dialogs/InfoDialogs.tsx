import { useAppStore } from '../../app/store';
import type { MapKind } from '../../app/urlState';
import { AVAILABLE_MAP_KINDS } from '../../map/createMapView';
import { DialogShell } from './DialogShell';

/** What the project is, how its content is made and under which licenses it is shared. */
export function AboutDialog() {
  const figureCount = useAppStore((state) => state.world?.figures.length ?? 0);
  return (
    <DialogShell title="History Journeys hakkında" testId="about-dialog">
      <p>
        History Journeys, tarihi insanlar üzerinden keşfetmek için yapılmış açık kaynak bir projedir. İki figür seçersin;
        aralarındaki insanlar, olaylar ve fikirler bir rota olur. Amaç bir ansiklopedi olmak değil, akılda kalan somut
        bilgiler ve aralarındaki neden–sonuç bağlarıyla merak uyandırmaktır.
      </p>
      <p>
        <strong>İçerik:</strong> {figureCount} figürün kartı, yazılı bir kural setine göre yapay zekâ ile üretildi ve
        henüz insan onayından geçmedi. Her kartın dayandığı kaynaklar kartın “Ayrıntılar” bölümünde listelenir. Kartlar
        bilgiyi önce en sade haliyle verir; “Derinlik” düğmesi sadeleştirmenin dışarıda bıraktığını gösterir.
      </p>
      <p>
        <strong>Lisans:</strong> Kod MIT, üretilen içerik CC BY-SA 4.0 lisansıyla paylaşılır. Harita verisi kamu malı
        olan Natural Earth’ten gelir. Yazı tipleri Cinzel ve EB Garamond (SIL Open Font License).
      </p>
      <p>
        <strong>Gizlilik:</strong> Uygulama hesap istemez ve senin hakkında hiçbir veri saklamaz.
      </p>
    </DialogShell>
  );
}

const MAP_KIND_LABELS: Record<MapKind, { name: string; note: string }> = {
  pixi: { name: 'Boyalı harita', note: 'Kabartmalı arazi ve bulut gölgeleri; oyun haritası görünümü.' },
  maplibre: { name: 'Sade harita', note: 'Hızlı ve hafif; her cihazda çalışır.' },
};

/** Map style and information. */
export function SettingsDialog() {
  const mapKind = useAppStore((state) => state.mapKind);
  const setMapKind = useAppStore((state) => state.setMapKind);
  const openDialog = useAppStore((state) => state.openDialog);
  return (
    <DialogShell
      title="Harita"
      testId="settings-dialog"
      footer={
        <button type="button" className="ink-btn" data-testid="open-about" onClick={() => openDialog({ kind: 'about' })}>
          Proje hakkında
        </button>
      }
    >
      <ul className="option-list">
        {AVAILABLE_MAP_KINDS.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              className="option"
              data-testid={`map-kind-${kind}`}
              aria-pressed={kind === mapKind}
              onClick={() => setMapKind(kind)}
            >
              <strong>{MAP_KIND_LABELS[kind].name}</strong>
              <br />
              {MAP_KIND_LABELS[kind].note}
            </button>
          </li>
        ))}
      </ul>
    </DialogShell>
  );
}
