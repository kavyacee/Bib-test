// 🚨 Replace with your own Zotero information
const serverURL = 'https://zotero-proxy-hpa32g8qt-kavyas-projects-e6f8f6d9.vercel.app/zotero';
const userID = '6928802';    // e.g., 1234567
const apiKey = 'r7REcrUUJVF5BkmNfwDkxwqQ';    // e.g., AbCdEfGh123456
const collectionKey = 'DVF2ZBSK';

async function fetchAllBibliography() {
  let allItems = [];
  let start = 0;
  const pageSize = 100;
  let moreData = true;

  while (moreData) {
    const response = await fetch(`${serverURL}?userID=${userID}&apiKey=${apiKey}&collectionKey=${collectionKey}&limit=${pageSize}&start=${start}`);
    const data = await response.json();

    allItems = allItems.concat(data);

    if (data.length < pageSize) {
      moreData = false; // No more pages
    } else {
      start += pageSize; // Fetch next 100 items
    }
  }

  return allItems;
}

function renderResults(items) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // Clear previous results

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'col-md-6';
    div.innerHTML = `
      <div class="card h-100 mb-4">
        <div class="card-body">
          <h5 class="card-title">${item.data.title || 'No Title'}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${item.data.creators?.map(c => c.lastName).join(', ') || 'Unknown Author'}</h6>
          <p class="card-text">${item.data.abstractNote || 'No annotation available.'}</p>
        </div>
      </div>
    `;
    resultsDiv.appendChild(div);
  });
}

function setupSearch(items) {
  const searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = items.filter(item => {
      const title = item.data.title?.toLowerCase() || '';
      const abstract = item.data.abstractNote?.toLowerCase() || '';
      return title.includes(query) || abstract.includes(query);
    });
    renderResults(filtered);
  });
}

// Main
fetchAllBibliography().then(items => {
  renderResults(items);
  setupSearch(items);
});