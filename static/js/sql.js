// static/js/sql.js

import { renderQueryResults, clearTable } from "./ui.js";
import toastManager from "./utils/toast.js";

// —————————————————————————————————————————————————————————
// 1) fetchDatabases: Populate the <select id="databases"> on load
// —————————————————————————————————————————————————————————
export async function fetchDatabases(elements) {
  try {
    const resp = await fetch("/get_databases");
    const data = await resp.json();
    if (data.status === "success") {
      const frag = document.createDocumentFragment();

      // Add placeholder option first
      const placeholderOpt = document.createElement("option");
      placeholderOpt.value = "";
      placeholderOpt.textContent = "Select database...";
      frag.appendChild(placeholderOpt);

      data.databases.forEach((db) => {
        const opt = document.createElement("option");
        opt.value = db;
        opt.textContent = db;
        frag.appendChild(opt);
      });
      elements.databasesDropdown.appendChild(frag);
      return { status: 'success', databases: data.databases };
    }
    return { status: 'error', message: data.message || 'No databases' };
  } catch {
    toastManager.error("Failed to fetch databases");
    return { status: 'error', message: 'Fetch failed' };
  }
}

// —————————————————————————————————————————————————————————
// 2) handleConnectDb: Called when user clicks "Connect"
// —————————————————————————————————————————————————————————
export async function handleConnectDb(elements) {
  const dbName = elements.databasesDropdown.value;
  if (!dbName) return;

  const originalContent = elements.setButtonLoading ? elements.setButtonLoading(elements.connectDbButton) : null;

  try {
    const resp = await fetch("/connect_db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db_name: dbName }),
    });
    const data = await resp.json();

    if (data.status === "connected") {
      // Update connection status UI with database name
      if (typeof window.updateConnectionStatus === 'function') {
        window.updateConnectionStatus(true, dbName);
      }
      toastManager.success(`Connected to database: ${dbName}`);
    } else {
      toastManager.error(data.message || "Failed to connect to database");
    }
  } catch (error) {
    console.error('Database connection error:', error);
    toastManager.error("Failed to connect to the database");
  } finally {
    if (elements.clearButtonLoading) {
      elements.clearButtonLoading(elements.connectDbButton, originalContent);
    } else {
      elements.connectDbButton.disabled = false;
      if (originalContent !== null) elements.connectDbButton.innerHTML = originalContent;
    }
  }
}

// —————————————————————————————————————————————————————————
// 3) executeSqlString: Called both from "Run" buttons and "Execute" editor
// —————————————————————————————————————————————————————————
export async function executeSqlString(elements, sqlText) {
  // Prevent executing queries if server is not connected
  if (!elements?.serverConnected) {
    toastManager.error('Not connected to any database server');
    return;
  }

  let queryStatus = 'error'; // Track query status for history

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
      queryStatus = 'success';
      // renderQueryResults already shows success toast, don't duplicate
      renderQueryResults(elements, fields, rows);
    } else {
      // Show error message from backend
      toastManager.error(data.message || "Query execution failed");
    }
  } catch (error) {
    console.error('Query execution error:', error);
    toastManager.error("Network error: Failed to execute query");
  } finally {
    // Add query to history
    if (elements.queryHistoryAPI) {
      elements.queryHistoryAPI.addQuery(sqlText, queryStatus);
    }
  }
}
