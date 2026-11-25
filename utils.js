const SAVED_KEY = "saved_scholarships";

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
