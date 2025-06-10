// static/js/sql.js

import { showNotification, renderQueryResults, clearTable } from "./ui.js";

// —————————————————————————————————————————————————————————
// 1) fetchDatabases: Populate the <select id="databases"> on load
// —————————————————————————————————————————————————————————
export async function fetchDatabases(elements) {
  try {
    const resp = await fetch("/get_databases");
    const data = await resp.json();
    if (data.status === "success") {
      const frag = document.createDocumentFragment();
      data.databases.forEach((db) => {
        const opt = document.createElement("option");
        opt.value = db;
        opt.textContent = db;
        frag.appendChild(opt);
      });
      elements.databasesDropdown.appendChild(frag);
    }
  } catch {
    showNotification(elements, "Failed to fetch databases", "error");
  }
}

// —————————————————————————————————————————————————————————
// 2) handleConnectDb: Called when user clicks “Connect”
// —————————————————————————————————————————————————————————
export async function handleConnectDb(elements) {
  const dbName = elements.databasesDropdown.value;
  if (!dbName) return;

  const originalContent = elements.connectDbButton.innerHTML;
  elements.connectDbButton.disabled = true;
  elements.connectDbButton.innerHTML = elements.LOADING_SPINNER_HTML;

  try {
    const resp = await fetch("/connect_db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db_name: dbName }),
    });
    const data = await resp.json();
    showNotification(
      elements,
      data.status === "connected"
        ? `Connected to database ${dbName}`
        : data.message,
      data.status === "connected" ? "success" : "error"
    );
  } catch {
    showNotification(elements, "Failed to connect to the database", "error");
  } finally {
    elements.connectDbButton.innerHTML = originalContent;
    elements.connectDbButton.disabled = false;
  }
}

// —————————————————————————————————————————————————————————
// 3) executeSqlString: Called both from “Run” buttons and “Execute” editor
// —————————————————————————————————————————————————————————
export async function executeSqlString(elements, sqlText) {
  try {
    const resp = await fetch("/run_sql_query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql_query: sqlText }),
    });
    const data = await resp.json();

    // Clear any previous table rows
    clearTable(elements.queryResultTable);

    if (data.status === "success" && data.result) {
      const { fields, rows } = data.result;
      renderQueryResults(elements, fields, rows);
      showNotification(elements, data.message, "success");
    } else {
      showNotification(elements, data.message, "error");
    }
  } catch {
    showNotification(elements, "Failed to execute query", "error");
  }
}
