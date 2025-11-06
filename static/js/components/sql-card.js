/**
 * SQL Card Component
 *
 * Displays AI-generated SQL queries with syntax highlighting, actions, and metadata.
 * Core component for showing the NL → SQL transformation result.
 */

import toastManager from '../utils/toast.js';

/**
 * Create a SQL card element for displaying generated queries
 * @param {string} sql - The SQL query to display
 * @param {object} options - Configuration options
 * @returns {HTMLElement} The SQL card element
 */
export function createSqlCard(sql, options = {}) {
  const {
    queryType = detectQueryType(sql),
    executionTime = null,
    showActions = true,
    onExecute = null,
    onEdit = null,
    compact = false
  } = options;

  const card = document.createElement('div');
  card.className = `
    sql-card group
    bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30
    border border-blue-200 dark:border-blue-800
    rounded-lg overflow-hidden
    transition-all duration-200
    hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700
    ${compact ? 'p-3' : 'p-4'}
  `.trim().replace(/\s+/g, ' ');

  // Header with query type and execution time
  const header = createCardHeader(queryType, executionTime);

  // SQL code block with syntax highlighting
  const codeBlock = createCodeBlock(sql, compact);

  // Action buttons (if enabled)
  const actions = showActions ? createActionButtons(sql, onExecute, onEdit) : null;

  card.appendChild(header);
  card.appendChild(codeBlock);
  if (actions) card.appendChild(actions);

  return card;
}

/**
 * Create card header with metadata
 */
function createCardHeader(queryType, executionTime) {
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between mb-3';

  const leftSection = document.createElement('div');
  leftSection.className = 'flex items-center gap-2';

  // SQL icon
  const icon = document.createElement('div');
  icon.className = 'text-blue-600 dark:text-blue-400';
  icon.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
    </svg>
  `;

  // Query type badge
  const badge = document.createElement('span');
  badge.className = `
    px-2 py-0.5 text-xs font-semibold rounded
    ${getQueryTypeBadgeClass(queryType)}
  `.trim().replace(/\s+/g, ' ');
  badge.textContent = queryType;

  leftSection.appendChild(icon);
  leftSection.appendChild(badge);

  // Execution time (if available)
  const rightSection = document.createElement('div');
  if (executionTime !== null) {
    rightSection.className = 'text-xs text-gray-600 dark:text-gray-400 font-mono';
    rightSection.textContent = `${executionTime}ms`;
  }

  header.appendChild(leftSection);
  header.appendChild(rightSection);

  return header;
}

/**
 * Create code block with syntax highlighting
 */
function createCodeBlock(sql, compact) {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative group/code';

  const pre = document.createElement('pre');
  pre.className = `
    bg-gray-900 dark:bg-black/50 rounded-md overflow-x-auto
    ${compact ? 'p-3 text-xs' : 'p-4 text-sm'}
  `.trim().replace(/\s+/g, ' ');

  const code = document.createElement('code');
  code.className = 'language-sql text-gray-100 font-mono leading-relaxed';
  code.textContent = sql.trim();

  // Apply syntax highlighting if hljs is available
  if (typeof hljs !== 'undefined') {
    try {
      hljs.highlightElement(code);
    } catch (e) {
      console.warn('Syntax highlighting failed:', e);
    }
  }

  // Copy button (appears on hover)
  const copyBtn = document.createElement('button');
  copyBtn.className = `
    absolute top-2 right-2
    opacity-0 group-hover/code:opacity-100
    transition-opacity duration-200
    px-2 py-1 text-xs font-medium
    bg-gray-700 hover:bg-gray-600
    text-gray-200 rounded
    flex items-center gap-1
  `.trim().replace(/\s+/g, ' ');
  copyBtn.innerHTML = `
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>
    Copy
  `;
  copyBtn.onclick = () => copyToClipboard(sql, copyBtn);

  pre.appendChild(code);
  wrapper.appendChild(pre);
  wrapper.appendChild(copyBtn);

  return wrapper;
}

/**
 * Create action buttons row
 */
function createActionButtons(sql, onExecute, onEdit) {
  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800';

  // Execute button
  if (onExecute) {
    const executeBtn = document.createElement('button');
    executeBtn.className = `
      px-3 py-1.5 text-sm font-medium
      bg-blue-600 hover:bg-blue-700
      text-white rounded
      transition-colors duration-200
      flex items-center gap-1.5
    `.trim().replace(/\s+/g, ' ');
    executeBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Execute
    `;
    executeBtn.onclick = () => onExecute(sql);
    actions.appendChild(executeBtn);
  }

  // Edit button
  if (onEdit) {
    const editBtn = document.createElement('button');
    editBtn.className = `
      px-3 py-1.5 text-sm font-medium
      bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
      text-gray-800 dark:text-gray-200 rounded
      transition-colors duration-200
      flex items-center gap-1.5
    `.trim().replace(/\s+/g, ' ');
    editBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
      Edit in SQL Editor
    `;
    editBtn.onclick = () => onEdit(sql);
    actions.appendChild(editBtn);
  }

  // Copy SQL button
  const copyBtn = document.createElement('button');
  copyBtn.className = `
    px-3 py-1.5 text-sm font-medium
    bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
    text-gray-800 dark:text-gray-200 rounded
    transition-colors duration-200
    flex items-center gap-1.5
  `.trim().replace(/\s+/g, ' ');
  copyBtn.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>
    Copy SQL
  `;
  copyBtn.onclick = () => copyToClipboard(sql, copyBtn);
  actions.appendChild(copyBtn);

  return actions;
}

/**
 * Detect query type from SQL string
 */
function detectQueryType(sql) {
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith('SELECT')) {
    // Check for JOIN operations
    if (/\b(INNER|LEFT|RIGHT|FULL|CROSS)\s+JOIN\b/i.test(sql)) {
      return 'SELECT JOIN';
    }
    // Check for aggregations
    if (/\b(COUNT|SUM|AVG|MAX|MIN|GROUP BY)\b/i.test(sql)) {
      return 'SELECT AGG';
    }
    return 'SELECT';
  }

  if (normalized.startsWith('INSERT')) return 'INSERT';
  if (normalized.startsWith('UPDATE')) return 'UPDATE';
  if (normalized.startsWith('DELETE')) return 'DELETE';
  if (normalized.startsWith('CREATE')) return 'CREATE';
  if (normalized.startsWith('ALTER')) return 'ALTER';
  if (normalized.startsWith('DROP')) return 'DROP';

  return 'QUERY';
}

/**
 * Get badge color classes for query type
 */
function getQueryTypeBadgeClass(queryType) {
  const baseClass = 'uppercase';

  switch (queryType) {
    case 'SELECT':
    case 'SELECT JOIN':
    case 'SELECT AGG':
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
    case 'INSERT':
    case 'UPDATE':
    case 'DELETE':
      return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
    case 'CREATE':
    case 'ALTER':
      return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
    case 'DROP':
      return `${baseClass} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
  }
}

/**
 * Copy text to clipboard with feedback
 */
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);

    // Visual feedback
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Copied!
    `;
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.disabled = false;
    }, 2000);

    toastManager.success('SQL copied to clipboard');
  } catch (err) {
    console.error('Copy failed:', err);
    toastManager.error('Failed to copy to clipboard');
  }
}

/**
 * Helper function to create a minimal SQL preview (for result cards)
 */
export function createSqlPreview(sql, maxLength = 60) {
  const trimmed = sql.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
}

export default createSqlCard;
