# Religion History Diagrams — Requirements

## 1. Purpose

An interactive, modern web application that presents Christianity, Judaism,
Islam and other world religions through their **people**, **concepts**,
**historical turning points** and **denominations**.

Although its first subject is the history of religions, the system is built as a
**general diagram-based note-taking and learning tool** that can be applied to
any subject. It is built on the engine of the [History Journeys](history-journeys.md)
platform: the entity graph, cards, diagrams and spaced repetition are shared.

## 2. Motivation

No existing site covers this combination. The resources reviewed (March 2026):

| Resource | Limitation |
|----------|------------|
| [ARDA — Christianity family tree](https://www.thearda.com/world-religion/family-trees?F=120&W=1), [Judaism family tree](https://www.thearda.com/world-religion/family-trees?W=1&F=122) | Dated interface; no people; no links between religions. |
| [Truth for Saints — Denomination flowchart](https://truthforsaints.com/world-religions/christianity/christian-denominations/family-tree-flowchart/) | Static flowchart; not clickable. |
| [Family Tree of Religions (maps-and-tables)](https://maps-and-tables.neocities.org/religion_tree) | Static image; not interactive. |
| [viz.bible](https://viz.bible) | Biblical genealogy only. |
| UsefulCharts | Printed posters, not a web application. |

A "World Religions Tree" [shared on Hacker News in 2015](https://news.ycombinator.com/item?id=9521186)
was criticized for inaccuracies, and commenters noted that the task requires
considerable expertise. Accuracy and sourcing are therefore central requirements.

## 3. Functional Requirements

### 3.1 Content

- **RH-1** A page for each religion (Christianity, Judaism, Islam, Buddhism and others).
- **RH-2** Intersection pages that show what religions share (for example the common origin of the Abrahamic religions).
- **RH-3** Person nodes such as Abraham, Moses, Jesus, Paul, Muhammad and Martin Luther.
- **RH-4** Denominations and historical splits, such as the Great Schism, the Reformation and the ecumenical councils.
- **RH-5** A time dimension (from antiquity to the present), so that diagrams can be filtered or laid out by period.

### 3.2 Diagrams

- **RH-6** Nodes (people, concepts, denominations, events) and edges (relation, influence, split) are shown on a full-screen, modern canvas.
- **RH-7** Hovering or tapping a node shows its description; clicking opens its detail page.
- **RH-8** Sub-branches can be collapsed and expanded.
- **RH-9** Every diagram and node has a shareable link; diagrams can be embedded in other pages.

### 3.3 Note-taking

- **RH-10** The user writes what they learned in natural language and the system turns it into nodes and edges ("say it, and it becomes a diagram").
- **RH-11** Notes and diagram nodes produce review cards automatically.

## 4. Version Plan

### V1 — Diagram editor

No AI integration; a pure visual diagram tool.

1. **Create diagrams** with movable nodes, similar to draw.io but with richer visuals.
2. **Hover descriptions**: hovering over a node shows its description.
3. **Open a page on click**: clicking a node opens its detail page.
4. **JSON export** of the whole diagram.

### V2 — AI integration and review system

AI is optional.

1. **AI chat to diagram or note**: text written in a chat is turned into a diagram or a short note.
2. **Card box with spaced repetition**: created notes go into a box and are listed as cards. When the user is idle, review starts from the oldest card. Reviewed cards are marked with a swipe or a similar gesture.

### V3 — Daily goal

1. **Daily review goal**: the user sets how many cards to review each day.

### V4 — Diagram and spaced repetition combined

1. **Diagram nodes are cards**: nodes join the review system.
2. **Progress on the diagram**: learned nodes turn green; nodes not reviewed for a long time turn red.
3. **Two ways to review**: from the diagram and from the regular card review screen.

## 5. Technical Notes

- Data model: nodes (person, concept, denomination, event) and edges (relation, influence, split), shared with the History Journeys entity graph.
- Candidate diagram libraries: D3.js, React Flow, vis.js.
- Review cards can be generated automatically from diagram nodes.
- Sharing: slug-based URLs and embed support.
