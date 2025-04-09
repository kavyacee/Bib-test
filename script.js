(async function(){
  // ─── Zotero proxy config ────────────────────────────────────────────────
  const serverURL     = 'https://zotero-proxy-1.onrender.com/zotero';
  const userID        = '6928802';
  const apiKey        = 'r7REcrUUJVF5BkmNfwDkxwqQ';
  const collectionKey = 'DVF2ZBSK';

  // ─── Fetch & filter Zotero items ───────────────────────────────────────
  async function fetchAll() {
    let all = [], start = 0, limit = 100, more = true;
    while (more) {
      const url = `${serverURL}?userID=${userID}&apiKey=${apiKey}` +
                  `&collectionKey=${collectionKey}&limit=${limit}&start=${start}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      all = all.concat(data);
      if (data.length < limit) more = false;
      else start += limit;
    }
    return all.filter(i =>
      i.data.itemType !== 'attachment' &&
      i.data.itemType !== 'note'
    );
  }

  // ─── Load USE model & your library ─────────────────────────────────────
  const model = await use.load();
  const raw   = await fetchAll();
  const papers = raw.map(i => ({
    title:    i.data.title        || '',
    abstract: i.data.abstractNote || '',
    authors:  i.data.creators?.map(c=>c.lastName).join(', ')||'',
    year:     i.data.date?.split('-')[0]||'',
    url:      i.data.url||'#'
  }));

  // ─── Embed all papers ───────────────────────────────────────────────────
  const texts = papers.map(p=>`${p.title}. ${p.abstract}`);
  const embeddings = await model.embed(texts);

  // ─── Render function ───────────────────────────────────────────────────
  function render(list) {
    const c = document.getElementById('results');
    c.innerHTML = '';
    list.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <article class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">
              <a href="${p.url}" target="_blank" rel="noopener">${p.title}</a>
            </h5>
            <h6 class="card-subtitle mb-2 text-muted">
              ${p.authors}${p.year?' ('+p.year+')':''}
            </h6>
            <p class="card-text flex-grow-1">${p.abstract}</p>
          </div>
        </article>`;
      c.appendChild(col);
    });
  }

  // ─── Initial render (all papers) ───────────────────────────────────────
  render(papers);

  // ─── Semantic search handler ──────────────────────────────────────────
  async function doSearch() {
    const q = document.getElementById('searchBar').value.trim();
    if (!q) { render(papers); return; }
    const qv = await model.embed([q]);
    const sims = embeddings
      .dot(qv.transpose())
      .arraySync()
      .map(r=>r[0]);
    const ranked = papers
      .map((p,i)=>({p,score:sims[i]}))
      .sort((a,b)=>b.score - a.score)
      .slice(0,20)
      .map(x=>x.p);
    render(ranked);
  }

  // ─── Bind Enter & Button ──────────────────────────────────────────────
  document.getElementById('searchBar')
    .addEventListener('keypress', e => { if (e.key==='Enter') doSearch(); });
  document.getElementById('searchBtn')
    .addEventListener('click', doSearch);
})();
