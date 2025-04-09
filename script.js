// 🚨 Replace YOUR_USER_ID and YOUR_API_KEY with your own info
const userID = '6928802';     // Example: 1234567
const apiKey = 'r7REcrUUJVF5BkmNfwDkxwqQ';     // Example: AbCdEfGh123456

async function fetchBibliography() {
  const response = await fetch(`https://api.zotero.org/users/${userID}/items?format=json&key=${apiKey}`);
  const data = await response.json();
  return data;
}

function renderResults(items) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // Clear old results

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'col-md-6';
    div.innerHTML = `
      <div class="card h-100">
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
fetchBibliography().then(items => {
  renderResults(items);
  setupSearch(items);
});