/**
 * Interactive Data Table Component
 *
 * Displays query results with sorting, filtering, and export capabilities.
 * Enhances the core goal by making result analysis faster and more effective.
 */

import toastManager from '../utils/toast.js';

/**
 * Create an interactive data table from query results
 * @param {Array} columns - Column names
 * @param {Array} rows - Row data
 * @param {object} metadata - Query metadata (execution time, row count, etc.)
 * @returns {HTMLElement} The data table container
 */
export function createDataTable(columns, rows, metadata = {}) {
  const container = document.createElement('div');
  container.className = 'data-table-container flex flex-col h-full';

  // Metadata bar at top
  const metadataBar = createMetadataBar(columns, rows, metadata);

  // Filter/search bar
  const filterBar = createFilterBar();

  // Table wrapper with scroll
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700';

  // Create table
  const table = createTable(columns, rows);
  tableWrapper.appendChild(table);

  // Action bar at bottom (export, etc.)
  const actionBar = createActionBar(columns, rows);

  container.appendChild(metadataBar);
  container.appendChild(filterBar);
  container.appendChild(tableWrapper);
  container.appendChild(actionBar);

  // Set up interactivity
  setupTableInteractivity(container, table, columns, rows);

  return container;
}

/**
 * Create metadata bar showing result statistics
 */
function createMetadataBar(columns, rows, metadata) {
  const bar = document.createElement('div');
  bar.className = 'flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg border-b border-gray-200 dark:border-gray-700';

  const leftSection = document.createElement('div');
  leftSection.className = 'flex items-center gap-4 text-sm';

  // Row count
  const rowCount = document.createElement('div');
  rowCount.className = 'flex items-center gap-2';
  rowCount.innerHTML = `
    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
    <span class="font-semibold text-gray-700 dark:text-gray-300">${rows.length.toLocaleString()}</span>
    <span class="text-gray-500">rows</span>
  `;

  // Column count
  const colCount = document.createElement('div');
  colCount.className = 'flex items-center gap-2';
  colCount.innerHTML = `
    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
    </svg>
    <span class="font-semibold text-gray-700 dark:text-gray-300">${columns.length}</span>
    <span class="text-gray-500">columns</span>
  `;

  leftSection.appendChild(rowCount);
  leftSection.appendChild(colCount);

  const rightSection = document.createElement('div');
  rightSection.className = 'flex items-center gap-4 text-sm';

  // Execution time (if available)
  if (metadata.executionTime) {
    const timeInfo = document.createElement('div');
    timeInfo.className = 'flex items-center gap-2 text-gray-600 dark:text-gray-400';
    timeInfo.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="font-mono">${metadata.executionTime}ms</span>
    `;
    rightSection.appendChild(timeInfo);
  }

  // Truncation warning (if applicable)
  if (metadata.truncated) {
    const warning = document.createElement('div');
    warning.className = 'flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium';
    warning.innerHTML = `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      Results truncated (${metadata.totalRows?.toLocaleString()} total)
    `;
    rightSection.appendChild(warning);
  }

  bar.appendChild(leftSection);
  bar.appendChild(rightSection);

  return bar;
}

/**
 * Create filter/search bar
 */
function createFilterBar() {
  const bar = document.createElement('div');
  bar.className = 'flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700';

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'relative flex-1 max-w-md';

  const searchIcon = document.createElement('div');
  searchIcon.className = 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400';
  searchIcon.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  `;

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search in results...';
  searchInput.className = `
    w-full pl-10 pr-4 py-2 text-sm
    bg-gray-50 dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    dark:focus:ring-blue-600
    transition-colors
  `.trim().replace(/\s+/g, ' ');
  searchInput.dataset.tableFilter = 'search';

  searchWrapper.appendChild(searchIcon);
  searchWrapper.appendChild(searchInput);
  bar.appendChild(searchWrapper);

  return bar;
}

/**
 * Create the actual HTML table
 */
function createTable(columns, rows) {
  const table = document.createElement('table');
  table.className = 'min-w-full divide-y divide-gray-200 dark:divide-gray-700';

  // Header
  const thead = document.createElement('thead');
  thead.className = 'bg-gray-50 dark:bg-gray-800 sticky top-0 z-10';

  const headerRow = document.createElement('tr');
  columns.forEach((col, index) => {
    const th = document.createElement('th');
    th.className = `
      px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider
      cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
      user-select-none group
    `.trim().replace(/\s+/g, ' ');
    th.dataset.columnIndex = index;
    th.dataset.sortDirection = 'none';

    const content = document.createElement('div');
    content.className = 'flex items-center justify-between gap-2';

    const colName = document.createElement('span');
    colName.textContent = col;

    const sortIcon = document.createElement('span');
    sortIcon.className = 'sort-icon opacity-0 group-hover:opacity-50 transition-opacity';
    sortIcon.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    `;

    content.appendChild(colName);
    content.appendChild(sortIcon);
    th.appendChild(content);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  tbody.className = 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700';

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
    tr.dataset.rowIndex = rowIndex;

    row.forEach((cell, colIndex) => {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap';
      td.dataset.columnIndex = colIndex;

      if (cell === null || cell === undefined) {
        td.innerHTML = '<span class="text-gray-400 italic">NULL</span>';
      } else {
        td.textContent = cell;
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  return table;
}

/**
 * Create action bar with export buttons
 */
function createActionBar(columns, rows) {
  const bar = document.createElement('div');
  bar.className = 'flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700';

  const label = document.createElement('span');
  label.className = 'text-sm text-gray-600 dark:text-gray-400';
  label.textContent = 'Export:';

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'flex items-center gap-2';

  // CSV Export
  const csvBtn = createExportButton('CSV', 'csv', () => exportToCSV(columns, rows));
  buttonGroup.appendChild(csvBtn);

  // JSON Export
  const jsonBtn = createExportButton('JSON', 'json', () => exportToJSON(columns, rows));
  buttonGroup.appendChild(jsonBtn);

  // Copy to Clipboard
  const copyBtn = createExportButton('Copy', 'copy', () => copyTableToClipboard(columns, rows));
  buttonGroup.appendChild(copyBtn);

  bar.appendChild(label);
  bar.appendChild(buttonGroup);

  return bar;
}

/**
 * Create an export button
 */
function createExportButton(label, icon, onClick) {
  const btn = document.createElement('button');
  btn.className = `
    px-3 py-1.5 text-sm font-medium
    bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
    text-gray-700 dark:text-gray-200
    border border-gray-300 dark:border-gray-600
    rounded transition-colors
    flex items-center gap-2
  `.trim().replace(/\s+/g, ' ');

  btn.textContent = label;
  btn.onclick = onClick;

  return btn;
}

/**
 * Set up table interactivity (sorting, filtering)
 */
function setupTableInteractivity(container, table, columns, originalRows) {
  let currentRows = [...originalRows];
  let sortState = { column: null, direction: 'none' };

  // Sorting
  const headers = table.querySelectorAll('thead th');
  headers.forEach(th => {
    th.addEventListener('click', () => {
      const columnIndex = parseInt(th.dataset.columnIndex);
      const currentDirection = th.dataset.sortDirection;

      // Reset all other headers
      headers.forEach(h => {
        h.dataset.sortDirection = 'none';
        const icon = h.querySelector('.sort-icon');
        if (icon) icon.classList.remove('opacity-100');
      });

      // Determine new direction
      let newDirection;
      if (currentDirection === 'none') newDirection = 'asc';
      else if (currentDirection === 'asc') newDirection = 'desc';
      else newDirection = 'none';

      th.dataset.sortDirection = newDirection;
      const sortIcon = th.querySelector('.sort-icon');
      if (sortIcon) {
        sortIcon.classList.toggle('opacity-100', newDirection !== 'none');
        sortIcon.classList.toggle('opacity-0', newDirection === 'none');
      }

      // Sort rows
      if (newDirection === 'none') {
        currentRows = [...originalRows];
      } else {
        currentRows.sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];

          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;

          let comparison = 0;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          } else {
            comparison = String(aVal).localeCompare(String(bVal));
          }

          return newDirection === 'asc' ? comparison : -comparison;
        });
      }

      sortState = { column: columnIndex, direction: newDirection };
      updateTableBody(table, currentRows);
    });
  });

  // Filtering
  const searchInput = container.querySelector('[data-table-filter="search"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      if (!searchTerm) {
        // Show all rows
        currentRows = [...originalRows];
        if (sortState.direction !== 'none') {
          // Reapply sort
          headers[sortState.column].click();
        } else {
          updateTableBody(table, currentRows);
        }
        return;
      }

      // Filter rows
      currentRows = originalRows.filter(row => {
        return row.some(cell => {
          if (cell === null || cell === undefined) return false;
          return String(cell).toLowerCase().includes(searchTerm);
        });
      });

      updateTableBody(table, currentRows);
    });
  }
}

/**
 * Update table body with new rows
 */
function updateTableBody(table, rows) {
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
    tr.dataset.rowIndex = rowIndex;

    row.forEach((cell, colIndex) => {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap';
      td.dataset.columnIndex = colIndex;

      if (cell === null || cell === undefined) {
        td.innerHTML = '<span class="text-gray-400 italic">NULL</span>';
      } else {
        td.textContent = cell;
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

/**
 * Export table to CSV
 */
function exportToCSV(columns, rows) {
  try {
    let csv = columns.map(col => `"${col}"`).join(',') + '\n';

    rows.forEach(row => {
      csv += row.map(cell => {
        if (cell === null || cell === undefined) return '""';
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(',') + '\n';
    });

    downloadFile(csv, 'query_results.csv', 'text/csv');
    toastManager.success('Exported to CSV');
  } catch (err) {
    console.error('CSV export failed:', err);
    toastManager.error('Failed to export CSV');
  }
}

/**
 * Export table to JSON
 */
function exportToJSON(columns, rows) {
  try {
    const data = rows.map(row => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'query_results.json', 'application/json');
    toastManager.success('Exported to JSON');
  } catch (err) {
    console.error('JSON export failed:', err);
    toastManager.error('Failed to export JSON');
  }
}

/**
 * Copy table to clipboard
 */
async function copyTableToClipboard(columns, rows) {
  try {
    let text = columns.join('\t') + '\n';
    rows.forEach(row => {
      text += row.map(cell => cell === null || cell === undefined ? '' : cell).join('\t') + '\n';
    });

    await navigator.clipboard.writeText(text);
    toastManager.success('Copied to clipboard');
  } catch (err) {
    console.error('Copy failed:', err);
    toastManager.error('Failed to copy to clipboard');
  }
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default createDataTable;
