import { useAppStore } from '../app/store';

/** Alternative routes between the two figures, shown as pennants (FR-8). */
export function RouteTabs() {
  const routes = useAppStore((state) => state.routes);
  const routeIndex = useAppStore((state) => state.routeIndex);
  const hidden = useAppStore((state) => state.detour.length > 0);
  const selectRoute = useAppStore((state) => state.selectRoute);
  if (routes.length === 0 || hidden) return null;
  return (
    <div className="routes" role="tablist" aria-label="Rota seçenekleri">
      {routes.map((route, index) => (
        <button
          key={route.id}
          type="button"
          role="tab"
          className="route-tab"
          data-testid={`route-tab-${index}`}
          aria-selected={index === routeIndex}
          onClick={() => selectRoute(index)}
        >
          <span className="route-tab__label">{route.label}</span>
          <span className="route-tab__meta">{route.steps.length} kart</span>
        </button>
      ))}
    </div>
  );
}
