# ADR 0001: Data‑driven Cases content via manifest + HTML snippets

- Status: Accepted
- Date: 2025-10-03
- Decision Makers: VT Web
- Related: `official.cc.v1/index.html` (#cases only), `official.cc.v1/cases/index.json`, `official.cc.v1/cases/case-*.html`

## Context

We want the Cases section to be easy to maintain and expand without touching layout code, while strictly limiting changes to `<section class="section" id="cases">`.

Constraints and observations:
- Static hosting, client‑only JavaScript available.
- Browsers cannot list directory contents for security; client code must know what to fetch.
- Same‑origin policy applies: content must be served over HTTP(S) from the same origin.
- Accessibility and keyboard support must remain intact; current page already supplies modal and carousel behavior.

## Decision

Adopt a manifest‑driven approach:
- A small JSON manifest (`cases/index.json`) enumerates the available cases with compact metadata used for cards (title, summary, tags) and a pointer to a per‑case HTML snippet.
- Each case’s full content lives in a separate HTML snippet file (`cases/case-<id>.html`) designed to be injected into the existing modal.
- The Cases section script fetches the manifest, renders the cards dynamically, and fetches the corresponding HTML on demand when a card is opened. Prefetch on hover is used to improve perceived performance.
- Only code inside `#cases` is modified; global styles and scripts remain unchanged.

## Details

Manifest shape (`cases/index.json`):
```
[
  {
    "id": "case-1",
    "title": "Senior Android Engineer — Fintech",
    "summary": "Filled in 2 weeks after 6 months stalled search; stabilized market data updates and improved wallet reliability.",
    "tags": ["Android", "Kotlin", "Fintech", "Mobile", "CI/CD"],
    "contentPath": "cases/case-1.html"
  },
  ...
]
```

Per‑case snippet (HTML):
- A small, self‑contained fragment (e.g., `<h3>`, paragraphs, lists). No `<html>/<head>/<body>` wrappers.
- Example: `cases/case-1.html` contains sections like About, Challenge, What we did, Results.

Runtime behavior (inside `#cases`):
- On load, fetch `cases/index.json`, render one card per entry.
- On card click/Enter/Space, fetch `contentPath`, inject into the existing modal’s `.modal-content`, then open the modal.
- Prefetch on hover/touch; cache the fetched HTML per card for snappy subsequent opens.
- Carousel nav buttons remain functional using the existing global listeners.

Accessibility:
- Cards are focusable (`tabindex=0`), with `aria-label` for screen readers.
- The modal remains labelled via a visually hidden `#modal-title` element present in the section.

Error handling:
- If the manifest fetch fails, the section shows a subtle inline error message.
- If an individual HTML snippet fails to load, the modal shows a friendly fallback message.

Security:
- Snippets are trusted, same‑origin HTML authored within the repo. Because we use `innerHTML`, do not source untrusted content.

## Alternatives considered

1) Hard‑coded cards and hidden content in the page
- Pros: No network fetches, simplest to implement.
- Cons: Content edits require touching markup; less maintainable; larger HTML; violates desire to separate content.

2) Directory listing from the client
- Not viable on the open web: browsers don’t allow listing files in a folder without server support.

3) Server endpoint that returns a list
- Pros: No manifest to maintain.
- Cons: Requires server logic; out of scope for static hosting.

4) Markdown + client‑side renderer
- Pros: Nicer authoring.
- Cons: Adds JS bundle size/complexity; still needs a manifest or server endpoint.

5) Single JSON with full case content embedded
- Pros: Single request.
- Cons: Large JSON; mixing markup and data; less cache‑friendly per case; still requires updating the JSON to add cases.

## Consequences

Positive:
- Content is decoupled from layout; adding or editing cases doesn’t change template code.
- Small, cacheable per‑case assets; faster first open after prefetch.
- Stays within the “modify #cases only” constraint.

Trade‑offs / Caveats:
- Requires serving over HTTP(S) (not `file://`) for `fetch`.
- Manifest must be kept in sync with snippet files.
- Injecting HTML requires trusted inputs (repo‑controlled content only).
- Case detail HTML isn’t SSR‑rendered in the page, so search engines may not index full content unless they execute JS.

## Implementation

Files and paths:
- Manifest: `official.cc.v1/cases/index.json`
- Snippets: `official.cc.v1/cases/case-1.html` … `case-4.html`
- Loader: Inline script inside `#cases` within `official.cc.v1/index.html` (no global changes).

Maintenance workflow (add a new case):
1) Create a new snippet, e.g. `cases/case-5.html` with the full content.
2) Add an entry to `cases/index.json` with `id`, `title`, `summary`, `tags`, `contentPath`.
3) Reload the page; the new card appears automatically and the modal loads the snippet.

## Testing & verification

Local testing (static server):
```
cd official.cc.v1
python3 -m http.server 5173
```
- Visit http://localhost:5173
- Confirm cards are visible; click a card to open the modal; verify keyboard (Tab, Enter/Space) works.
- Turn off the network (or rename a snippet) to observe error fallbacks.

## Rollback plan

- Revert the `#cases` section to the previously hard‑coded cards and hidden details (git revert or restore from history). The manifest/snippets can remain unused or be removed.

## Future work

- Optional Markdown support with a small, deferred client‑side renderer for nicer authoring.
- Simple script or build‑time tool to generate `index.json` and snippets from raw source (txt/MD), reducing manual steps.
- Pre‑render / static export for SEO if deep indexing of case details is desired.
- Analytics hooks for card opens and case interest tracking.

