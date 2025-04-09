function renderResults(items) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  items.forEach(item => {
    let tags = item.data.tags?.map(tag => tag.tag) || [];
    const autoTags = generateAutoTags(item);
    tags = tags.concat(autoTags);

    let annotation = item.data.abstractNote;
    if (!annotation || annotation.trim() === '') {
      annotation = `This paper titled "${item.data.title}" by ${item.data.creators?.map(c => c.lastName).join(', ') || 'Unknown Author'} discusses important topics.`;
    }

    const div = document.createElement('div');
    div.className = 'col-md-6';
    div.innerHTML = `
      <div class="card h-100 mb-4">
        <div class="card-body">
          <h5 class="card-title">${item.data.title || 'No Title'}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${item.data.creators?.map(c => c.lastName).join(', ') || 'Unknown Author'}</h6>
          <p class="card-text">${annotation}</p>
          <p class="card-text"><small class="text-muted">Tags: ${tags.join(', ') || 'No tags'}</small></p>
        </div>
      </div>
    `;
    resultsDiv.appendChild(div);
  });
}