(async function(){
  // Zotero proxy config
  const serverURL     = 'https://zotero-proxy-1.onrender.com/zotero';
  const userID        = '6928802';
  const apiKey        = 'r7REcrUUJVF5BkmNfwDkxwqQ';
  const collectionKey = 'DVF2ZBSK';

  // cosine similarity helper
  function cosine(a, b) {
    let dot=0, na=0, nb=0;
    for(let i=0;i<a.length;i++){
      dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i];
    }
    return dot/(Math.sqrt(na)*Math.sqrt(nb));
  }

  // fetch & filter Zotero items
  async function fetchAll() {
    let all=[], start=0, limit=100, more=true;
    while(more){
      const url = `${serverURL}?userID=${userID}&apiKey=${apiKey}` +
                  `&collectionKey=${collectionKey}&limit=${limit}&start=${start}`;
      const res = await fetch(url);
      if(!res.ok) break;
      const data = await res.json();
      all = all.concat(data);
      if(data.length<limit) more=false;
      else start+=limit;
    }
    // remove attachments & notes
    return all.filter(i=>
      i.data.itemType!=='attachment' && i.data.itemType!=='note'
    );
  }

  // load USE model & Zotero library
  const model = await use.load();    // now `use` is defined
  const raw   = await fetchAll();
  const papers = raw.map((i, idx)=>({
    index: idx,
    type: i.data.itemType,
    title: i.data.title||'',
    abstract: i.data.abstractNote||'',
    authors: i.data.creators?.map(c=>c.lastName).join(',')||'',
    year: i.data.date?.split('-')[0]||'',
    url: i.data.url||'#'
  }));

  // embed all papers
  const texts = papers.map(p=>`${p.title}. ${p.abstract}`);
  const embeddings = await model.embed(texts);
  const embeddingArray = await embeddings.array();

  // render helper
  function render(list){
    const c=document.getElementById('results');
    c.innerHTML='';
    list.forEach(p=>{
      const col=document.createElement('div');
      col.className='col';
      col.innerHTML=`
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

  // search logic
  async function doSearch(){
    const q = document.getElementById('searchBar').value.trim();
    const type = document.getElementById('typeFilter').value;
    // 1) filter by type
    let pool = type
      ? papers.filter(p=>p.type===type)
      : papers.slice();
    // 2) if no query, render all in pool
    if(!q) return render(pool);
    // 3) embed query
    const qv = (await model.embed([q])).arraySync()[0];
    // 4) compute scores on pool
    const scored = pool.map(p=>({
      p, score: cosine(embeddingArray[p.index],qv)
    }));
    // 5) sort & take top 20
    scored.sort((a,b)=>b.score-a.score);
    render(scored.slice(0,20).map(x=>x.p));
  }

  // bind events
  document.getElementById('searchBar')
    .addEventListener('keypress', e=>{ if(e.key==='Enter') doSearch(); });
  document.getElementById('searchBtn')
    .addEventListener('click', doSearch);

  // initial render
  render(papers);
})();
