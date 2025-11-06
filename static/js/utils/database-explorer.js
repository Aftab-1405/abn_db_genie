/**
 * Database Explorer
 *
 * Provides a collapsible tree view of database schema (tables and columns)
 */

import toastManager from './toast.js';

class DatabaseExplorer {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentDatabase = null;
    this.tables = [];
    this.expandedTables = new Set(); // Track which tables are expanded
  }

  /**
   * Load and render tables for the current database
   */
  async loadTables(databaseName) {
    if (!databaseName) {
      this.renderEmpty('No database selected');
      return;
    }

    this.currentDatabase = databaseName;
    this.renderLoading();

    try {
      const resp = await fetch('/get_tables');
      const data = await resp.json();

      if (data.status === 'success') {
        this.tables = data.tables || [];
        this.render();
      } else {
        this.renderEmpty(data.message || 'Failed to load tables');
        toastManager.error('Failed to load database tables');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      this.renderEmpty('Error loading tables');
      toastManager.error('Network error: Failed to load tables');
    }
  }

  /**
   * Toggle table expansion to show/hide columns
   */
  async toggleTable(tableName) {
    const isExpanded = this.expandedTables.has(tableName);

    if (isExpanded) {
      // Collapse the table
      this.expandedTables.delete(tableName);
      this.render();
    } else {
      // Expand the table - fetch schema if not already cached
      this.expandedTables.add(tableName);
      await this.loadTableSchema(tableName);
    }
  }

  /**
   * Load schema for a specific table
   */
  async loadTableSchema(tableName) {
    // Show loading state for this table
    this.render();

    try {
      const resp = await fetch('/get_table_schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_name: tableName })
      });

      const data = await resp.json();

      if (data.status === 'success') {
        // Find the table and update its schema
        const tableIndex = this.tables.findIndex(t =>
          (typeof t === 'string' ? t : t.name) === tableName
        );

        if (tableIndex !== -1) {
          // Convert string to object if needed
          if (typeof this.tables[tableIndex] === 'string') {
            this.tables[tableIndex] = {
              name: this.tables[tableIndex],
              schema: data.schema,
              row_count: data.row_count
            };
          } else {
            this.tables[tableIndex].schema = data.schema;
            this.tables[tableIndex].row_count = data.row_count;
          }
          this.render();
        }
      } else {
        toastManager.error(`Failed to load schema for ${tableName}`);
        this.expandedTables.delete(tableName);
        this.render();
      }
    } catch (error) {
      console.error('Error loading table schema:', error);
      toastManager.error('Network error: Failed to load table schema');
      this.expandedTables.delete(tableName);
      this.render();
    }
  }

  /**
   * Render the explorer UI
   */
  render() {
    if (this.tables.length === 0) {
      this.renderEmpty('No tables in this database');
      return;
    }

    const html = this.tables.map(table => this.renderTable(table)).join('');
    this.container.innerHTML = html;

    // Attach event listeners
    this.container.querySelectorAll('.db-explorer-table-header').forEach(header => {
      header.addEventListener('click', () => {
        const tableName = header.dataset.tableName;
        this.toggleTable(tableName);
      });
    });

    // Attach copy column name listeners
    this.container.querySelectorAll('.db-explorer-copy-column').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const columnName = btn.dataset.columnName;
        navigator.clipboard.writeText(columnName).then(() => {
          toastManager.success(`Copied: ${columnName}`);
        });
      });
    });
  }

  /**
   * Render a single table with optional schema
   */
  renderTable(table) {
    const tableName = typeof table === 'string' ? table : table.name;
    const schema = typeof table === 'object' ? table.schema : null;
    const rowCount = typeof table === 'object' ? table.row_count : null;
    const isExpanded = this.expandedTables.has(tableName);
    const isLoading = isExpanded && !schema;

    const chevronIcon = isExpanded
      ? '<svg class="w-3 h-3 app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>'
      : '<svg class="w-3 h-3 app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

    return `
      <div class="db-explorer-table">
        <div class="db-explorer-table-header group flex items-center justify-between px-2 py-1.5 rounded-lg hover:app-surface-secondary cursor-pointer app-transition" data-table-name="${escapeHtml(tableName)}">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            ${chevronIcon}
            <svg class="w-3 h-3 app-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <span class="text-xs app-text font-medium truncate">${escapeHtml(tableName)}</span>
          </div>
          ${rowCount !== null ? `<span class="text-xs app-text-tertiary flex-shrink-0">${formatNumber(rowCount)}</span>` : ''}
        </div>
        ${isExpanded ? this.renderTableContent(tableName, schema, isLoading) : ''}
      </div>
    `;
  }

  /**
   * Render table content (columns)
   */
  renderTableContent(tableName, schema, isLoading) {
    if (isLoading) {
      return `
        <div class="db-explorer-table-content pl-5 pr-2 py-1">
          <div class="text-xs app-text-secondary flex items-center gap-1.5">
            <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading schema...
          </div>
        </div>
      `;
    }

    if (!schema || schema.length === 0) {
      return `
        <div class="db-explorer-table-content pl-5 pr-2 py-1">
          <div class="text-xs app-text-tertiary">No columns found</div>
        </div>
      `;
    }

    const columnsHtml = schema.map(col => this.renderColumn(col)).join('');
    return `
      <div class="db-explorer-table-content pl-5 pr-2 py-1 space-y-0.5">
        ${columnsHtml}
      </div>
    `;
  }

  /**
   * Render a single column
   */
  renderColumn(column) {
    const { name, type, nullable, key_type } = column;
    const isPrimaryKey = key_type === 'PRI';
    const isNullable = nullable === 'YES';

    const keyIcon = isPrimaryKey
      ? '<svg class="w-2.5 h-2.5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"/></svg>'
      : '<svg class="w-2.5 h-2.5 app-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>';

    return `
      <div class="db-explorer-column group flex items-center justify-between px-2 py-0.5 rounded hover:app-surface-secondary app-transition">
        <div class="flex items-center gap-1.5 min-w-0 flex-1">
          ${keyIcon}
          <span class="text-xs app-text font-mono truncate">${escapeHtml(name)}</span>
          <span class="text-xs app-text-tertiary font-mono flex-shrink-0">${escapeHtml(type)}</span>
          ${isNullable ? '<span class="text-xs app-text-tertiary flex-shrink-0">NULL</span>' : ''}
        </div>
        <button class="db-explorer-copy-column opacity-0 group-hover:opacity-100 app-button p-0.5 rounded app-transition"
                data-column-name="${escapeHtml(name)}"
                title="Copy column name">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Render loading state
   */
  renderLoading() {
    this.container.innerHTML = `
      <div class="text-center py-6">
        <svg class="animate-spin h-6 w-6 mx-auto mb-2 app-text-secondary" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs app-text-secondary">Loading tables...</p>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  renderEmpty(message) {
    this.container.innerHTML = `
      <div class="text-center py-6 px-2">
        <svg class="h-8 w-8 mx-auto mb-2 app-text-tertiary opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <p class="text-xs app-text-secondary">${escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Clear the explorer
   */
  clear() {
    this.currentDatabase = null;
    this.tables = [];
    this.expandedTables.clear();
    this.renderEmpty('No database selected');
  }
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper: Format number with commas
 */
function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Initialize database explorer
 */
export function initDatabaseExplorer(containerElement) {
  return new DatabaseExplorer(containerElement);
}

export default DatabaseExplorer;
