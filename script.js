// 🚀 Client-side search over live Zotero library

// Zotero proxy configuration
const serverURL = 'https://zotero-proxy-1.onrender.com/zotero';
const userID = '6928802';
const apiKey = 'r7REcrUUJVF5BkmNfwDkxwqQ';
const collectionKey = 'DVF2ZBSK';

// Fetch all items from Zotero collection
async function fetchAllBibliography() {
  let allItems = [];
  let start = 0;
  const pageSize = 100;
  let moreData = true;

  while (moreData) {
    const response = await fetch(
      `${serverURL}?userID=${userID}&apiKey=${apiKey}&collectionKey=${collectionKey}&limit=${pageSize}&start=${start}`
    );
    const data = await response.json();
    allItems = allItems.concat(data);

    if (data.length < pageSize) {
      moreData = false;
    } else {
      start += pageSize;
    }
  }
  return allItems;
}

let papers = [];
let fuse;

// Load, map, and index Zotero items
async function loadLibrary() {
  try {
    const items = await fetchAllBibliography();
    papers = items.map(item => ({
      id:       item.data.key,
      title:    item.data.title || '',
      authors:  item.data.creators?.map(c => c.lastName) || [],
      year:     item.data.date ? item.data.date.split('-')[0] : '',
      abstract: item.data.abstractNote || '',
      url:      item.data.url || '#'
    }));
    initSearch();
  } catch (err) {
    console.error('Failed to load Zotero library:', err);
  }
}

// Initialize Fuse.js with title, abstract, and authors
function initSearch() {
  const options = {
    keys: [
      { name: 'title',    weight: 0.4 },
      { name: 'abstract', weight: 0.5 },
      { name: 'authors',  weight: 0.1 }
    ],
    threshold:    0.3,
    includeScore: true
  };
  fuse = new Fuse(papers, options);
  bindSearchBox();
}

// Wire up the search input
function bindSearchBox() {
  const input = document.getElementById('searchBar');
  input.addEventListener('input', e => {
    const q = e.target.value.trim();
    const results = q ? fuse.search(q) : [];
    renderResults(results);
  });
}

// Render top 10 results as Bootstrap cards
function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = '';
  results.slice(0, 10).forEach(r => {
    const { title, authors, year, url } = r.item;
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-3';
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title"><a href="${url}" target="_blank">${title}</a></h5>
          <h6 class="card-subtitle mb-2 text-muted">${authors.join(', ')} (${year})</h6>
          <p class="card-text">${r.item.abstract}</p>
        </div>
      </div>`;
    container.appendChild(col);
  });
}

// On page load, fetch and index; refresh every 5 minutes
window.addEventListener('DOMContentLoaded', () => {
  loadLibrary();
  setInterval(loadLibrary, 5 * 60 * 1000);
});
