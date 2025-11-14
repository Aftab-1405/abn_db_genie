# Templates Documentation

## Overview
This directory contains all HTML templates for the DB-Genie application. Templates use Jinja2 templating engine for server-side rendering.

## Structure

```
templates/
├── auth.html                   # Authentication/login page
├── landing.html                # Marketing/landing page
├── index.html                  # Main application interface
└── fragments/                  # Reusable template components
    ├── chat_area.html          # Main chat interface
    ├── db_connection_modal.html # Database connection dialog
    ├── footer_input.html       # User input area
    ├── header.html             # Application header
    ├── notification_area.html  # Toast notifications
    ├── query_result_modal.html # SQL query results display
    ├── settings_modal.html     # User settings panel
    ├── sidebar.html            # Navigation sidebar
    └── sql_editor_popup.html   # SQL editor panel
```

## Main Templates

### auth.html
**Purpose:** Authentication page for user login/signup
**Features:**
- Email/password authentication
- Google OAuth integration
- Password reset functionality
- Firebase authentication
- Secure credential handling via backend API

**Key Elements:**
- Login form
- Sign up form
- Google Sign-In button
- Password reset dialog

---

### landing.html
**Purpose:** Marketing and introduction page
**Features:**
- Product overview
- Feature highlights
- Call-to-action buttons
- Responsive design

**Routes:** `/` (when not authenticated)

---

### index.html
**Purpose:** Main application interface
**Features:**
- Fragment-based modular structure
- Theme system integration
- Performance optimizations (preloading, deferred scripts)
- Secure Firebase initialization

**Includes:**
- All fragments from `fragments/` directory
- CodeMirror for SQL editing
- Mermaid for diagram rendering
- Highlight.js for syntax highlighting
- Marked for markdown processing

**Routes:** `/index` (requires authentication)

---

## Template Fragments

Fragments are reusable components included in `index.html` using Jinja2's `{% include %}` directive.

### fragments/header.html
**Purpose:** Top navigation bar
**Location:** Top of main interface
**Features:**
- Brand logo
- READ-ONLY mode badge
- SQL Editor toggle button
- Profile dropdown menu with settings and logout

**Key Elements:**
- `#sidebar-toggle` - Mobile menu button
- `#sql-editor-toggle` - Opens SQL editor
- `#profile-btn` - Profile menu trigger
- `#logout-btn` - Logout functionality

---

### fragments/sidebar.html
**Purpose:** Left navigation panel
**Location:** Left side of main interface
**Features:**
- "New Chat" button
- Conversation history list
- Connection status indicator
- Database connection controls
- Theme toggle switch

**Key Elements:**
- `#new-conversation` - Start new conversation
- `#conversation-list` - Past conversations
- `#connect-db` - Database connection button
- `#disconnect-db` - Disconnect button
- `#databases` - Database selector dropdown
- `#theme-toggle` - Dark/light mode switch

**Database Connection States:**
- **Not Connected:** Gray indicator, connect button enabled
- **Server Connected:** Green indicator, dropdown enabled
- **Database Selected:** Pulsing green indicator, ready for queries

---

### fragments/chat_area.html
**Purpose:** Main chat interface
**Location:** Center of application
**Features:**
- Centered AI logo (when no messages)
- Message history display
- Real-time message streaming
- Code syntax highlighting
- Diagram rendering (Mermaid)

**Key Elements:**
- `#ai-logo-container` - Centered logo placeholder
- `#chat` - Message container

**Message Types:**
- User messages (right-aligned)
- AI responses (left-aligned with typing animation)
- Code blocks with copy functionality
- Tables and diagrams

---

### fragments/footer_input.html
**Purpose:** User input area
**Location:** Bottom of main interface
**Features:**
- Auto-resizing textarea
- Send button with icon
- Keyboard shortcuts (Enter to send)
- Placeholder text

**Key Elements:**
- `#text-input` - Main input textarea
- `#send-icon` - Send message button

---

### fragments/db_connection_modal.html
**Purpose:** Database connection dialog
**Features:**
- MySQL connection form
- Input validation
- Secure credential handling
- Loading states

**Form Fields:**
- Host (default: localhost)
- Port (default: 3306)
- Username
- Password

**Key Elements:**
- `#db-connection-modal` - Modal container
- `#db-connection-form` - Connection form
- `#db-connection-submit` - Connect button
- `#db-connection-cancel` - Cancel button

**Workflow:**
1. User clicks "Connect" in sidebar
2. Modal opens with connection form
3. User enters MySQL credentials
4. On submit, connects to server
5. Loads available databases into dropdown
6. User selects database from dropdown
7. Ready to query

---

### fragments/sql_editor_popup.html
**Purpose:** SQL query editor panel
**Location:** Right side slide-out panel
**Features:**
- CodeMirror editor
- SQL syntax highlighting
- Dark/light theme support
- Query execution
- Keyboard shortcuts (Ctrl+Shift+S to toggle)

**Key Elements:**
- `#sql-editor-popup` - Panel container
- `#sql-editor` - CodeMirror textarea
- `#execute-query` - Execute button
- `#sql-editor-close` - Close button

**Editor Features:**
- Auto-closing brackets
- Bracket matching
- Active line highlighting
- SQL mode with completion

---

### fragments/query_result_modal.html
**Purpose:** Display SQL query results
**Features:**
- Tabular data display
- Scrollable results
- Export options
- Visualization button (links to visualize.html)

**Key Elements:**
- `#query-result-modal` - Modal container
- `#query-result-table` - Results table
- `#close-modal` - Close button

**Result Format:**
- Column headers (from SELECT fields)
- Data rows
- Row count indicator
- Execution time

---

### fragments/settings_modal.html
**Purpose:** User settings panel
**Features:**
- User profile display
- Theme preferences
- Account settings
- Application preferences

**Key Elements:**
- `#settings-modal` - Modal container
- `#settings-modal-close` - Close button

**Settings Categories:**
- Profile information
- Theme selection
- Language preferences (future)
- Notification settings (future)

---

### fragments/notification_area.html
**Purpose:** Toast notification system
**Location:** Top-right corner
**Features:**
- Auto-dismiss notifications
- Color-coded by type (success, error, warning, info)
- Smooth animations
- Multiple simultaneous notifications

**Key Elements:**
- `#notification` - Notification container

**Notification Types:**
- **Success:** Green - Operations completed successfully
- **Error:** Red - Failures and errors
- **Warning:** Yellow - Important information
- **Info:** Blue - General information

---

## Template Variables

Templates can receive variables from Flask routes:

```python
@api_bp.route('/index')
@login_required
def index():
    return render_template('index.html')
```

## Best Practices

### 1. Fragment Organization
- Each fragment has a single, clear purpose
- Fragments are independent and reusable
- IDs are unique across all fragments
- Classes follow consistent naming (e.g., `app-surface`, `app-text`)

### 2. Styling
- Use Tailwind CSS utility classes
- Use custom theme classes (`app-*`) for theme-aware colors
- Avoid inline styles (except for dynamic JavaScript updates)
- Follow dark mode conventions

### 3. JavaScript Integration
- Keep fragments markup-only
- JavaScript logic in `/static/js/` modules
- Use data attributes for configuration
- Event delegation for dynamic content

### 4. Accessibility
- Use semantic HTML
- Include ARIA labels
- Ensure keyboard navigation
- Provide tooltips for icon-only buttons

### 5. Performance
- Lazy load non-critical content
- Use `defer` for scripts
- Preload critical resources
- Minimize reflows and repaints

## Adding New Fragments

To create a new fragment:

1. Create HTML file in `fragments/` directory
2. Use semantic HTML and Tailwind classes
3. Add unique IDs for JavaScript interaction
4. Include in `index.html`:
   ```html
   {% include 'fragments/your_fragment.html' %}
   ```
5. Add JavaScript logic in appropriate module
6. Document the fragment in this README

## Theme System

All fragments support dark/light themes using:

- **Theme Classes:** `.dark` class on `<html>` element
- **Custom Properties:** `app-surface`, `app-text`, etc.
- **Automatic Toggle:** Via `#theme-toggle` in sidebar
- **Persistence:** Saved to localStorage

## Security Considerations

### Authentication
- All authenticated pages use `@login_required` decorator
- Firebase auth state checked on page load
- Automatic redirect to `/auth` if not authenticated

### XSS Protection
- User input sanitized with DOMPurify
- Code blocks escaped properly
- Markdown processed securely

### CSRF Protection
- Flask session-based auth
- POST endpoints protected
- Secure cookie settings

## Troubleshooting

### Fragment Not Showing
- Check file path in `{% include %}` directive
- Verify file exists in `fragments/` directory
- Check Flask template paths configuration

### Styles Not Applying
- Ensure Tailwind CSS is compiled (`npm run build`)
- Check for conflicting styles
- Verify theme classes are correct

### JavaScript Not Working
- Check console for errors
- Verify element IDs match JavaScript selectors
- Ensure scripts are loaded (check Network tab)

## Future Enhancements

Planned fragment additions:
- Data visualization panel (enhanced `visualize.html` integration)
- Query history panel
- Database schema explorer
- Export options dialog
- Advanced settings panel
