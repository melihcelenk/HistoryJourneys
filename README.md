# History Journeys

An open-source platform for exploring history through the people who made it.
Pick two historical figures and the site works out a route between them through
the people, events and ideas that connect them. If you prefer another way, switch
to one of the alternative routes. Follow the route on an interactive map, as a
chain of short cards, or on a diagram, with games that help what you learn stay
with you.

> **Status:** first playable version. The platform runs with about 50 figures
> around the Ottoman succession from Mehmed II to Atatürk. Content is generated
> by an LLM under a written rule set and has not been reviewed by a human yet.

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev        # builds the content database and starts the development server
```

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build into `dist/` (static files; works on any host). |
| `npm run test:all` | Type check, lint, unit tests and end-to-end tests. |
| `npm run db:build` | Rebuild the content database from `content/`. |
| `npm run content:verify` | Compare birth and death years with Wikidata. |

How the code is organized: [docs/general/ARCHITECTURE.md](docs/general/ARCHITECTURE.md).
Publishing on the web and in the Microsoft Store:
[docs/general/STORE_PUBLISHING.md](docs/general/STORE_PUBLISHING.md).

## Contributing content

Every figure is one file under `content/figures/`. To correct a fact, edit the
file and open a pull request; `npm run db:build` checks the file against the
schema and the rule set in `content/rules/RULESET.md`.

## Projects

| Project | Description | Requirements |
|---------|-------------|--------------|
| **History Journeys** (platform) | The site and the shared engine: figure graph, routes between figures, cards, map, diagrams, learning games. | [docs/requirements/history-journeys.md](docs/requirements/history-journeys.md) |
| **Atatürk's Life Journey** | First content package: an interactive map of Mustafa Kemal Atatürk's life (1881–1938), built on sourced chronologies. | [docs/requirements/ataturk-life-journey.md](docs/requirements/ataturk-life-journey.md) |
| **Religion History Diagrams** | An interactive diagram-based note system, first applied to the history of world religions, with spaced repetition. | [docs/requirements/religion-history-diagrams.md](docs/requirements/religion-history-diagrams.md) |

The platform is the foundation: the two content projects reuse its figure graph,
cards, diagrams and review system rather than building their own.

## Principles

- **Memorable, not encyclopedic.** The goal is not another Wikipedia. Every card
  holds a few concrete, connected facts that a reader can remember and relate to
  what they already know.
- **Open data in, our own layer on top.** Raw facts about people, places and dates
  come from open sources such as Wikidata; the value of this project is the
  cards, relations and routes built on top of them.
- **Explore by following links.** Everything shown (a person, a place, an event,
  even a word) can be followed to the next piece of knowledge.

## License

Code is released under the [MIT License](LICENSE). Generated content (cards,
actions, causes and consequences) is released under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Data obtained
from third-party sources keeps its original license; see the requirements for
each source.
