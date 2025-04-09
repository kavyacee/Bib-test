// ─── Config ───────────────────────────────────────────────────────────────────
const serverURL     = 'https://zotero-proxy-1.onrender.com/zotero';
const userID        = '6928802';
const apiKey        = 'r7REcrUUJVF5BkmNfwDkxwqQ';
const collectionKey = 'DVF2ZBSK';

let papers = [];
let paperEmbeddings, model;

// ─── Fetch & filter Zotero items ─────────────────────────────────────────────
async function fetchAllBibliography() {
  let all = [], start = 0, pageSize = 100, more = true;
  while (more) {
    const url = `${serverURL}?userID=${userID}&apiKey=${apiKey}` +
                `&collectionKey=${collectionKey}&limit=${pageSize}&start=${start}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    all = all.concat(data);
    if (data.length < pageSize) more = false;
    else start += pageSize;
  }
  return all.filter(i => i.data.itemType !== 'attachment' && i.data.itemType !== 'note');
}

// ─── Load USE model & your library ────────────────────────────────────────────
async function init() {
  model = await use.load();
  const items = await fetchAllBibliography();
  papers = items.map(i => ({
    title:    i.data.title        || '',
    abstract: i.data.abstractNote || '',
    authors:  i.data.creators?.map(c => c.lastName).join(', ') || '',
    year:     i.data.date?.split('-')[0] || '',
    url:      i.data.url || '#'
  }));
  const texts = papers.map(p => `${p.title}. ${p.abstract}`);
  paperEmbeddings = await model.embed(texts);
  renderResults(papers);
  bindSemanticSearch();
}

// ─── Wire up “Enter” to run semantic search ──────────────────────────────────
function bindSemanticSearch() {
  const input = document.getElementById('searchBar');
  input.addEventListener('keypress', async e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (!q) {
        renderResults(papers);
        return;
      }
      const qEmbed = await model.embed([q]);
      const sims = paperEmbeddings
        .dot(qEmbed.transpose())
        .arraySync()
        .map(r => r[0]);
      const ranked = papers
        .map((p, i) => ({ p, score: sims[i] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(x => x.p);
      renderResults(ranked);
    }
  });
}

// ─── Render list of papers ────────────────────────────────────────────────────
function renderResults(list) {
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
            ${p.authors} ${p.year ? '('+p.year+')' : ''}
          </h6>
          <p class="card-text flex-grow-1">${p.abstract}</p>
        </div>
      </article>`;
    c.appendChild(col);
  });
}

window.addEventListener('DOMContentLoaded', init);
