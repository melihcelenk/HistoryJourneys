# Atatürk's Life Journey — Requirements

## 1. Purpose

An interactive map of the life of Mustafa Kemal Atatürk (1881–1938) that shows the
places he lived in, served at and visited, with dates and events, based on
historians' chronologies. It is the first content package of the
[History Journeys](history-journeys.md) platform and covers the figure at one end
of the platform's primary line.

## 2. Background

A review of existing resources (September 2026) found no interactive map that
combines Atatürk's real geographic locations with a timeline and is based on
historians' sources. The available resources are text chronologies and photo
archives:

| Resource | Content |
|----------|---------|
| [Ministry of National Education — Atatürk Chronology](https://www.meb.gov.tr/ataturk/Hayati/Kronoloji) ([mirror](https://dogmmateryal.meb.gov.tr/ataturk/Hayati/Kronoloji)) | Text chronology ordered by date. |
| [Istanbul Aydın University ATAM — Chronology](https://www.aydin.edu.tr/tr-tr/arastirma/arastirmamerkezleri/atam/ataturk/Pages/Kronoloji.aspx) | Detailed, day-by-day chronology. |
| [isteataturk.com — Chronological](https://isteataturk.com/Kronolojik) | Photo archive grouped by year; no map. |
| [Atatürk museums in Turkey (Wikipedia)](https://en.wikipedia.org/wiki/Atat%C3%BCrk_Museums_in_Turkey) | Physical museums at places of his life (Thessaloniki, Samsun, İzmir, Alanya, Ankara and others). |

## 3. Functional Requirements

- **AJ-1** The journey is a dated, ordered list of stops. Each stop has a place, a date or date range, the events that happened there and the sources for them.
- **AJ-2** Stops are shown on an interactive map, connected in chronological order.
- **AJ-3** A timeline controls the map: moving it highlights the stop for that date and the path up to it.
- **AJ-4** Selecting a stop opens its card (three-sentence summary, events, sources), following the platform card model.
- **AJ-5** Life periods (education, military service, the War of Independence, the presidency) can be selected to filter the stops.
- **AJ-6** Museums and preserved places connected to a stop are shown with it.
- **AJ-7** Sources are shown as footnotes on every stop.

## 4. Data Requirements

- **AJ-8** Stops are compiled by the LLM under the platform's generation rules (CG-1, CG-8) from the chronologies in §2, with the ATAM chronology as the primary source. Facts and dates are taken from the chronologies; their text is not reproduced, and each stop cites them.
- **AJ-9** Each place has latitude and longitude and a location precision (building, district, city or region).
- **AJ-10** Places are stored with both their historical and present-day names (for example *Selanik* / *Thessaloniki*).
- **AJ-11** The journey uses the platform's entity model, so that people, events and places on Atatürk's cards link into the rest of History Journeys.

## 5. Technical Notes

- The map is built on an open map stack (for example Leaflet or MapLibre with OpenStreetMap data), with historical borders from the sources listed in the platform requirements.
- The compiled chronology is stored as data in the repository, so that corrections can be proposed through pull requests.
