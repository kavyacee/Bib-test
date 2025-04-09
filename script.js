// 🚀 Client‑side search over your live Zotero library

// Zotero proxy configuration
const serverURL     = 'https://zotero-proxy-1.onrender.com/zotero';
const userID        = '6928802';
const apiKey        = 'r7REcrUUJVF5BkmNfwDkxwqQ';
const collectionKey = 'DVF2ZBSK';

console.log('🔍 script.js is running');

// ─── Fetch all items from your Zotero collection ─────────────────────────────
async function fetchAllBibliography() {
  let allItems = [], start = 0, pageSize = 100, moreData = true;

  while (moreData) {
    const url = `${serverURL}` +
                `?userID=${userID}` +
                `&apiKey=${apiKey}` +
                `&collectionKey=${collectionKey}` +
                `&limit=${pageSize}` +
                `&start=${start}`;
    console.log('▶️ Fetching URL:', url);

    const res = await fetch(url);
    console.log('⏳ Response status:', res.status);
    if (!res.ok) {
      console.error('Zotero proxy error:', res.status);
      break;
    }

    const data = await res.json();
    console.log('✅ Fetched raw items count:', data.length);

    allItems = allItems.concat(data);
    if (data.length < pageSize) moreData = false;
    else start += pageSize;
  }

  return allItems;
}

// ─── Global state ─────────────────────────────────────────────────────────────
let papers = [];
let fuse;

// ─── Load, filter, map, render & index Zotero items ──────────────────────────
async function loadLibrary() {
  try {
    const raw = await fetchAllBibliography();
    console.log('🔍 Total raw items:', raw.length);

    // ── FILTER OUT attachments & notes ───────────────────────────────
    const filteredRaw = raw.filter(item => {
      const t = item.data.itemType;
      return t !== 'attachment' && t !== 'note';
    });
    console.log('🔍 After filtering attachments/notes:', filteredRaw.length);

    // ── MAP TO SIMPLER OBJECTS ───────────────────────────────────────
    papers = filteredRaw.map(item => ({
      id:       item.data.key,
      title:    item.data.title        || '',
      authors:  item.data.creators
                   ? item.data.creators.map(c => c.lastName)
                   : [],
      year:     item.data.date
                   ? item.data.date.split('-')[0]
                   : '',
      abstract: item.data.abstractNote || '',
      url:      item.data.url          || '#'
    }));

    // ── RENDER ALL PAPERS ON LANDING ────────────────────────────────
    console.log('▶️ renderResults called with', papers.length, 'items');
    renderResults(papers.map(p => ({ item: p })));

    // ── INIT FUSE.JS SEARCH ─────────────────────────────────────────
    initSearch();
  } catch (err) {
    console.error('Failed to load Zotero library:', err);
  }
}

// ─── Initialize Fuse.js for fuzzy search ─────────────────────────────────────
function initSearch() {
  fuse = new Fuse(papers, {
    keys: [
      { name: 'title',    weight: 0.4 },
      { name: 'abstract', weight: 0.5 },
      { name: 'authors',  weight: 0.1 }
    ],
    threshold:    0.3,
    includeScore: true
  });
  bindSearchBox();
}

// ─── Wire up the search input ─────────────────────────────────────────────────
function bindSearchBox() {
  const input = document.getElementById('searchBar');
  if (!input) return console.error('No #searchBar found');

  input.addEventListener('input', e => {
    const q = e.target.value.trim();
    const results = q
      ? fuse.search(q)
      : papers.map(p => ({ item: p }));
    renderResults(results);
  });
}

// ─── Render results into Bootstrap cards ─────────────────────────────────────
function renderResults(results) {
  const container = document.getElementById('results');
  if (!container) return console.error('No #results container found');

  container.innerHTML = '';
  results.forEach(r => {
    const { title, authors, year, url, abstract } = r.item;
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <article class="card h-100">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-2">
            <a href="${url}" target="_blank" rel="noopener">${title}</a>
          </h5>
          <h6 class="card-subtitle mb-3 text-muted">
            ${authors.join(', ')}${year ? ' (' + year + ')' : ''}
          </h6>
          <p class="card-text flex-grow-1">${abstract}</p>
        </div>
      </article>`;
    container.appendChild(col);
  });
}

// ─── Kick everything off on page load & auto‑refresh ─────────────────────────
window.addEventListener('DOMContentLoaded', loadLibrary);
setInterval(loadLibrary, 5 * 60 * 1000);
