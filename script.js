<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Ask This Annotated Bibliography</title>
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
    rel="stylesheet"
    crossorigin="anonymous"
  />
  <style>
    body { max-width: 960px; margin: auto; }
    .card { transition: transform .1s; }
    .card:hover { transform: scale(1.02); }
  </style>
</head>
<body class="py-4">

  <header class="text-center mb-4">
    <h1 class="display-5">📚 Ask This Annotated Bibliography</h1>
    <p class="text-muted">Filter by type, type your question, then Enter or Search.</p>
  </header>

  <!-- LOADING SPINNER -->
  <div id="loading" class="d-flex justify-content-center align-items-center my-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading…</span>
    </div>
    <span class="ms-2">Loading model and indexing library…</span>
  </div>

  <!-- APP UI (hidden until ready) -->
  <div id="app" class="d-none">
    <div class="row mb-4 g-2">
      <div class="col-md-4">
        <label for="typeFilter" class="form-label">Filter by type</label>
        <select id="typeFilter" class="form-select">
          <option value="">All types</option>
          <option value="journalArticle">Journal Article</option>
          <option value="newspaperArticle">News Article</option>
          <option value="report">Report</option>
          <option value="webpage">Webpage</option>
        </select>
      </div>
      <div class="col-md-8 input-group">
        <label class="visually-hidden" for="searchBar">Your question</label>
        <input
          type="search"
          id="searchBar"
          class="form-control"
          placeholder="e.g. Do queer people like bars?"
          aria-label="Your question"
        />
        <button id="searchBtn" class="btn btn-primary">Search</button>
      </div>
    </div>

    <div id="results" class="row row-cols-1 row-cols-md-2 g-4" aria-live="polite"></div>
  </div>

  <!-- TensorFlow.js -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.2.0/dist/tf.min.js"></script>
  <!-- Universal Sentence Encoder -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal-sentence-encoder.js"></script>
  <!-- Your application code -->
  <script src="script.js"></script>
</body>
</html>
