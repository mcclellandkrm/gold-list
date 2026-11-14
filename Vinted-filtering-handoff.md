# Gold List / Sleeper List: Vinted Filtering Handoff

## Purpose of this handoff

Karl McClelland wants Claude, who helped build the original app, to take over a small Vinted-search enhancement. This document records the goal, supplied code structure, attempted implementations, observed failures, and current state. It is not a claim that the integration has been fixed or tested successfully.

## 1. The actual goal

Karl uses the list to find worthwhile used hardware. He wants to choose an item when he has spare time, open a broad Vinted search, and cut through noisy results to find relevant listings, including bargains where a seller has omitted or imperfectly described the model.

Examples discussed:
- Kindle Paperwhite 10th generation, using aliases such as `10th`, `pq94wif`, `gen 10`, and `paperwhite 4` (user-supplied matching terms; verify identifiers before treating them as authoritative).
- ThinkPad L14 Gen 3, with aliases such as `Gen 3`, `Gen3`, `3rd Gen`, `3rd Generation`, `Generation 3`.
- A vaguely described EliteBook potentially priced £40 below a better-described equivalent. This was an illustration of the opportunity, not a verified listing.
- Rode Wireless GO, used for the failed new-filter test.

Karl's framing: “It's not going to make the tea.” The goal is a practical hunting aid, not a complete scraper, guaranteed model identification, or a perfect catalogue.

### Important matching principle

Do not discard uncertain listings too aggressively. An incomplete title can be precisely where the bargain is. Missing generation information is not proof of a wrong model. Any improved system should keep a way to see uncertain and all results.

## 2. App and supplied source

Live URL: https://gold-list.netlify.app/

The assistant attempted to retrieve the site and `/data/items.json`, but its fetch tool failed. Karl could access the app normally and pasted the source. Do not interpret those tool failures as evidence that the site is broken.

### Naming ambiguity

Although Karl calls the application Gold List, the supplied HTML has:
- `<title>The Sleeper List</title>`
- `<h1>The Sleeper List</h1>`
- Introductory copy explicitly distinguishing this list from Gold List.

Karl confirmed everything is in the app at the URL above. Inspect the actual repository structure rather than renaming pages or assuming only one list exists.

### Supplied page structure

The page is a static HTML application with embedded CSS and JavaScript. It has:
- `#grid`, containing generated `.entry` product cards.
- `.entry h2` for each product's name.
- `#search`, category pills, price tiers, and a shortlist filter.
- A `.links` section per card with eBay sold/live, Facebook Marketplace and Gumtree links.
- An `a.sold` link containing the search phrase in the `_nkw` query parameter.
- `render()` rebuilding `grid.innerHTML` after filtering or shortlisting.
- `boot()` fetching `data/items.json` with `{ cache: "no-store" }`.
- Shortlist saved in localStorage under `sleeperShortlist`.

Existing helpers include `soldUrl(q)`, `liveUrl(q)`, `fbUrl(q)`, `gumUrl(q)`, and `esc(s)`.

The data loader accepts either an array or an object containing `items`. The pasted data envelope begins:

```json
{
  "updated": "2026-11-07",
  "note": "Prices are working estimates for the UK private-sale market, not quotes. Re-check against eBay sold listings before offering.",
  "items": []
}
```

Each item uses fields including:

```json
{
  "id": "lumix-s5ii",
  "name": "Panasonic Lumix S5 II / S5 IIX",
  "q": "Panasonic Lumix S5 II",
  "cat": "Cameras",
  "year": "2023",
  "was": "£1,799",
  "now": "£900 – £1,150",
  "drop": "−42%",
  "verdict": "keep",
  "spec": "...",
  "flop": "...",
  "catch": "...",
  "why": "..."
}
```

Other sample entries supplied:
- `mavic-3-classic`: DJI Mavic 3 Classic.
- `mini-pc-ryzen`: Minisforum UM790 Pro / Beelink SER8; existing `q` only covers Minisforum UM790 Pro mini PC.
- `dell-ultrasharp-ipsblack`: Dell UltraSharp U2723QE / U3223QE; existing `q` only covers U2723QE.

Only a partial sample of the JSON was pasted, ending with a trailing comma. It was not a complete replacement data file. Preserve the repository's actual data.

Multi-model cards need care: splitting `Panasonic Lumix S5 II / S5 IIX` mechanically does not produce complete alternative model names. Do not assume `q` covers every model on a card or infer verified aliases automatically.

## 3. Original bookmark: the useful baseline

Karl first ran a normal Vinted search, scrolled to the bottom to load results, then ran a bookmarklet. Its prompt accepted comma-separated alternatives, hid nonmatches, outlined matches and added title badges.

Screenshot evidence showed yellow title badges on a Vinted results page. Karl considered the result useful, despite limitations. We did not fully establish whether every original card was hidden or highlighted correctly, so treat it as the user-reported useful baseline, not a thoroughly verified implementation.

### Original code as supplied by Karl

The mixed percent-encoding below is preserved from the pasted bookmark URL:

```javascript
javascript:(function(){const query=prompt('Filter listings containing:','10th, pq94wif, gen 10, paperwhite 4');if(query===null)return;const terms=query.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);const links=Array.from(document.querySelectorAll('a[href*="/items/"]'));const cards=new Map();links.forEach(a=>{const box=a.closest('[data-testid*="item"], [class*="item-box"], [class*="feed-grid__item"]')||a.parentElement;if(box&&!cards.has(box)){cards.set(box,a);}});let matched=0;cards.forEach((link,box)=>{const title=link.getAttribute('title')||link.querySelector('[title]')?.getAttribute(%27title%27)||%27%27;const alt=link.querySelector(%27img%27)?.getAttribute(%27alt%27)||%27%27;const fullText=(box.innerText+%27 %27+title+%27 %27+alt).toLowerCase();const isMatch=terms.length===0||terms.some(t=>fullText.includes(t));if(!isMatch){box.style.display=%27none%27;}else{box.style.display=%27%27;box.style.outline=%273px solid #00a8a8';matched++;if(title&&!box.querySelector('.v-badge')){const badge=document.createElement('div');badge.className='v-badge';badge.innerText=title;badge.style.cssText='font-size:11px;font-weight:600;color:#111;background:#fff3cd;padding:4px 6px;margin:4px 0;border-radius:4px;border:1px solid #ffeeba;line-height:1.2;';box.prepend(badge);}}});alert(%60Showing ${matched} matching items out of ${cards.size} total.%60);})();
```

### Original behaviour and limits

- Uses OR substring matching: `terms.some(t => fullText.includes(t))`.
- Searches selected card `innerText`, link title/nested title, and image alt text.
- Does not fetch full descriptions or inspect photos.
- Does not verify hardware identity.
- Processes elements loaded when run; no automatic handling of later results.
- Generic terms like `10th` can retain a basic Kindle as well as Paperwhite.
- Card selection is broad and has a risky `a.parentElement` fallback.
- It inserts `.v-badge` title labels into the DOM; these can become searchable text in later runs.

## 4. Approaches discussed but NOT implemented successfully

Karl initially pasted a specification proposing a Netlify function at `/.netlify/functions/vinted`, acquiring an anonymous Vinted session and fetching catalog results for strict filtering.

This approach was later set aside. The practical first version does not need an API proxy or server-side scraper. No Vinted serverless function was delivered in this conversation.

The assistant made inconsistent/unverified claims about whether Vinted catalog APIs are still available. Do not use this conversation as authoritative evidence about current Vinted endpoints, access policies, bot protection or legal permissions. Verify independently only if returning to that architecture.

## 5. First delivered add-on: what it attempted

File: `gold-list-vinted.js`.

HTML integration, added by Karl after the existing application script:

```html
<script src="gold-list-vinted.js" defer></script>
```

The add-on used a MutationObserver on `#grid` with `{ childList: true }` to attach a `<details class="gl-hunt">` panel to every rendered `.entry`.

The first UI contained:
- Vinted search.
- Family/model alternatives.
- Target generation/model aliases.
- Optional exclusions.
- Open Vinted.
- Copy filter settings.
- Gold List filter bookmark link.
- Copy filter script.

Settings were JSON, for example:

```json
{"goldList":1,"family":"Rode Wireless GO ()","aliases":"gen 1, gen1, generation 1","exclude":""}
```

The empty parentheses came from removing the generation text from the product name. This was an undesirable default-generation artifact.

The bookmark installed a fixed panel on Vinted with fields, Matches/Possible matches/Show all buttons, a report, and Close and restore all.

### First runtime card collection logic

```javascript
const box = a.closest(
  '[data-testid="grid-item"], [data-testid="item-box"], .feed-grid__item, [class*="feed-grid__item"], [class*="item-box"]'
) || a.parentElement;
```

It used text plus title/alt attributes, normalised punctuation to spaces, and whole-word/phrase matches. Nonmatches were hidden using `box.style.display = 'none'`; matches got an inline outline. Original inline display/outline values were saved and restored.

### Intended classifications

- Family + target alias -> match.
- Family but no target alias -> possible.
- Target alias but missing family -> possible.
- Explicit exclusions -> other/excluded.
- With family provided and no target aliases, family matches -> match.
- Other/excluded was a count only, not a separate clickable view.

## 6. Deployment and browser setup that DID work

Karl is using Chrome and VS Code. The Netlify project is linked to a GitHub repository.

Karl successfully:
1. Saved the add-on and added the HTML script line.
2. Committed/synchronised changes through VS Code Source Control.
3. Saw the Vinted hunting-tools sections on the live app.
4. Created a bookmark called Gold List Filter via `chrome://bookmarks`, adding a bookmark and pasting the copied JavaScript into its URL.
5. Opened Vinted results for Rode Wireless GO.
6. Clicked the bookmark and saw the new filter panel.
7. Copied JSON settings from Gold List into the first panel field, which populated the fields.

The installation workflow was explained poorly and created confusion. Karl initially thought settings JSON belonged in Vinted's search bar, and thought the bookmark link should be dragged into the Vinted window. Avoid repeating those instructions. Prefer the original simple prompt workflow.

## 7. Observed failure on Vinted

Rode Wireless GO test:
- With `Wireless GO` and generation aliases, counts included 0 matches / 15 possible / 83 other.
- After blanking the target aliases, counts became 15 matches / 0 possible (with 83 other).
- Clicking the actual Matches button did not visibly shorten the page or show teal outlines.
- Listings became unclickable.
- Clicking Close and restore all restored listing clickability.

Karl explicitly confirmed that he was clicking the real view button, not the count report.

### Diagnosis: plausible, NOT verified

The runtime likely selected and hid an overlay/clickable layer rather than the outer listing card, leaving the pictures/layout visible but removing clickable links.

This fits the symptoms but was never verified against the live DOM. No DOM sample or screenshot of the failed runtime was obtained. Do not state the exact root cause as established fact.

## 8. Second add-on: untested defensive revision

A defensive replacement was generated and attached, but was NOT confirmed deployed or tested.

It removed the generic parent fallback and only accepted ancestors matching:

```javascript
'[data-testid="grid-item"], .feed-grid__item'
```

It additionally required an image, visible currency/price text, one distinct item URL, and bounded dimensions. Unsupported containers were left untouched.

This was not a verified fix and introduced heuristic constraints that may reject legitimate cards. Karl asked whether the approach had become overcomplicated. The agreed direction was to abandon this experimental panel for now and return to the original bookmark workflow.

## 9. Latest supplied file: simplified rollback

The MOST RECENT `gold-list-vinted.js` attachment is a simplified app-side helper, not the defensive filter revision.

It includes only:
- An editable Vinted search input.
- An editable comma-separated matching-terms input.
- Open Vinted.
- Copy matching terms.
- Short instructions to use the ORIGINAL bookmark and paste terms into its prompt.

It does NOT contain:
- A Vinted runtime/filter panel.
- JSON settings transfer.
- Matches/possible classification.
- Bookmark installation links or a generated replacement bookmarklet.
- A Vinted API proxy.

It attaches per-card UI with a MutationObserver, uses the eBay sold link's `_nkw` query to initialise the Vinted search, and initialises terms by splitting the card name at `/`.

Known limitations:
- Splitting slash-separated names produces incomplete aliases (e.g. S5 IIX by itself). Users must edit terms.
- Full product-name terms can be too restrictive for poorly described listings.
- No persistence of edited terms was added; the UI rebuilds on app render.
- It has not been confirmed deployed or tested.
- Replacing the app-side file does not update or delete Chrome's saved experimental bookmark. Karl should use the ORIGINAL useful bookmark, not the later panel bookmark.

Karl said he would save and push the simplified file, then said he would try it later. There was no subsequent confirmation of deployment or testing. Inspect the repository and live page to establish the current version; do not assume which attachment is installed.

## 10. Recommended next steps for Claude

1. Inspect the actual repository, current deployed add-on and page/list structure.
2. Preserve current catalogue data, shortlist storage, styling and non-Vinted links.
3. Establish the smallest useful workflow first: normal Vinted search, copy plain terms, original bookmark prompt.
4. Ask Karl which original bookmark is saved if needed; avoid confusing it with today's experimental panel bookmark.
5. If changing listing filtering, first verify the live DOM of a complete result card. Identify the outer layout card, not its anchor or overlay. Use a DOM sample from Karl only if needed, with short exact instructions.
6. Test on a small set before changing all loaded cards. Include a restoration path, and verify link clickability after filtering and after restoration.
7. If a card cannot be safely identified, do not modify it. Report that limitation rather than implying complete coverage.
8. Only add uncertainty classification or alias dictionaries after the baseline works, if Karl still wants them.
9. Do not add a scraper/proxy unless there is a separate reason and access has been validated.

### Acceptance criteria

- Existing app and shortlist still work.
- Vinted opens the intended broad search.
- Copy button copies plain usable terms, not unexplained settings JSON.
- Original/simple bookmark workflow remains understandable.
- If filtering is improved, nonmatches are hidden as WHOLE cards.
- Visible listings remain clickable.
- Restoration returns cards and clickability.
- Results loaded later can be handled by an explicit rerun.
- No claim to full-description matching or hardware verification unless actually implemented.
- Uncertain listings remain recoverable.

## 11. Communication preferences and lessons

Karl prefers practical progress and short, sequential instructions. He is capable of saving files, editing HTML in VS Code, committing/syncing Git changes and deploying through the linked Netlify/GitHub workflow, but browser setup terminology needs to be concrete.

- Give one short action or small group of actions, then check the result.
- Explain exactly which tab, field or button is meant.
- Never tell him to paste code/settings into a normal search box.
- Clearly distinguish “copy matching terms,” “copy settings JSON,” and “copy bookmark code.” Prefer removing unnecessary distinctions.
- Do not make him repeat steps when evidence points to a code defect.
- Do not promise background work: the assistant does not continue working between messages.
- Distinguish generated code from tested working functionality.

Karl's final position: he was simply trying to make something already useful even better. Keep the improvement proportional to that goal.

## 12. Missing information / uncertainties

- Full repository and complete item data were not supplied in this conversation.
- Actual Vinted DOM structure was not inspected directly.
- No live browser execution test was performed by the assistant.
- Current deployed add-on revision and current Chrome bookmark contents are unconfirmed.
- Model identifiers and alias equivalences were not independently verified.
- Exact cause of the overlay/card-selection failure remains a hypothesis.

End of handoff.
