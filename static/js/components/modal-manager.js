// static/js/components/modal-manager.js

/**
 * Modal Manager - Handles query result modals, table rendering, and visualization setup
 * Manages SQL query results display and data visualization preparation
 */

import createDataTable from './data-table.js';
import toastManager from '../utils/toast.js';

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

// Render SQL query results using enhanced data table component
export function renderQueryResults(elements, fields, rows, metadata = {}) {
  showModal(elements);

  // Get the container that holds the table
  const tableContainer = elements.queryResultTable.parentElement;

  // Handle empty results
  if (fields.length === 0 && rows.length === 0) {
    tableContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Data Returned</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">The query executed successfully but returned no results.</p>
      </div>
    `;
    setupShowVizButton(fields, rows);
    return;
  }

  // Clear old content and render new enhanced table
  tableContainer.innerHTML = '';
  const dataTable = createDataTable(fields, rows, metadata);
  tableContainer.appendChild(dataTable);

  setupShowVizButton(fields, rows);

  // Show success toast with row count
  toastManager.success(`Query returned ${rows.length.toLocaleString()} row${rows.length !== 1 ? 's' : ''}`);
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
      // open the visualization tool in a new tab (root-relative)
      window.open("/static/visualize.html", "_blank");
    } catch (err) {
      console.error("Failed to store visualization data:", err);
      alert("Could not prepare visualization data.");
    }
  });

  // visualization preview removed; preview handled on dedicated visualize.html
}
