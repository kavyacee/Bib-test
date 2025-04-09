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

function generateAutoTags(item) {
  const text = (item.data.title + ' ' + item.data.abstractNote).toLowerCase();
  const keywords = ['disability', 'policy', 'health', 'education', 'technology', 'race', 'gender', 'climate', 'rights', 'poverty'];

  const foundTags = keywords.filter(keyword => text.includes(keyword));
  return foundTags;
}

function renderResults(items) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; // Clear previous results

  items.forEach(item => {
    let tags = item.data.tags?.map(tag => tag.tag) || [];
    const autoTags = generateAutoTags(item);
    tags = tags.concat(autoTags);

    const div = document.createElement('div');
    div.className = 'col-md-6';
    div.innerHTML = `
      &lt;div class="card h-100 mb-4"&gt;
        &lt;div class="card-body"&gt;
          &lt;h5 class="card-title"&gt;${item.data.title || 'No Title'}&lt;/h5&gt;
          &lt;h6 class="card-subtitle mb-2 text-muted"&gt;${item.data.creators?.map(c => c.lastName).join(', ') || 'Unknown Author'}&lt;/h6&gt;
          &lt;p class="card-text"&gt;${item.data.abstractNote || 'No annotation available.'}&lt;/p&gt;
          &lt;p class="card-text"&gt;&lt;small class="text-muted"&gt;Tags: ${tags.join(', ') || 'No tags'}&lt;/small&gt;&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;
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
      const realTags = item.data.tags?.map(tag => tag.tag.toLowerCase()).join(' ') || '';
      const autoTags = generateAutoTags(item).join(' ').toLowerCase();
      return title.includes(query) || abstract.includes(query) || realTags.includes(query) || autoTags.includes(query);
    });
    renderResults(filtered);
  });
}

// Main
fetchAllBibliography().then(items => {
  renderResults(items);
  setupSearch(items);
});