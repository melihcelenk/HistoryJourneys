# Content Generation Rule Set

**Version:** 0.1.0 (2026-11-24)

This rule set governs every card generated for History Journeys (requirements
CG-1 to CG-8). Each owner intervention becomes a new rule or example here, the
version is bumped, and affected cards are regenerated.

## 1. Language and tone

- R1. Content is written in Turkish, in plain modern language a curious
  high-school student understands. No academic jargon, no filler.
- R2. Names use the established Turkish form (*Fatih Sultan Mehmed*, *I. Ahmed*).

## 2. Summary

- R3. A summary is exactly three sentences, written for recall, not completeness.
- R4. Each sentence carries one concrete, memorable fact (a place, a number, a
  first, a turning point). No sentence is a list of achievements.
- R5. The first sentence says who the figure is and when; the last one says why
  the figure matters for what comes next.

## 3. Actions, causes and consequences

- R6. A card has two to four actions. An action is one thing the figure did,
  stated in one short sentence with a verb in the past tense.
- R7. Every action has a **cause** (why it happened: the situation before it)
  and a **consequence** (what changed after it). Each is two to four sentences
  and names concrete people, places and years.
- R8. Prefer actions that connect to other figures on the site, so that causes
  and consequences become links between cards.

## 4. Simple first, deeper on demand (D5, FR-27)

- R9. State a fact in its simplest memorable form on the card, the way schools
  first teach that water boils at 100 °C.
- R10. When the simple form leaves out something a historian would insist on
  (a change that took decades, other contributors, a disputed interpretation),
  put that in the action's `depth` note. Never put it in the summary.
- R11. Contested interpretations are attributed in the `depth` note ("Bazı
  tarihçilere göre …"), not stated as fact (CG-7).

## 5. Links

- R12. Mention other figures and concepts with link markup:
  `[[f:slug|görünen metin]]` for a figure, `[[c:slug|görünen metin]]` for a
  concept. Link a target at most once per text field. Only slugs that exist in
  the figure list or in a `concepts` array may be linked.
- R13. Where a card contains an interesting word (a title, a term, a borrowed
  word), define it as a concept with its origin and related words (FR-5).

## 6. Sources (CG-8, DR-5)

- R14. Every figure cites at least two independent, reliable sources. Preferred:
  TDV İslâm Ansiklopedisi, Encyclopaedia Britannica, academic chronologies;
  Wikipedia is acceptable as a second source.
- R15. Every action lists the ids of the sources that support it. A statement
  that cannot be supported is not written.
- R16. Text is never copied from a source; cards are written in new words.

## 7. Journey

- R17. A journey is the figure's life as dated stops, in chronological order,
  three to eight stops. Each stop has a place with coordinates, a year range,
  one sentence on what happened there, and a location precision.
- R18. Places carry the present-day Turkish name and, where different, the
  historical name (*Selanik* / *Thessaloniki*, *Edirne* / *Adrianopolis*).
- R19. A place that already exists in `content/places-registry.md` is reused
  with the same slug and coordinates.
