(() => {
'use strict';
// Simple workflow: normal Vinted search + copyable terms for the original bookmark.
const css=document.createElement('style');
css.textContent='.gl-hunt{border:1px solid var(--line,#ddd);padding:12px;margin-top:10px;font:12px var(--mono,monospace)}.gl-hunt summary{cursor:pointer;color:var(--accent,#0b5e66);font-weight:600}.gl-hunt label{display:block;margin-top:10px}.gl-hunt input{display:block;width:100%;box-sizing:border-box;padding:8px;margin-top:4px;background:var(--card,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd)}.gl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.gl-actions a,.gl-actions button{font:inherit;text-decoration:none;cursor:pointer;padding:7px 9px;border:1px solid var(--line,#ccc);background:transparent;color:var(--accent,#0b5e66)}.gl-note{font-size:11px;line-height:1.5;color:var(--muted,#555)}';
document.head.append(css);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function enhance(){
 document.querySelectorAll('#grid .entry').forEach(card=>{
  if(card.querySelector('.gl-hunt'))return;
  const name=card.querySelector('h2')?.textContent?.trim()||'';
  let search=name;
  try{search=new URL(card.querySelector('a.sold').href).searchParams.get('_nkw')||name;}catch{}
  const terms=name.split('/').map(v=>v.trim()).filter(Boolean).join(', ');
  const box=document.createElement('details');box.className='gl-hunt';
  box.innerHTML='<summary>Vinted hunting tools</summary><label>Vinted search<input data-search value="'+esc(search)+'"></label><label>Matching terms — any one can match<input data-terms value="'+esc(terms)+'"></label><div class="gl-actions"><a data-open target="_blank" rel="noopener noreferrer">Open Vinted</a><button data-copy type="button">Copy matching terms</button></div><p class="gl-note">1. Edit the search and matching terms if needed. Commas separate alternatives. 2. Copy matching terms. 3. Open Vinted and scroll to load listings. 4. Click your ORIGINAL working filter bookmark and paste the terms into its prompt.</p><p class="gl-note">These are editable starting terms, not verified model aliases. For multi-model cards, enter each complete model name. This section does not run a filter or fetch listings.</p><p class="gl-note" data-status aria-live="polite"></p>';
  const searchInput=box.querySelector('[data-search]'),termsInput=box.querySelector('[data-terms]'),link=box.querySelector('[data-open]'),status=box.querySelector('[data-status]');
  const update=()=>{link.href='https://www.vinted.co.uk/catalog?search_text='+encodeURIComponent(searchInput.value.trim());};update();searchInput.addEventListener('input',update);
  box.querySelector('[data-copy]').addEventListener('click',async()=>{
   const text=termsInput.value.trim();
   if(!text){status.textContent='Enter at least one matching term first.';termsInput.focus();return;}
   try{await navigator.clipboard.writeText(text);status.textContent='Copied. On Vinted, run your original filter bookmark and paste into its prompt.';}
   catch{termsInput.focus();termsInput.select();status.textContent='Copy the selected matching terms manually.';}
  });
  card.append(box);
 });
}
const grid=document.getElementById('grid');if(grid){new MutationObserver(enhance).observe(grid,{childList:true});enhance();}
})();
