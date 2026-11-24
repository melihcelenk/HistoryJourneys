/** The part of the world the game map covers, in degrees. */
export const MAP_REGION = {
  west: -14,
  south: 8,
  east: 74,
  north: 62,
} as const;

/** Where the map opens: the Ottoman heartland around the Sea of Marmara. */
export const MAP_HOME = { lon: 29, lat: 39.5, zoom: 4.2 } as const;
