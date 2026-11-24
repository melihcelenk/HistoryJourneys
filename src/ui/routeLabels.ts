import type { RouteKind } from '../domain/routeEngine';

/** How the two kinds of route are presented to the reader (FR-8). */
export const ROUTE_KIND_LABELS: Record<RouteKind, { name: string; note: string }> = {
  direct: { name: 'Doğrudan', note: 'Birebir ilişkilerle, kişiden kişiye' },
  influence: { name: 'Etki', note: 'Etkilerle; arada yüzyıllar olabilir' },
};
