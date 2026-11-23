# History Journeys

An open-source platform for exploring history through the people who made it.
Pick any two historical figures and travel from one to the other through the
people, events and ideas that connect them: on an interactive map, as a chain of
short cards, or on a diagram, with games that help what you learn stay with you.

> **Status:** requirements phase. This repository currently contains the product
> requirements only; no code has been written yet.

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

Code is released under the [MIT License](LICENSE). Data obtained from third-party
sources keeps its original license; see the requirements for each source.
