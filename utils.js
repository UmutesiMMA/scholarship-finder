const SAVED_KEY = "saved_scholarships";

//method for fetch handling
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let message;
    try {
      message = (await res.json()).error;
    } catch {}

    const err = new Error(message|| `HTTP${res.status}`);
    err.status = res.statusl
    throw err
  }
  return res.json();
}

//methods for save functionality
function getSaved() {
  return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
}

function toggleSave(id) {
  const saved = getSaved();
  const index = saved.indexOf(id);
  const isSaved = index !== -1;

  if (!isSaved) {
    saved.push(id);
  } else {
    saved.splice(index, 1);
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return !isSaved;
}
