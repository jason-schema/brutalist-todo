// src/app.js
const app = document.getElementById('app');

app.innerHTML = `
  <header>
    <input type="text" placeholder="Search tasks..." id="searchBar" />
  </header>
  <div class="layout">
    <nav class="primary-nav">Primary Nav</nav>
    <main class="calendar-scroller">Calendar Scroller</main>
    <aside class="secondary-nav">Year/Month Nav</aside>
  </div>
`;
