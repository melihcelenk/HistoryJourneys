/** SQLite schema of the content database. Bump the version when the shape changes. */
export const DB_SCHEMA_VERSION = '2';

export const DB_SCHEMA = `
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE figure (
  slug TEXT PRIMARY KEY,
  name_tr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  wiki_title_tr TEXT NOT NULL,
  kind TEXT NOT NULL,
  roles_json TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  birth_place TEXT NOT NULL,
  death_year INTEGER NOT NULL,
  death_place TEXT NOT NULL,
  reign_from INTEGER,
  reign_to INTEGER,
  summary_json TEXT NOT NULL,
  -- How the card was generated (CG-4): model, version of the rule set, date, and review status.
  gen_model TEXT NOT NULL,
  gen_ruleset TEXT NOT NULL,
  gen_date TEXT NOT NULL,
  gen_status TEXT NOT NULL
);

CREATE TABLE action (
  figure_slug TEXT NOT NULL REFERENCES figure(slug),
  id TEXT NOT NULL,
  position INTEGER NOT NULL,
  year INTEGER NOT NULL,
  text TEXT NOT NULL,
  cause TEXT NOT NULL,
  consequence TEXT NOT NULL,
  depth TEXT, -- fuller account behind the depth marker (FR-27)
  sources_json TEXT NOT NULL,
  PRIMARY KEY (figure_slug, id)
);

CREATE TABLE place (
  slug TEXT PRIMARY KEY,
  name_tr TEXT NOT NULL,
  historic_name TEXT,
  lat REAL NOT NULL,
  lon REAL NOT NULL
);

CREATE TABLE journey_stop (
  figure_slug TEXT NOT NULL REFERENCES figure(slug),
  position INTEGER NOT NULL,
  place_slug TEXT NOT NULL REFERENCES place(slug),
  precision TEXT NOT NULL, -- how exact the location is: building, district, city or region (FR-17)
  year_from INTEGER NOT NULL,
  year_to INTEGER NOT NULL,
  event TEXT NOT NULL,
  PRIMARY KEY (figure_slug, position)
);

CREATE TABLE source (
  figure_slug TEXT NOT NULL REFERENCES figure(slug),
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  license TEXT,
  PRIMARY KEY (figure_slug, id)
);

CREATE TABLE relation_type (
  type TEXT PRIMARY KEY,
  name_tr TEXT NOT NULL,
  weight REAL NOT NULL,
  mode TEXT NOT NULL -- how routes may use the relation: direct or influence
);

CREATE TABLE relation (
  from_slug TEXT NOT NULL REFERENCES figure(slug),
  to_slug TEXT NOT NULL REFERENCES figure(slug),
  type TEXT NOT NULL REFERENCES relation_type(type),
  note TEXT NOT NULL,
  PRIMARY KEY (from_slug, to_slug, type)
);

CREATE TABLE concept (
  slug TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  meaning TEXT NOT NULL,
  root_letters TEXT,
  root_language TEXT,
  root_meaning TEXT,
  related_json TEXT NOT NULL
);

CREATE TABLE line (
  slug TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  name_tr TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE line_member (
  line_slug TEXT NOT NULL REFERENCES line(slug),
  position INTEGER NOT NULL,
  figure_slug TEXT NOT NULL REFERENCES figure(slug),
  PRIMARY KEY (line_slug, position)
);
`;
