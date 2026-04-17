const state = {
  all: [],
  filtered: [],
};

const els = {
  totalCount: document.getElementById("totalCount"),
  filteredCount: document.getElementById("filteredCount"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  divisionFilter: document.getElementById("divisionFilter"),
  sortFilter: document.getElementById("sortFilter"),
  resetBtn: document.getElementById("resetBtn"),
  results: document.getElementById("results"),
  cardTemplate: document.getElementById("cardTemplate"),
};

async function init() {
  const res = await fetch("./data.json");
  const json = await res.json();
  state.all = json.destinations || [];
  els.totalCount.textContent = state.all.length;
  populateFilters();
  bindEvents();
  applyFilters();
}

function populateFilters() {
  const categories = new Set();
  const divisions = new Set();

  state.all.forEach((item) => {
    (item.categories || []).forEach((c) => categories.add(c));
    if (item.location?.division) divisions.add(item.location.division);
  });

  [...categories].sort().forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = titleize(category);
    els.categoryFilter.appendChild(option);
  });

  [...divisions].sort().forEach((division) => {
    const option = document.createElement("option");
    option.value = division;
    option.textContent = division;
    els.divisionFilter.appendChild(option);
  });
}

function bindEvents() {
  els.searchInput.addEventListener("input", applyFilters);
  els.categoryFilter.addEventListener("change", applyFilters);
  els.divisionFilter.addEventListener("change", applyFilters);
  els.sortFilter.addEventListener("change", applyFilters);
  els.resetBtn.addEventListener("click", () => {
    els.searchInput.value = "";
    els.categoryFilter.value = "all";
    els.divisionFilter.value = "all";
    els.sortFilter.value = "name-asc";
    applyFilters();
  });
}

function applyFilters() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const division = els.divisionFilter.value;
  const sort = els.sortFilter.value;

  let list = state.all.filter((item) => {
    const haystack = [
      item.name,
      item.slug,
      item.description,
      item.location?.district,
      item.location?.division,
      ...(item.categories || []),
      ...(item.highlights || []),
    ]
      .join(" ")
      .toLowerCase();

    const matchQuery = !query || haystack.includes(query);
    const matchCategory =
      category === "all" || (item.categories || []).includes(category);
    const matchDivision =
      division === "all" || item.location?.division === division;

    return matchQuery && matchCategory && matchDivision;
  });

  list.sort((a, b) => sortItems(a, b, sort));
  state.filtered = list;
  els.filteredCount.textContent = list.length;
  renderCards();
}

function sortItems(a, b, sort) {
  if (sort === "name-desc") return b.name.localeCompare(a.name);
  if (sort === "rating-desc")
    return (b.ratings?.average || 0) - (a.ratings?.average || 0);
  if (sort === "budget-asc")
    return (
      (a.pricing?.average_budget_per_day_bdt?.min || 999999) -
      (b.pricing?.average_budget_per_day_bdt?.min || 999999)
    );
  return a.name.localeCompare(b.name);
}

function renderCards() {
  els.results.innerHTML = "";

  if (!state.filtered.length) {
    els.results.innerHTML =
      '<div class="empty"><h3>No destinations found</h3><p>Try a different search keyword or reset the filters.</p></div>';
    return;
  }

  state.filtered.forEach((item) => {
    const node = els.cardTemplate.content.cloneNode(true);
    node.querySelector(".tag").textContent = titleize(
      item.categories?.[0] || "destination",
    );
    node.querySelector("h3").textContent = item.name;
    node.querySelector(".location").textContent =
      `${item.location?.district || ""}, ${item.location?.division || ""}`.replace(
        /^,\s*|,\s*$/g,
        "",
      );
    node.querySelector(".rating").textContent =
      `★ ${item.ratings?.average || "N/A"}`;
    node.querySelector(".description").textContent =
      item.description || "No description available.";
    node.querySelector(".best-time").textContent =
      item.best_time_to_visit?.season ||
      (item.best_time_to_visit?.months || []).join(", ") ||
      "Year-round";
    node.querySelector(".budget").textContent = formatBudget(
      item.pricing?.average_budget_per_day_bdt,
    );
    node.querySelector(".travel-time").textContent =
      item.transport?.from_dhaka?.estimated_travel_time ||
      firstDuration(item.transport?.from_dhaka?.routes) ||
      "Varies";
    node.querySelector(".route").textContent =
      firstRoute(item.transport?.from_dhaka?.routes) || "See local transport";

    fillList(node.querySelector(".highlights"), item.highlights || []);
    fillList(node.querySelector(".activities"), item.activities || []);
    fillList(node.querySelector(".tips"), item.travel_tips || []);
    fillList(
      node.querySelector(".nearby"),
      (item.nearby_places || []).map(
        (p) => `${p.name}${p.distance_km ? ` (${p.distance_km} km)` : ""}`,
      ),
    );

    const chips = node.querySelector(".chips");
    (item.categories || []).slice(0, 5).forEach((cat) => {
      const span = document.createElement("span");
      span.textContent = titleize(cat);
      chips.appendChild(span);
    });

    els.results.appendChild(node);
  });
}

function fillList(element, items) {
  element.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "Not available";
    element.appendChild(li);
    return;
  }
  items.slice(0, 5).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function formatBudget(budget) {
  if (!budget?.min && !budget?.max) return "N/A";
  return `${budget.min || 0}-${budget.max || 0} BDT`;
}

function firstRoute(routes = []) {
  return routes[0]?.route || "";
}

function firstDuration(routes = []) {
  return routes[0]?.duration || "";
}

function titleize(text = "") {
  return text.replace(/[_-]/g, " ").replace(/\w/g, (m) => m.toUpperCase());
}

init().catch((err) => {
  console.error(err);
  els.results.innerHTML =
    '<div class="empty"><h3>Failed to load data</h3><p>Please run this project through a local server so fetch can read data.json.</p></div>';
});
