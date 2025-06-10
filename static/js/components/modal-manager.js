// static/js/components/modal-manager.js

/**
 * Modal Manager - Handles query result modals, table rendering, and visualization setup
 * Manages SQL query results display and data visualization preparation
 */

let latestFields = [];
let latestRows = [];

// Show query result modal
export function showModal(elements) {
  elements.queryResultModal.classList.replace("hidden", "flex");
}

// Hide query result modal
export function hideModal(elements) {
  elements.queryResultModal.classList.replace("flex", "hidden");
}

// Clear all rows from table
export function clearTable(tableElem) {
  while (tableElem.rows.length > 0) {
    tableElem.deleteRow(0);
  }
}

// Render SQL query results in modal table
export function renderQueryResults(elements, fields, rows) {
  showModal(elements);
  clearTable(elements.queryResultTable);

  // Handle empty results
  if (fields.length === 0 && rows.length === 0) {
    const headerRow = elements.queryResultTable.insertRow(-1);
    const th = document.createElement("th");
    th.textContent = "No data returned";
    th.colSpan = 1;
    th.className = "px-2 py-1 text-center text-sm md:text-base";
    headerRow.appendChild(th);
    setupShowVizButton(fields, rows);
    return;
  }

  // Create table header
  const headerRow = elements.queryResultTable.insertRow(-1);
  fields.forEach((colName) => {
    const th = document.createElement("th");
    th.textContent = colName;
    th.className = "px-2 py-1 text-center text-sm md:text-base";
    headerRow.appendChild(th);
  });

  // Populate table rows
  rows.forEach((rowVals) => {
    const rowElem = elements.queryResultTable.insertRow(-1);
    rowVals.forEach((cellVal) => {
      const td = rowElem.insertCell(-1);
      td.textContent = cellVal;
      td.className = "px-2 py-1 text-center text-sm md:text-base";
    });
  });

  setupShowVizButton(fields, rows);
}

// Setup visualization button for query results
function setupShowVizButton(fields, rows) {
  latestFields = fields.slice();
  latestRows = rows.map((r) => r.slice());

  const showVizBtn = document.getElementById("show-viz-btn");
  document.getElementById("show-viz-container").classList.remove("hidden");

  // Replace button to remove old event listeners
  showVizBtn.replaceWith(showVizBtn.cloneNode(true));
  const freshShowVizBtn = document.getElementById("show-viz-btn");

  freshShowVizBtn.addEventListener("click", () => {
    try {
      sessionStorage.setItem("viz_fields", JSON.stringify(latestFields));
      sessionStorage.setItem("viz_rows", JSON.stringify(latestRows));
      window.open("static/visualize.html", "_blank");
    } catch (err) {
      console.error("Failed to store visualization data:", err);
      alert("Could not prepare visualization data.");
    }
  });
}
