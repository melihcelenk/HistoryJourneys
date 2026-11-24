# Brief for content generation agents

You write figure content files for History Journeys, a history learning game.
Work only inside `content/figures/`. Do not touch any
other file, do not run git commands, do not install anything.

## Read first

1. `content/rules/RULESET.md` (the rules; follow every one).
2. `content/figures/ahmed-i.json` (the reference example; match its shape, tone and depth exactly).
3. `content/places-registry.md` (reuse these place slugs and coordinates).
4. `content/relation-types.json` (allowed relation types).
5. `src/domain/contentSchema.ts` (the schema your files must satisfy).

## Output

One file per figure: `content/figures/<slug>.json`, UTF-8, valid JSON, Turkish
text with correct Turkish characters. Fields exactly as in the example.

- `summary`: exactly 3 sentences (rules R3-R5).
- `actions`: 2 or 3 actions, each with `cause`, `consequence` (2-4 sentences
  each, concrete people, places, years) and, where the simple statement hides
  something, a `depth` note (rules R9-R11). At least one action per figure has
  a `depth` note.
- `journey`: 3 to 6 stops in chronological order, real coordinates.
- `relations`: relations to OTHER figures in the full figure list below, using
  only the types child_of, sibling_of, spouse_of, served_under, taught,
  influenced, opposed, deposed. Do NOT write `succeeded` relations; succession
  between sultans is generated from the line definition. The relation reads
  "<this figure> <type> <to>": e.g. in ahmed-i.json `{"to":"mehmed-iii","type":"child_of"}`
  means Ahmed I is the child of Mehmed III; `served_under` means this figure
  served under `to`; `taught` means this figure was the teacher of `to`;
  `deposed` means this figure deposed `to`. Write each relation in one file
  only (the file of the "from" figure). Give every figure at least one
  relation; non-sultans need two or more, because relations are what routes
  between figures are computed from. Only state relations that are historically
  real and meaningful (no "visited the same city").
- `concepts`: for about half of the figures, one interesting word from the
  card with its origin and related words (rule R13), linked from the text with
  `[[c:slug|text]]`. Concept slugs must be unique and descriptive.
- Link other figures in cause/consequence/depth text with `[[f:slug|text]]`,
  using only slugs from the full figure list.
- `sources`: at least two. Use the TDV İslâm Ansiklopedisi article and the
  Turkish Wikipedia article; verify with curl that each URL returns HTTP 200
  (`curl -s -o /dev/null -w "%{http_code}" -L <url>`). If a TDV URL does not
  exist, use Encyclopaedia Britannica or English Wikipedia instead.
- `generation`: `{ "model": "claude-fable-5-2", "ruleset": "0.1.0", "date": "2026-11-24", "status": "generated" }`.
- `kind`: one of sultan, leader, statesman, soldier, scholar, artist, royal.
- `reign` only for sultans (and for Atatürk as president: 1923-1938).

## Accuracy

Check birth, death and reign years and the key dates of each action against
Turkish Wikipedia before writing, e.g.
`curl -s "https://tr.wikipedia.org/w/index.php?title=I._Ahmed&action=raw" | head -c 6000`.
Do not write anything you cannot support. Never copy sentences from a source.

## Full figure list (slugs)

mehmed-ii, bayezid-ii, selim-i, suleyman-i, selim-ii, murad-iii, mehmed-iii,
ahmed-i, mustafa-i, osman-ii, murad-iv, ibrahim, mehmed-iv, suleyman-ii,
ahmed-ii, mustafa-ii, ahmed-iii, mahmud-i, osman-iii, mustafa-iii,
abdulhamid-i, selim-iii, mustafa-iv, mahmud-ii, abdulmecid, abdulaziz, murad-v,
abdulhamid-ii, mehmed-v, mehmed-vi, ataturk, ismet-inonu, enver-pasa,
namik-kemal, midhat-pasa, mustafa-resid-pasa, alemdar-mustafa-pasa,
aksemseddin, ali-kuscu, cem-sultan, piri-reis, barbaros-hayreddin,
hurrem-sultan, mimar-sinan, sokollu-mehmed-pasa, kosem-sultan, evliya-celebi,
katip-celebi, koprulu-mehmed-pasa, ibrahim-muteferrika

## Finish

Validate every file you wrote parses as JSON
(`node -e "JSON.parse(require('fs').readFileSync('content/figures/<slug>.json','utf8'))"`).
You have about 30 minutes; write all your figures. Report only: the list of
files written and anything you could not verify.
