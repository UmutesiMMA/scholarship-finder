let available_scholarships = [];
let currentEntries = [];
let activeType = "all";
let activeSort = "default";
let activeView = "browse";
let searchQuery = "";
let profile = {
  residency: { value: null, label: null },
  ed_level: { value: null, label: null },
  study_field: { value: null, label: null },
  gpa: { value: null, label: null },
};

function getTypeInfo(type) {
  const map = {
    scholarship: { icon: "graduation-cap", badge: "scholarship" },
    grant: { icon: "hand-holding-dollar", badge: "grant" },
    fellowship: { icon: "users", badge: "fellowship" },
    prize: { icon: "trophy", badge: "prize" },
  };
  return map[(type || "").toLowerCase()] || { icon: "star", badge: "default" };
}

const ALL_SCHOLARSHIPS_KEY = "all_scholarships";

function loadEntries() {
  try{
    return JSON.parse(localStorage.getItem(ALL_SCHOLARSHIPS_KEY) || "[]");
  }catch{
    localStorage.removeItem(ALL_SCHOLARSHIPS_KEY);
    return [];

  }
}

async function fetchScholarship() {
  const port = window.location.port;
  const API_BASE = !port || port === "3000" ? "" : "http://localhost:3000";
  return fetchJson(`${API_BASE}/api/scholarships`);
}

async function cacheEntries() {
  let existingEntries = loadEntries();
  if (existingEntries.length === 0) {
    const res = await fetchScholarship();
    const data = res["results"];
    if(Array.isArray(data)) throw new Error("Unexpected API response shape")
      try{
    localStorage.setItem(ALL_SCHOLARSHIPS_KEY, JSON.stringify(data));
  }
  catch{
    console.warn("Could not cache scholarships");
  }
    existingEntries = data;
  }
  return existingEntries;
}

function applyFilters() {
  let entries = [...available_scholarships];

  if (activeType !== "all") {
    entries = entries.filter((e) => e.type === activeType);
  }

  const hasProfile = Object.values(profile).some((p) => p.value);
  if (hasProfile) {
    entries = entries.filter((s) => {
      const elig = s.eligibility;
      const resValues = Array.isArray(elig?.residency)
        ? elig.residency
        : elig?.residency
          ? [elig.residency]
          : [];
      const eduValues = Array.isArray(elig?.education_level)
        ? elig.education_level
        : elig?.education_level
          ? [elig.education_level]
          : [];

      const studyFieldValues = Array.isArray(elig?.fields_of_study)
        ? elig.fields_of_study
        : elig?.fields_of_study
          ? [elig.fields_of_study]
          : [];

      const residenceMatch =
        !profile.residency.value ||
        resValues.length === 0 ||
        resValues.includes(profile.residency.value);
      const eduMatch =
        !profile.ed_level.value ||
        eduValues.length === 0 ||
        eduValues.includes(profile.ed_level.value);
      const studyFieldMatch =
        !profile.study_field.value ||
        studyFieldValues.length === 0 ||
        studyFieldValues.some((f) =>
          f.toLowerCase().includes(profile.study_field.value.toLowerCase()),
        );
      const gpaMatch =
        !profile.gpa.value ||
        !elig?.gpa_min ||
        parseFloat(profile.gpa.value) >= elig.gpa_min;

      return residenceMatch && eduMatch && studyFieldMatch && gpaMatch;
    });
  }

  if (searchQuery) {
    entries = entries.filter((s) => s.name.toLowerCase().includes(searchQuery));
  }

  if (activeSort === "az") {
    entries.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  } else if (activeSort === "deadline") {
    entries.sort((a, b) => {
      const dA = a.deadline?.date ? new Date(a.deadline.date) : null;
      const dB = b.deadline?.date ? new Date(b.deadline.date) : null;
      if (!dA && !dB) return 0;
      if (!dA) return 1;
      if (!dB) return -1;
      return dA - dB;
    });
  }

  if (activeView === "saved") {
    entries = entries.filter((e) => getSaved().includes(e.id));
  }

  return entries;
}

function renderScholarships() {
  const entries = applyFilters();
  currentEntries = entries;
  const section = document.querySelector(".available-scholarships");
  section.innerHTML = "";

  document.getElementById("saved-count").textContent = getSaved().length;

  if (entries.length === 0) {
    const msg =
      activeView === "saved"
        ? "No saved scholarships yet — bookmark some to see them here."
        : "No scholarships found.";
    section.innerHTML = `<p class="empty-state">${msg}</p>`;
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "scholarship-card";
    const { icon, badge } = getTypeInfo(entry.type);
    const isSaved = getSaved().includes(entry.id);
    card.innerHTML = `
      <div class="card-top">
        <div class="card-type-badge card-badge-${badge}">
          <i class="fa-solid fa-${icon}"></i>
        </div>
        <button class="save-btn${isSaved ? " saved" : ""}" aria-label="${isSaved ? "Unsave" : "Save"}">
          <i class="fa-${isSaved ? "solid" : "regular"} fa-bookmark"></i>
        </button>
      </div>
      <h3 class="card-name">${entry.name}</h3>
      <p class="card-sponsor">${entry.sponsor}</p>
      <p class="card-summary">${entry.summary !== undefined ? entry.summary : "-"}</p>
      <p class="card-deadline">Deadline: ${entry.deadline?.date ?? "N/A"}</p>
      <div class="card-footer">
        <a class="card-readmore" href="details.html?id=${entry.id}">Read more</a>
      </div>
    `;
    section.appendChild(card);

    card.querySelector(".save-btn").addEventListener("click", function () {
      const nowSaved = toggleSave(entry.id);
      this.className = `save-btn${nowSaved ? " saved" : ""}`;
      this.setAttribute("aria-label", nowSaved ? "Unsave" : "Save");
      this.innerHTML = `<i class="fa-${nowSaved ? "solid" : "regular"} fa-bookmark"></i>`;
      document.getElementById("saved-count").textContent = getSaved().length;
      if (activeView === "saved") renderScholarships();
    });
  });
}

function renderProfileBar() {
  const bar = document.getElementById("profile-bar");
  const tagsContainer = document.getElementById("profile-tags");

  const hasProfile = Object.values(profile).some((p) => p.value);
  if (!hasProfile) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;

  const tagDefs = [
    {
      key: "residency",
      label: profile.residency.label || profile.residency.value,
    },
    {
      key: "ed_level",
      label: profile.ed_level.label || profile.ed_level.value,
    },
    { key: "study_field", label: profile.study_field.value },
    {
      key: "gpa",
      label: profile.gpa.value ? `GPA ${profile.gpa.value}+` : null,
    },
  ].filter((t) => t.label);

  tagsContainer.innerHTML = tagDefs
    .map(
      ({ key, label }) =>
        `<span class="profile-tag" data-key="${key}">${label}<button aria-label="Remove ${label}">×</button></span>`,
    )
    .join("");

  tagsContainer.querySelectorAll(".profile-tag button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.closest(".profile-tag").dataset.key;
      profile[key] = { value: null, label: null };
      renderProfileBar();
      renderScholarships();
    });
  });
}

function setupTabs() {
  document.getElementById("tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    activeView = tab.dataset.view;
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.setAttribute("aria-selected", t === tab));
    renderScholarships();
  });
}

function populateFilterChips(entries) {
  const container = document.getElementById("filter-chips");
  const types = ["All", ...new Set(entries.map((e) => e.type).filter(Boolean))];

  container.innerHTML = types
    .map(
      (type) =>
        `<button class="chip" data-type="${type.toLowerCase()}" aria-pressed="${type.toLowerCase() === activeType}">${type}</button>`,
    )
    .join("");

  container.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeType = chip.dataset.type;
      container
        .querySelectorAll(".chip")
        .forEach((c) => c.setAttribute("aria-pressed", c === chip));
      renderScholarships();
    });
  });
}

// Sort
function setupSortSelect() {
  document.getElementById("sort-select").addEventListener("change", (e) => {
    activeSort = e.target.value;
    renderScholarships();
  });
}

//  Search by name
function setupSearch() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderScholarships();
  });
}

// Tailor scholarship Dialog
function setupDialog() {
  const dialog = document.querySelector(".eligibility-dialog");

  document.getElementById("open-tailored-btn").addEventListener("click", () => {
    dialog.showModal();
  });

  document
    .querySelector(".eligibility-cancel-btn")
    .addEventListener("click", () => {
      dialog.close();
    });

  document
    .querySelector(".eligibility-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();

      const residencySelect = document.getElementById("residency");
      const edLevelSelect = document.getElementById("ed_level");

      profile.residency = {
        value: residencySelect.value || null,
        label: residencySelect.value
          ? residencySelect.options[residencySelect.selectedIndex]?.text
          : null,
      };

      profile.ed_level = {
        value: edLevelSelect.value || null,
        label: edLevelSelect.value
          ? edLevelSelect.options[edLevelSelect.selectedIndex]?.text
          : null,
      };

      const studyFieldVal = document.getElementById("study_field").value.trim();
      profile.study_field = {
        value: studyFieldVal || null,
        label: studyFieldVal || null,
      };

      const gpaVal = document.getElementById("gpa").value.trim();
      profile.gpa = {
        value: gpaVal || null,
        label: gpaVal ? `GPA ${gpaVal}+` : null,
      };

      dialog.close();
      renderProfileBar();
      renderScholarships();
    });
}

// Residency select
async function populateResidencySelect() {
  const select = document.getElementById("residency");
  try{

    const res = await fetch("data/states.json");
    const states = await res.json();
    select.innerHTML =
    '<option value="">Choose state</option>' +
    states.map((s) => `<option value="${s.code}">${s.name}</option>`).join("");
  }catch{
    select.innerHTML = `<option value =""> States unavailable</option>`;
    select.setAttribute(disabled);
  }
}

// init
cacheEntries()
  .then((entries) => {
    available_scholarships = entries;
    renderScholarships();
    populateFilterChips(entries)})
  .catch((e) => {
    console.error("Error loading scholarships:", e);
    document.querySelector(".available-scholarships").innerHTML =
    `<p class="empty-state">${e.message|| "Unable to load scholarships."}</p>`;
  });

  setupTabs();
  setupSortSelect();
  setupSearch();
  setupDialog();
  populateResidencySelect();
