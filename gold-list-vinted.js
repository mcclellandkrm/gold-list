(() => {
'use strict';
const runtime = function () {
 if (!/(^|\.)vinted\.co\.uk$/.test(location.hostname)) { alert('Open your Vinted UK results first, then click this bookmark.'); return; }
 const old=document.getElementById('gl-filter-panel'); if(old){old.scrollIntoView();return;}
 const panel=document.createElement('section');panel.id='gl-filter-panel';
 panel.style.cssText='position:fixed;top:12px;right:12px;z-index:2147483647;background:#fff;color:#172326;border:2px solid #0b5e66;padding:14px;width:min(360px,92vw);max-height:85vh;overflow:auto;box-shadow:0 5px 30px #0004;font:14px Arial,sans-serif;border-radius:6px';
 panel.innerHTML='<strong>Gold List filter</strong><p>Searches loaded card text, not full descriptions. Missing details stay possible.</p><label>Family / model (comma-separated alternatives)<input id="gl-family" placeholder="L14" style="display:block;width:100%;margin:5px 0 10px"></label><label>Target aliases (comma-separated alternatives)<input id="gl-target" placeholder="Gen 3, Gen3, 3rd generation" style="display:block;width:100%;margin:5px 0 10px"></label><label>Optional exclusions (whole words / phrases)<input id="gl-exclude" placeholder="Leave blank to start" style="display:block;width:100%;margin:5px 0 10px"></label><div id="gl-buttons"><button data-view="matches">Matches</button> <button data-view="possible">Possible matches</button> <button data-view="all">Show all</button></div><p id="gl-status" aria-live="polite">Paste the settings copied from Gold List into the first box, or enter terms manually.</p><button id="gl-close">Close and restore all</button>';
 document.body.append(panel);
 const family=panel.querySelector('#gl-family'),target=panel.querySelector('#gl-target'),exclude=panel.querySelector('#gl-exclude'),status=panel.querySelector('#gl-status');
 const saved=new Map();
 const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const terms=s=>s.split(',').map(norm).filter(Boolean);
 const contains=(text,t)=>(' '+text+' ').includes(' '+t+' ');
 function restore(){saved.forEach((s,b)=>{b.style.display=s.display;b.style.outline=s.outline;});}
 function importSettings(){try{const p=JSON.parse(family.value);if(p.goldList===1){family.value=p.family||'';target.value=p.aliases||'';exclude.value=p.exclude||'';status.textContent='Settings loaded. Choose a view.';}}catch(e){}}
 family.addEventListener('input',importSettings);
 function collect(){
 const cards=new Map();
 document.querySelectorAll('a[href*="/items/"]').forEach(a=>{
 if(panel.contains(a))return;
 const box=a.closest('[data-testid="grid-item"], [data-testid="item-box"], .feed-grid__item, [class*="feed-grid__item"], [class*="item-box"]')||a.parentElement;
 if(!box||box===document.body||box.contains(panel)||cards.has(box))return;
 const extras=Array.from(box.querySelectorAll('[title],img[alt]')).map(n=>(n.getAttribute('title')||'')+' '+(n.getAttribute('alt')||'')).join(' ');
 cards.set(box,norm((box.textContent||'')+' '+extras+' '+(a.getAttribute('title')||'')));
 });return cards;}
 function apply(view){importSettings();restore();const fs=terms(family.value),ts=terms(target.value),xs=terms(exclude.value);let m=0,p=0,o=0;
 collect().forEach((text,box)=>{
 if(!saved.has(box))saved.set(box,{display:box.style.display,outline:box.style.outline});
 const f=fs.length&&fs.some(t=>contains(text,t));const t=ts.length&&ts.some(t=>contains(text,t));const x=xs.some(t=>contains(text,t));
 const kind=x?'other':(fs.length?(f?(ts.length?(t?'matches':'possible'):'matches'):(t?'possible':'other')):(ts.length?(t?'matches':'possible'):'possible'));
 if(kind==='matches')m++;else if(kind==='possible')p++;else o++;
 if(view!=='all'){if(kind!==view)box.style.display='none';else box.style.outline=kind==='matches'?'3px solid #0b8b82':'3px solid #bc8b31';}
 });status.textContent=m+' matches · '+p+' possible · '+o+' other/excluded. View: '+view+'. Load more listings, then click a view again. These are text matches, not verified models.';}
 panel.querySelector('#gl-buttons').addEventListener('click',e=>{if(e.target.dataset.view)apply(e.target.dataset.view);});
 panel.querySelector('#gl-close').onclick=()=>{restore();panel.remove();};
};
const bookmark='javascript:'+encodeURIComponent('('+runtime.toString()+')()');
const style=document.createElement('style');style.textContent='.gl-hunt{border:1px solid var(--line,#ddd);padding:12px;font:12px var(--mono,monospace);margin-top:10px}.gl-hunt summary{cursor:pointer;color:var(--accent,#0b5e66);font-weight:600}.gl-hunt label{display:block;margin-top:10px}.gl-hunt input{display:block;width:100%;box-sizing:border-box;padding:7px;margin-top:3px;background:var(--card,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd)}.gl-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.gl-actions a,.gl-actions button{font:inherit;padding:6px 8px;border:1px solid var(--line,#ccc);background:transparent;color:var(--accent,#0b5e66);cursor:pointer;text-decoration:none}.gl-note{font-size:11px;line-height:1.5;color:var(--muted,#555)}';document.head.append(style);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function copy(text,out){try{await navigator.clipboard.writeText(text);out.textContent='Copied.';}catch(e){window.prompt('Copy this text:',text);out.textContent='Copy from the dialog above.';}}
function defaults(name){
 const first=name.split('/')[0].trim();const gen=first.match(/(?:gen(?:eration)?\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*gen(?:eration)?)/i);
 return {family:gen?first.replace(gen[0],'').trim():first,aliases:gen?'gen '+(gen[1]||gen[2])+', gen'+(gen[1]||gen[2])+', generation '+(gen[1]||gen[2]):''};
}
function enhance(){document.querySelectorAll('#grid .entry').forEach(card=>{
 if(card.querySelector('.gl-hunt'))return;
 const name=card.querySelector('h2')?.textContent||'';let q=name;
 const ebay=card.querySelector('a.sold');try{q=new URL(ebay.href).searchParams.get('_nkw')||name;}catch(e){}
 const d=defaults(name);const box=document.createElement('details');box.className='gl-hunt';
 box.innerHTML='<summary>Vinted hunting tools</summary><label>Vinted search<input data-field="search" value="'+esc(q)+'"></label><label>Family / model alternatives<input data-field="family" value="'+esc(d.family)+'"></label><label>Target generation / model aliases<input data-field="aliases" value="'+esc(d.aliases)+'" placeholder="Optional: Gen 3, Gen3, 3rd generation"></label><label>Optional exclusions<input data-field="exclude" placeholder="Leave blank to keep the search broad"></label><div class="gl-actions"><a data-open target="_blank" rel="noopener noreferrer">Open Vinted</a><button type="button" data-copy>Copy filter settings</button><a data-install>Gold List filter</a><button type="button" data-script>Copy filter script</button></div><p class="gl-note">One-time desktop setup: drag “Gold List filter” to your bookmarks bar. Open Vinted, scroll to load listings, click the saved bookmark, then paste copied settings into its first box. Choose Matches or Possible matches. Show all restores the loaded cards.</p><p class="gl-note">Edit terms before copying. Commas mean alternatives, not requirements. Multi-model cards need your choice of model. Only loaded card text is checked; descriptions and photos are not inspected.</p><p class="gl-note" data-status aria-live="polite"></p>';
 const field=k=>box.querySelector('[data-field="'+k+'"]');const out=box.querySelector('[data-status]');
 const link=box.querySelector('[data-open]');const update=()=>{link.href='https://www.vinted.co.uk/catalog?search_text='+encodeURIComponent(field('search').value);};update();field('search').addEventListener('input',update);
 box.querySelector('[data-install]').href=bookmark;
 box.querySelector('[data-install]').addEventListener('click',e=>{e.preventDefault();out.textContent='Drag this link to your bookmarks bar; then click the saved bookmark while viewing Vinted.';});
 box.querySelector('[data-copy]').onclick=()=>copy(JSON.stringify({goldList:1,family:field('family').value,aliases:field('aliases').value,exclude:field('exclude').value}),out);
 box.querySelector('[data-script]').onclick=()=>copy(bookmark,out);
 card.append(box);
 });}
const grid=document.getElementById('grid');if(grid){new MutationObserver(enhance).observe(grid,{childList:true});enhance();}
})();
