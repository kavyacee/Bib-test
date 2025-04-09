// 🚀 Fuzzy search over your live Zotero library

// Zotero proxy config
const serverURL     = 'https://zotero-proxy-1.onrender.com/zotero';
const userID        = '6928802';
const apiKey        = 'r7REcrUUJVF5BkmNfwDkxwqQ';
const collectionKey = 'DVF2ZBSK';

let allItems = [];
let fuse;

// Fetch & filter out attachments/notes
async function fetchLibrary() {
  let items = [], start = 0, pageSize = 100, more = true;
  while (more) {
    const url = `${serverURL}` +
                `?userID=${userID}` +
                `&apiKey=${apiKey}` +
                `&collectionKey=${collectionKey}` +
                `&limit=${pageSize}` +
                `&start=${start}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    items = items.concat(data);
    if (data.length < pageSize) more = false;
    else start += pageSize;
  }
  return items.filter(i =>
    i.data.itemType !== 'attachment' &&
    i.data.itemType !== 'note'
  );
}

// Render cards into #results
function renderResults(items) {
  const container = document.getElementById('results');
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<div class="col"><p>No results.</p></div>';
    return;
  }
  items.forEach(item => {
    const { title, abstractNote, creators, date, url } = item.data;
    const authors = creators?.map(c => c.lastName).join(', ') || '';
    const year    = date?.split('-')[0] || '';
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <article class="card h-100">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">
            <a href="${url || '#'}" target="_blank" rel="noopener">
              ${title || 'No title'}
            </a>
          </h5>
          <h6 class="card-subtitle mb-2 text-muted">
            ${authors}${year ? ' (' + year + ')' : ''}
          </h6>
          <p class="card-text flex-grow-1">
            ${abstractNote || ''}
          </p>
        </div>
      </article>`;
    container.appendChild(col);
  });
}

// Apply type filter + fuzzy search
function applyFilters() {
  const type  = document.getElementById('typeFilter').value;
  const query = document.getElementById('searchBar').value.trim();

  // 1) Filter by type
  let pool = type
    ? allItems.filter(i => i.data.itemType === type)
    : allItems.slice();

  // 2) Fuzzy search
  if (query) {
    const results = fuse.search(query);
    pool = results.map(r => r.item);
  }

  renderResults(pool);
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Fetch library
  allItems = await fetchLibrary();

  // 2) Initialize Fuse.js
  fuse = new Fuse(allItems, {
    keys: [
      { name: 'data.title',        weight: 0.5 },
      { name: 'data.abstractNote', weight: 0.4 },
      { name: 'data.creators',     weight: 0.1 }
    ],
    threshold: 0.3
  });

  // 3) Initial render (all items)
  renderResults(allItems);

  // 4) Bind controls
  document.getElementById('searchBtn').addEventListener('click', applyFilters);
  document.getElementById('searchBar')
          .addEventListener('keypress', e => { if (e.key === 'Enter') applyFilters(); });
  document.getElementById('typeFilter')
          .addEventListener('change', applyFilters);

  // 5) Hide loading, show app
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').classList.remove('d-none');
});
