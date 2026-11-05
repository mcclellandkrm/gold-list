# The Sleeper List

A buyer's list of hardware that is still high spec but sells cheap, because it was
marketed badly or because owners abandon it. Deployed as a static page on Netlify.

## Structure

- `index.html` — the whole page: styles, markup, behaviour. No build step, no dependencies.
- `data/items.json` — the entries. This is the file that changes.

The split is deliberate. Prices are expected to drift, and keeping them in their own
file means each monthly commit is a readable diff instead of noise inside markup.
Over time the git history of `data/items.json` becomes a price series: run
`git log -p data/items.json` to see how any item has moved.

## The monthly update

Only three things should change on a normal month:

1. **New entries.** Gear that has just crossed into the window: roughly 18 months
   past launch, still competitive on spec, and sold badly enough that nobody is
   searching for it.
2. **Price drift.** Re-check the `now` band against eBay *sold* listings, not live
   listings. Live listings are asking prices and run high.
3. **Strike-offs.** Anything that has bottomed out, lost software support, or turned
   out to be a trap rather than a sleeper.

Bump `updated` at the top of `items.json` whenever prices are re-checked. The page
displays it, so a stale list announces itself.

## Reading the verdicts

| Verdict | Meaning |
|---|---|
| `keep` | Value is in owning it. Resale will be slow. |
| `flip` | Enough residual demand to move it on inside a fortnight. |
| `biz` | Earns its keep rather than sitting on a shelf. |
| `trap` | The discount is real and so is the reason for it. Listed as a warning. |

## The test

A steep discount means nothing on its own. Ask whether the thing was **ignored** or
**rejected**. Ignored means good hardware nobody was told about, and the discount is
free money. Rejected means buyers tried it and said no, and the discount is the market
being right. The Galaxy S25 Edge entry exists to hold that distinction in place.

## Local preview

`fetch` is blocked on `file://`, so double-clicking `index.html` will not load the data.
Run a server instead:

    python -m http.server 8000

Then open http://localhost:8000
