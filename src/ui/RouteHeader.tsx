import { currentRoute, useAppStore } from '../app/store';
import { Icon } from './Icon';
import { ROUTE_KIND_LABELS } from './routeLabels';

/**
 * Heads the route: the way to the overview, where no card is open and the
 * whole route is in view (FR-9), and what kind of route this is. The kind is
 * chosen with the figures, not here (FR-8).
 */
export function RouteHeader() {
  const route = useAppStore(currentRoute);
  const chosenKind = useAppStore((state) => state.routeKind);
  const inOverview = useAppStore((state) => state.focus === null && state.detour.length === 0);
  const hidden = useAppStore((state) => state.detour.length > 0);
  const closeFigure = useAppStore((state) => state.closeFigure);
  if (!route || hidden) return null;
  return (
    <div className="route-header stone" data-testid="route-header">
      <button type="button" className="btn" data-testid="overview" aria-pressed={inOverview} onClick={closeFigure}>
        <Icon name="overview" />
        Genel görünüm
      </button>
      <p className="route-header__text">
        <span className="display route-header__kind">{ROUTE_KIND_LABELS[route.kind].name}</span>
        <span> · {route.steps.length} kart</span>
        {chosenKind !== route.kind && (
          <span className="route-header__note"> · {ROUTE_KIND_LABELS[chosenKind].name} rotası bulunamadı</span>
        )}
      </p>
    </div>
  );
}
