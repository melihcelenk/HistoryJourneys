import { type EndpointSlot, useAppStore } from '../app/store';
import { EMPTY_SLOT_LABEL, SLOT_LABELS } from './endpointLabels';
import { Icon } from './Icon';
import { Medallion } from './Medallion';

function Endpoint({ slot }: { slot: EndpointSlot }) {
  const figure = useAppStore((state) => state.world?.figures.find((item) => item.slug === state[slot]));
  const openDialog = useAppStore((state) => state.openDialog);
  return (
    <button
      type="button"
      className="endpoint"
      data-testid={`endpoint-${slot}`}
      onClick={() => openDialog({ kind: 'picker', slot })}
    >
      <Medallion kind={figure?.kind} />
      <span className="endpoint__text">
        <span className="endpoint__label">{SLOT_LABELS[slot]}</span>
        <span className="endpoint__name">{figure?.nameTr ?? EMPTY_SLOT_LABEL}</span>
      </span>
    </button>
  );
}

/** Top of the game screen: the title, the two chosen figures and the swap button. */
export function TopBar() {
  const hasBoth = useAppStore((state) => state.from !== null && state.to !== null);
  const swapEndpoints = useAppStore((state) => state.swapEndpoints);
  const clearJourney = useAppStore((state) => state.clearJourney);
  const openDialog = useAppStore((state) => state.openDialog);
  return (
    <header className="topbar stone">
      <button type="button" className="topbar__title display" onClick={clearJourney} aria-label="Başlangıç ekranına dön">
        <Icon name="crest" className="topbar__crest" />
        <span>History Journeys</span>
      </button>
      <div className="endpoints">
        <Endpoint slot="from" />
        <button
          type="button"
          className="btn btn--icon"
          aria-label="Başlangıç ile varışı değiştir"
          disabled={!hasBoth}
          onClick={swapEndpoints}
        >
          <Icon name="swap" />
        </button>
        <Endpoint slot="to" />
      </div>
      <div className="topbar__actions">
        <button type="button" className="btn" onClick={() => openDialog({ kind: 'about' })}>
          <Icon name="info" />
          Hakkında
        </button>
      </div>
    </header>
  );
}
