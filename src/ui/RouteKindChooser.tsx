import { useAppStore } from '../app/store';
import { ROUTE_KINDS } from '../domain/routeEngine';
import { ROUTE_KIND_LABELS } from './routeLabels';

/** Chooses the kind of route while the journey is being chosen: direct relations or influences (FR-8). */
export function RouteKindChooser() {
  const routeKind = useAppStore((state) => state.routeKind);
  const setRouteKind = useAppStore((state) => state.setRouteKind);
  return (
    <div className="route-kinds" role="radiogroup" aria-label="Rota türü">
      {ROUTE_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          role="radio"
          className="route-kind"
          data-testid={`route-kind-${kind}`}
          aria-checked={kind === routeKind}
          onClick={() => setRouteKind(kind)}
        >
          <span className="display route-kind__name">{ROUTE_KIND_LABELS[kind].name}</span>
          <span className="route-kind__note">{ROUTE_KIND_LABELS[kind].note}</span>
        </button>
      ))}
    </div>
  );
}
