document.querySelectorAll(".dropdown-wrapper").forEach((wrapper) => {
  const btn = wrapper.querySelector("button");
  const menu = wrapper.querySelector(".dropdown-menu");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-menu.open").forEach((menu) => {
    menu.classList.remove("open");
  });
});

const ALL_SCHOLARSHIPS_KEY = "all_scholarships";

function loadEntries() {
  return JSON.parse(localStorage.getItem(ALL_SCHOLARSHIPS_KEY) || "[]");
}

async function cacheEntries() {
  let existingEntries = loadEntries();
  if (existingEntries.length === 0) {
    const res = await fetchScholarship();
    const data = res["results"];
    localStorage.setItem(ALL_SCHOLARSHIPS_KEY, JSON.stringify(data));
    existingEntries = data;
  }
  return existingEntries;
}

async function fetchScholarship() {
  const API_BASE =
    window.location.hostname === "localhost" ? "http://localhost:3000" : "";
  const res = await fetch(`${API_BASE}/api/scholarships`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

let available_scholarships = [];
let currentEntries = [];

function renderScholarships(entries, emptyMessage = "No scholarships found.") {
  const section = document.querySelector(".available-scholarships");
  section.innerHTML = "";

  if (entries.length === 0) {
    section.innerHTML = `<p class='empty-state'>${emptyMessage}</p>`;
    return;
  }

  entries.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = `scholarship-card card-gradient-${(index % 5) + 1}`;
    card.innerHTML = `
      <span class="pill pill-status">${entry.status ?? "Unknown"}</span>
      <h3 class="card-name">${entry.name}</h3>
      <p class="card-sponsor">${entry.sponsor}</p>
      <p class="card-summary">${entry.summary !== undefined ? entry.summary : "-"}</p>
      <p class="card-deadline">Deadline: ${entry.deadline?.date ?? "N/A"}</p>
      <div class="card-footer">
        <span class="pill pill-type">${entry.type}</span>
        <a class="card-readmore" href="details.html?id=${entry.id}">Read more →</a>
      </div>
    `;
    section.appendChild(card);
  });
}

function populateFilterDropdown(entries) {
  const dropdown = document.querySelector("#filter-dropdown");
  const types = ["All", ...new Set(entries.map((e) => e.type).filter(Boolean))];

  dropdown.innerHTML = types
    .map((type) => `<li data-type="${type}">${type}</li>`)
    .join("");

  dropdown.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      const selected = item.dataset.type;
      const filtered =
        selected === "All"
          ? available_scholarships
          : available_scholarships.filter((e) => e.type === selected);

      currentEntries = filtered;
      document.querySelector("#filter-label").textContent =
        `${selected} (${filtered.length})`;
      renderScholarships(
        filtered,
        `No scholarships found for type "${selected}".`,
      );
      dropdown.classList.remove("open");
    });
  });
}

function setupSortDropdown() {
  const dropdown = document.querySelector("#sort-dropdown");

  dropdown.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      const sortBy = item.dataset.sort;
      const sorted = [...currentEntries];

      if (sortBy === "default") {
        renderScholarships(currentEntries);
        dropdown.classList.remove("open");
        return;
      } else if (sortBy === "az") {
        sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      } else if (sortBy === "deadline") {
        sorted.sort((a, b) => {
          const dateA = a.deadline?.date ? new Date(a.deadline.date) : null;
          const dateB = b.deadline?.date ? new Date(b.deadline.date) : null;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA - dateB;
        });
      }

      renderScholarships(sorted);
      dropdown.classList.remove("open");
    });
  });
}

cacheEntries()
  .then((entries) => {
    available_scholarships = entries;
    currentEntries = [...entries];
    renderScholarships(available_scholarships, "No scholarships found.");
    populateFilterDropdown(available_scholarships);
    setupSortDropdown();
    document.querySelector("#filter-label").textContent =
      `All (${available_scholarships.length})`;
  })
  .catch((e) => {
    console.error("Error loading scholarships:", e);
    renderScholarships([], "Unable to load scholarships.");
  });
