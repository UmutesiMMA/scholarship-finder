const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const DETAIL_KEY = (id) => `scholarship_detail_${id}`;

async function fetchDetails(id) {
  const port = window.location.port;
  const API_BASE = !port || port === "3000" ? "" : "http://localhost:3000";
  return fetchJson(`${API_BASE}/api/scholarships/${id}`);

}

async function getDetails(id) {
  const cached = localStorage.getItem(DETAIL_KEY(id));
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(DETAIL_KEY(id));
    }
  }

  const allCached = localStorage.getItem("all_scholarships");
  if (allCached) {
    const found = JSON.parse(allCached).find((s) => s.id === id);
    if (found) {
      try {
        localStorage.setItem(DETAIL_KEY(id), JSON.stringify(found));
      } catch {
        console.warn("Could not cache scholarship details");
      }
      return found;
    }
  }

  const data = await fetchDetails(id);
  try {
    localStorage.setItem(DETAIL_KEY(id), JSON.stringify(data));
  } catch {
    console.warn("Could not cache scholarship details");
  }
  return data;
}

function getInitials(name) {
  if (!name) return "?";
  const skip = /^(of|the|and|for|in|at|a|an)$/i;
  return name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !skip.test(w))
    .map((w) => w[0].toUpperCase())
    .slice(0, 3)
    .join("");
}

function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function buildEligibilityItems(elig) {
  if (!elig) return [];
  const items = [];
  toArray(elig.residency).forEach((r) => items.push(r));
  toArray(elig.education_level).forEach((e) => items.push(e));
  (elig.other ?? []).forEach((o) => items.push(o));
  return items;
}

function renderDetails(data) {
  const container = document.querySelector("#details-container");

  const renewable =
    data.award?.renewable === true
      ? "Yes"
      : data.award?.renewable === false
        ? "No"
        : "Unknown";

  const amountRange =
    data.award?.amount_min && data.award?.amount_max
      ? `${data.award.currency ?? ""} ${data.award.amount_min}–${data.award.amount_max}`.trim()
      : data.award?.amount_min
        ? `From ${data.award.currency ?? ""} ${data.award.amount_min}`.trim()
        : data.award?.amount_max
          ? `Up to ${data.award.currency ?? ""} ${data.award.amount_max}`.trim()
          : "Varies";

  const deadlineDisplay = data.deadline?.date ?? "Not listed";
  const ctaNote =
    data.deadline?.notes ??
    "Verify the current deadline against the source before you start.";

  const initials = getInitials(data.sponsor);

  const resTag = toArray(data.eligibility?.residency).join(", ") || null;
  const pills = [data.sponsor_type, resTag, data.award?.basis]
    .filter(Boolean)
    .map((t) => `<span class="details-tag">${t}</span>`)
    .join("");

  const eduLevel =
    toArray(data.eligibility?.education_level).join(", ") || "N/A";
  const eligItems = buildEligibilityItems(data.eligibility);

  container.innerHTML = `
    <section class="details-hero">
      <div class="details-initials-badge">${initials}</div>
      <div class="details-hero-info">
        <h1 class="details-name">${data.name ?? "Untitled"}</h1>
        <p class="details-sponsor-line">${data.sponsor ?? ""}${data.sponsor_type ? ` · ${data.sponsor_type}` : ""}</p>
        ${pills ? `<div class="details-tags">${pills}</div>` : ""}
      </div>
    </section>

    ${data.summary ? `<p class="details-summary">${data.summary}</p>` : ""}

    <div class="details-stats-row">
      <div class="details-stat-tile">
        <div class="details-stat-badge details-stat-badge-award">
          <i class="fa-solid fa-dollar-sign"></i>
        </div>
        <span class="details-stat-value">${amountRange}</span>
        <span class="details-stat-label">Award</span>
      </div>
      <div class="details-stat-tile">
        <div class="details-stat-badge details-stat-badge-deadline">
          <i class="fa-regular fa-clock"></i>
        </div>
        <span class="details-stat-value">${deadlineDisplay}</span>
        <span class="details-stat-label">Deadline</span>
      </div>
      <div class="details-stat-tile">
        <div class="details-stat-badge details-stat-badge-renewable">
          <i class="fa-solid fa-rotate"></i>
        </div>
        <span class="details-stat-value">${renewable}</span>
        <span class="details-stat-label">Renewable</span>
      </div>
      <div class="details-stat-tile">
        <div class="details-stat-badge details-stat-badge-who">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <span class="details-stat-value">${eduLevel}</span>
        <span class="details-stat-label">Who can apply</span>
      </div>
    </div>

    <div class="details-bottom">
      <section class="details-eligibility-card">
        <h2>ELIGIBILITY</h2>
        ${
          eligItems.length
            ? `<ul class="details-checklist">${eligItems.map((i) => `<li><i class="fa-solid fa-check details-check-icon"></i>${i}</li>`).join("")}</ul>`
            : `<p class="details-no-data">No eligibility requirements listed.</p>`
        }
        ${data.award?.notes ? `<div class="details-elig-footnote"><i class="fa-solid fa-circle-info"></i><span>${data.award.notes}</span></div>` : ""}
      </section>

      <section class="details-cta-card">
        <h3 class="details-cta-title">Ready to apply?</h3>
        <p class="details-cta-note">${ctaNote}</p>
        ${data.links?.apply_url ? `<a class="cta-btn cta-btn-primary" href="${data.links.apply_url}" target="_blank" rel="noopener">Apply now</a>` : ""}
        ${data.links?.info_url ? `<a class="cta-btn cta-btn-secondary" href="${data.links.info_url}" target="_blank" rel="noopener">More info</a>` : ""}
        <button class="cta-btn ${getSaved().includes(id) ? "cta-btn-saved" : "cta-btn-save"} details-save-btn">
          <i class="fa-${getSaved().includes(id) ? "solid" : "regular"} fa-bookmark"></i>
          ${getSaved().includes(id) ? "Saved" : "Save for later"}
        </button>
      </section>
    </div>
  `;

  const saveBtn = container.querySelector(".details-save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const nowSaved = toggleSave(id);
      saveBtn.className = `cta-btn ${nowSaved ? "cta-btn-saved" : "cta-btn-save"} details-save-btn`;
      saveBtn.innerHTML = `<i class="fa-${nowSaved ? "solid" : "regular"} fa-bookmark"></i> ${nowSaved ? "Saved" : "Save for later"}`;
    });
  }
}

async function init() {
  if (!id) {
    document.querySelector("#details-container").innerHTML =
      "<p class='empty-state'>No scholarship selected.</p>";
    return;
  }

  try {
    const data = await getDetails(id);
    renderDetails(data);
  } catch (e) {
    console.error(e);
    const msg = e.message.includes("404")
      ? "This scholarship could not be found."
      : e.message || "Failed to load scholarship details. Try refreshing the page.";
    document.querySelector("#details-container").innerHTML =
      `<p class='empty-state'>${msg}</p>`;
  }
}

init();
