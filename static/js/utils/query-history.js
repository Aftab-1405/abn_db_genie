/**
 * Query History Manager
 *
 * Manages SQL query history with localStorage persistence
 */

import toastManager from './toast.js';

const HISTORY_KEY = 'sql_query_history';
const MAX_HISTORY_ITEMS = 20;

class QueryHistory {
  constructor() {
    this.history = this.loadHistory();
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load query history:', error);
      return [];
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save query history:', error);
    }
  }

  /**
   * Add a query to history
   */
  addQuery(query, status = 'success') {
    // Don't add empty queries
    if (!query || !query.trim()) return;

    // Don't add duplicates of the most recent query
    if (this.history.length > 0 && this.history[0].query === query.trim()) {
      return;
    }

    const historyItem = {
      id: Date.now(),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      status: status // 'success' or 'error'
    };

    // Add to beginning of array
    this.history.unshift(historyItem);

    // Keep only MAX_HISTORY_ITEMS
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveHistory();
  }

  /**
   * Get all history items
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear all history
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Get query by ID
   */
  getQueryById(id) {
    return this.history.find(item => item.id === id);
  }

  /**
   * Delete query by ID
   */
  deleteQuery(id) {
    this.history = this.history.filter(item => item.id !== id);
    this.saveHistory();
  }
}

// Create singleton instance
const queryHistory = new QueryHistory();

/**
 * Initialize query history UI
 */
export function initQueryHistory(elements) {
  const toggleBtn = document.getElementById('toggle-history-btn');
  const sidebar = document.getElementById('query-history-sidebar');
  const historyList = document.getElementById('query-history-list');
  const clearBtn = document.getElementById('clear-history-btn');

  if (!toggleBtn || !sidebar || !historyList) {
    console.warn('Query history elements not found');
    return;
  }

  // Toggle history sidebar
  toggleBtn.addEventListener('click', () => {
    const isHidden = sidebar.classList.contains('hidden');
    if (isHidden) {
      sidebar.classList.remove('hidden');
      sidebar.classList.add('flex');
      toggleBtn.classList.add('app-surface-secondary');
      renderHistory();
    } else {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('flex');
      toggleBtn.classList.remove('app-surface-secondary');
    }
  });

  // Clear history
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all query history?')) {
        queryHistory.clearHistory();
        renderHistory();
        toastManager.success('Query history cleared');
      }
    });
  }

  /**
   * Render history list
   */
  function renderHistory() {
    const history = queryHistory.getHistory();

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="text-xs app-text-secondary text-center py-8">
          No query history yet
        </div>
      `;
      return;
    }

    historyList.innerHTML = history.map(item => createHistoryItem(item)).join('');

    // Add click handlers
    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const item = queryHistory.getQueryById(id);
        if (item && elements.sqlEditor) {
          elements.sqlEditor.setValue(item.query);
          elements.sqlEditor.focus();
          toastManager.info('Query loaded from history');
        }
      });
    });

    // Add delete handlers
    historyList.querySelectorAll('.delete-history-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        queryHistory.deleteQuery(id);
        renderHistory();
        toastManager.success('Query removed from history');
      });
    });
  }

  /**
   * Create history item HTML
   */
  function createHistoryItem(item) {
    const date = new Date(item.timestamp);
    const timeAgo = getTimeAgo(date);
    const preview = item.query.length > 60
      ? item.query.substring(0, 60) + '...'
      : item.query;

    const statusIcon = item.status === 'success'
      ? '<svg class="w-3 h-3 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
      : '<svg class="w-3 h-3 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>';

    return `
      <div class="history-item group relative p-2 rounded-lg app-surface hover:app-surface-secondary cursor-pointer transition-all border app-border" data-id="${item.id}">
        <div class="flex items-start gap-2">
          <div class="flex-shrink-0 mt-0.5">${statusIcon}</div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-mono app-text leading-relaxed break-words">${escapeHtml(preview)}</p>
            <p class="text-xs app-text-secondary mt-1">${timeAgo}</p>
          </div>
          <button class="delete-history-item opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-red-500/10 rounded transition-all" data-id="${item.id}">
            <svg class="w-3 h-3 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get time ago string
   */
  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial render
  renderHistory();

  // Return API for external use
  return {
    addQuery: (query, status) => {
      queryHistory.addQuery(query, status);
      if (!sidebar.classList.contains('hidden')) {
        renderHistory();
      }
    },
    refresh: () => renderHistory()
  };
}

export default queryHistory;
