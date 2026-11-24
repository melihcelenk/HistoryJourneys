import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { ContentRepository } from '../data/ContentRepository';
import { SqliteContentRepository } from '../data/SqliteContentRepository';

const DATABASE_URL = 'data/hj.sqlite';
/** Every SQLite file starts with these bytes. */
const SQLITE_HEADER = 'SQLite format 3';

/** Downloads the content database and opens it in the browser with sql.js. */
export async function openContentRepository(): Promise<ContentRepository> {
  const [SQL, response] = await Promise.all([initSqlJs({ locateFile: () => wasmUrl, useOldExtensionFunctions: false }), fetch(DATABASE_URL)]);
  if (!response.ok) {
    throw new Error(`Content database could not be loaded (HTTP ${response.status})`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  // A static host may answer a missing file with its start page and HTTP 200.
  const header = new TextDecoder().decode(bytes.subarray(0, SQLITE_HEADER.length));
  if (header !== SQLITE_HEADER) throw new Error('The content database is not a SQLite file');
  return new SqliteContentRepository(new SQL.Database(bytes));
}
