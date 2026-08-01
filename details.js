const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const DETAIL_KEY = (id) => `scholarship_detail_${id}`;

async function fetchDetails(id) {
  const port = window.location.port;
  const API_BASE = !port || port === "3000" ? "" : "http://localhost:3000";
  const res = await fetch(`${API_BASE}/api/scholarships/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getDetails(id) {
  const cached = localStorage.getItem(DETAIL_KEY(id));
  if (cached) return JSON.parse(cached);

  const allCached = localStorage.getItem("all_scholarships");
  if (allCached) {
    const found = JSON.parse(allCached).find((s) => s.id === id);
    if (found) {
      localStorage.setItem(DETAIL_KEY(id), JSON.stringify(found));
      return found;
    }
  }

  const data = await fetchDetails(id);
  localStorage.setItem(DETAIL_KEY(id), JSON.stringify(data));
  return data;
}

function renderDetails(data) {
  const container = document.querySelector("#details-container");

  const renewable =
    data.award?.renewable === true
      ? "Yes"
      : data.award?.renewable === false
        ? "No"
        : "N/A";

  const amountRange =
    data.award?.amount_min && data.award?.amount_max
      ? `${data.award.currency ?? ""} ${data.award.amount_min} – ${data.award.amount_max}`
      : data.award?.amount_min
        ? `From ${data.award.currency ?? ""} ${data.award.amount_min}`
        : data.award?.amount_max
          ? `Up to ${data.award.currency ?? ""} ${data.award.amount_max}`
          : "N/A";

  container.innerHTML = `
    <section class="details-hero">
      <h1 class="details-name">${data.name ?? "Untitled"}</h1>
      <p class="details-sponsor">${data.sponsor ?? ""}${data.sponsor_type ? ` · ${data.sponsor_type}` : ""}</p>
    </section>

    <div class="details-grid">
      <section class="details-card">
        <h2>Award</h2>
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span>${amountRange}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Basis</span>
          <span>${data.award?.basis ?? "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Renewable</span>
          <span>${renewable}</span>
        </div>
        ${data.award?.notes ? `<p class="detail-notes">${data.award.notes}</p>` : ""}
      </section>

      <section class="details-card">
        <h2>Deadline</h2>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span>${data.deadline?.date ?? "N/A"}</span>
        </div>
        ${data.deadline?.notes ? `<p class="detail-notes">${data.deadline.notes}</p>` : ""}
      </section>

      <section class="details-card">
        <h2>Eligibility</h2>
        <div class="detail-row">
          <span class="detail-label">Residency</span>
          <span>${data.eligibility?.residency ?? "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Education level</span>
          <span>${data.eligibility?.education_level ?? "-"}</span>
        </div>
        ${
          data.eligibility?.other?.length
            ? `<div class="detail-row detail-row-col">
              <span class="detail-label">Other requirements</span>
              <ol class="detail-list">
                ${data.eligibility.other.map((item) => `<li>${item}</li>`).join("")}
              </ol>
            </div>`
            : ""
        }
      </section>

      <section class="details-card details-links">
        <h2>Links</h2>
        ${data.links?.info_url ? `<a class="link-btn" href="${data.links.info_url}" target="_blank" rel="noopener">More info</a>` : ""}
        ${data.links?.apply_url ? `<a class="link-btn link-btn-primary" href="${data.links.apply_url}" target="_blank" rel="noopener">Apply now</a>` : ""}
      </section>
    </div>
  `;
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
    document.querySelector("#details-container").innerHTML =
      "<p class='empty-state'>Failed to load scholarship details.</p>";
  }
}

init();
