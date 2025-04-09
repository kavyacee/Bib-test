// 🚀 Client‑side search over your live Zotero library

// Zotero proxy configuration
const serverURL     = 'https://zotero-proxy-1.onrender.com/zotero';
const userID        = '6928802';
const apiKey        = 'r7REcrUUJVF5BkmNfwDkxwqQ';
const collectionKey = 'DVF2ZBSK';

console.log('🔍 script.js is running');

let papers = [];
let fuse;

// ─── Fetch & filter Zotero items ─────────────────────────────────────────────
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
    if (!res.ok) break;

    const data = await res.json();
    allItems = allItems.concat(data);
    if (data.length < pageSize) moreData = false;
    else start += pageSize;
  }

  // filter out attachments & notes
  return allItems.filter(item =>
    item.data.itemType !== 'attachment' &&
    item.data.itemType !== 'note'
  );
}

// ─── Load, map, render & index Zotero items ───────────────────────────────────
async function loadLibrary() {
  try {
    const raw = await fetchAllBibliography();
    console.log('🔍 Total items after filtering:', raw.length);

    papers = raw.map(item => ({
      id:       item.data.key,
      itemType: item.data.itemType,
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

    // render all on landing
    renderResults(papers.map(p => ({ item: p })));

    // init Fuse and bind filters
    initSearch();
    bindTypeFilter();
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
  document.getElementById('searchBar')
    .addEventListener('input', applyFilters);
}

// ─── Wire up the type dropdown ────────────────────────────────────────────────
function bindTypeFilter() {
  document.getElementById('typeFilter')
    .addEventListener('change', applyFilters);
}

// ─── Combine search + type filter, then render ────────────────────────────────
function applyFilters() {
  const q    = document.getElementById('searchBar').value.trim();
  const type = document.getElementById('typeFilter').value;

  // 1) search
  let results = q
    ? fuse.search(q).map(r => r.item)
    : papers.slice();

  // 2) filter by type if selected
  if (type) {
    results = results.filter(item => item.itemType === type);
  }

  // 3) render
  renderResults(results.map(item => ({ item })));
}

// ─── Render results into Bootstrap cards ─────────────────────────────────────
function renderResults(results) {
  const container = document.getElementById('results');
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
