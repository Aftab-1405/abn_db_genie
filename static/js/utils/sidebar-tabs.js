/**
 * Sidebar Tabs Manager
 *
 * Handles tab switching in the sidebar between Database and Conversations views
 */

const TAB_STORAGE_KEY = 'sidebar_active_tab';
const DEFAULT_TAB = 'database';

class SidebarTabs {
  constructor() {
    this.activeTab = this.loadActiveTab();
    this.tabs = document.querySelectorAll('.sidebar-tab');
    this.tabContents = document.querySelectorAll('.tab-content');

    this.init();
  }

  /**
   * Initialize tab functionality
   */
  init() {
    // Attach click handlers to tabs
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Show the active tab (from localStorage or default)
    this.switchTab(this.activeTab, false);
  }

  /**
   * Switch to a specific tab
   */
  switchTab(tabName, saveToStorage = true) {
    console.log('[SidebarTabs] Switching to tab:', tabName);

    // Remove active class from all tabs and contents
    this.tabs.forEach(tab => tab.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`.sidebar-tab[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`tab-content-${tabName}`);

    console.log('[SidebarTabs] Selected tab element:', selectedTab);
    console.log('[SidebarTabs] Selected content element:', selectedContent);

    if (selectedTab && selectedContent) {
      selectedTab.classList.add('active');
      selectedContent.classList.add('active');
      this.activeTab = tabName;

      console.log('[SidebarTabs] Active classes added. Content classes:', selectedContent.className);

      // Save to localStorage for persistence
      if (saveToStorage) {
        this.saveActiveTab(tabName);
      }

      // Handle empty state visibility for database tab
      if (tabName === 'database') {
        this.updateDatabaseEmptyState();
      }
    } else {
      console.error('[SidebarTabs] Could not find tab or content for:', tabName);
    }
  }

  /**
   * Update database empty state visibility based on connection status
   */
  updateDatabaseEmptyState() {
    const emptyState = document.getElementById('database-empty-state');
    const explorerSection = document.getElementById('database-explorer-section');

    if (emptyState && explorerSection) {
      // Show empty state if explorer is hidden (no database connected)
      const isExplorerVisible = explorerSection.style.display !== 'none';
      emptyState.style.display = isExplorerVisible ? 'none' : 'flex';
    }
  }

  /**
   * Load active tab from localStorage
   */
  loadActiveTab() {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      return saved || DEFAULT_TAB;
    } catch (error) {
      console.warn('Failed to load active tab from localStorage:', error);
      return DEFAULT_TAB;
    }
  }

  /**
   * Save active tab to localStorage
   */
  saveActiveTab(tabName) {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tabName);
    } catch (error) {
      console.warn('Failed to save active tab to localStorage:', error);
    }
  }

  /**
   * Get current active tab name
   */
  getActiveTab() {
    return this.activeTab;
  }
}

/**
 * Initialize sidebar tabs
 */
export function initSidebarTabs() {
  return new SidebarTabs();
}

export default SidebarTabs;
