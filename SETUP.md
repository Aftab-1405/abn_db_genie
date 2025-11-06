# DB-Genie Setup Guide

## Overview
DB-Genie is a Flask-based web application that provides an AI-powered interface for database querying using Google's Gemini AI. This guide will help you set up the application from scratch.

## Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher (for Tailwind CSS)
- MySQL database server (for connecting to databases)
- Firebase project (for authentication and data storage)
- Google Gemini API key

## Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd abn_db_genie
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Environment Configuration

#### Create `.env` File
Copy the `.env.example` file to create your `.env` file:
```bash
cp .env.example .env
```

#### Configure Environment Variables

**Required Variables:**

1. **Flask Secret Key**
   ```
   SECRET_KEY=your_secret_key_here
   ```
   Generate a secure key using:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Google Gemini API Key**
   - Get from: https://makersuite.google.com/app/apikey
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Firebase Admin SDK Configuration**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Select your project > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Copy the values to your `.env`:
   ```
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   ```

4. **Firebase Client SDK Configuration (Frontend)**
   - Go to Firebase Console > Project Settings > General
   - Scroll down to "Your apps" section
   - Select your web app or create one
   - Copy the configuration values:
   ```
   FIREBASE_WEB_API_KEY=your_web_api_key_here
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_WEB_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

**Optional Variables:**
```
MAX_WORKERS=32                    # Thread pool size
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
FLASK_ENV=development             # development or production
```

### 5. Firebase Setup

#### Enable Authentication Methods
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google

#### Set Up Firestore Database
1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Choose "Start in production mode" (recommended)
4. Select your preferred location

#### Security Rules
Update Firestore security rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversation} {
      allow read, write: if request.auth != null &&
                           resource.data.user_id == request.auth.token.email;
    }
  }
}
```

### 6. Build Frontend Assets
Compile Tailwind CSS:
```bash
npm run watch
```
Or for production:
```bash
npx tailwindcss -i ./static/src/input.css -o ./static/styles.css --minify
```

### 7. Run the Application

**Development Mode:**
```bash
python app.py
```

**Production Mode (using Gunicorn):**
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

The application will be available at:
- Development: http://localhost:5000
- Production (Gunicorn): http://localhost:8000

## Usage

### First Time Login
1. Navigate to the landing page
2. Click on "Get Started" or "Login"
3. Register a new account or login with Google
4. You'll be redirected to the main application

### Connecting to a Database
1. Click the "Connect" button in the header
2. Enter your MySQL database credentials:
   - Host (e.g., localhost)
   - Port (default: 3306)
   - Username
   - Password
3. Click "Connect"
4. Select a database from the dropdown
5. Start querying!

### Querying with AI
1. Type your question in natural language
2. DB-Genie will understand your request and provide:
   - SQL queries
   - Query explanations
   - Schema visualizations
   - Data insights

### Using SQL Editor
1. Click the SQL icon in the header
2. Write your SQL query in the editor
3. Click "Execute" to run the query
4. View results in the modal

## Security Features

### What's Protected
- ✅ Firebase credentials are now stored server-side
- ✅ All database operations require authentication
- ✅ SQL injection protection via query validation
- ✅ Read-only mode (only SELECT queries allowed)
- ✅ Session-based authentication
- ✅ Secure password hashing (via Firebase)

### Important Notes
1. **Never commit your `.env` file to version control**
2. Use strong, unique passwords for database connections
3. The application currently operates in **read-only mode** for safety
4. All user inputs are sanitized and validated
5. Database credentials are stored only in server memory during active sessions

### Advanced Security Features

#### 1. CORS Protection
Cross-Origin Resource Sharing (CORS) is configured to control which domains can access the API.

**Configuration (.env):**
```
CORS_ORIGINS=*  # Allow all (dev only)
# OR for production:
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

#### 2. Rate Limiting
Protects against abuse and DoS attacks by limiting request frequency.

**Configuration (.env):**
```
RATELIMIT_ENABLED=True
RATELIMIT_STORAGE_URL=memory://  # Use redis:// for production
RATELIMIT_DEFAULT=200 per day, 50 per hour
```

**Default Limits:**
- 200 requests per day per IP
- 50 requests per hour per IP
- Specific endpoints may have stricter limits

For production with Redis:
```
RATELIMIT_STORAGE_URL=redis://localhost:6379
```

#### 3. Firebase Project Consistency
The application validates that both Admin SDK (backend) and Client SDK (frontend) use the **same Firebase project**.

**Critical:** If `FIREBASE_PROJECT_ID` ≠ `FIREBASE_WEB_PROJECT_ID`, the application will fail to start with a clear error message.

#### 4. Database Connection Monitoring
- **Heartbeat Endpoint:** `/db_heartbeat` - Lightweight health check
- **Status Endpoint:** `/db_status` - Detailed connection information
- Frontend can poll these endpoints to detect connection loss

#### 5. Read-Only Mode
- **Visual Indicator:** Yellow badge in header showing "READ-ONLY"
- **AI Awareness:** Gemini AI knows about read-only restrictions
- **Query Validation:** All non-SELECT queries are blocked with helpful error messages
- **User Feedback:** Clear explanations when write operations are attempted

## Recent Security & Feature Updates

### Phase 1: Critical Security Fixes ✅
1. **Exposed Firebase Keys** - Moved from frontend JavaScript to backend environment variables
2. **Missing Login Protection** - Added `@login_required` decorator to Gemini API endpoint
3. **Missing Logout Endpoint** - Added `/logout` route for proper session cleanup
4. **Environment Configuration** - Created `.env.example` template for easy setup

### Phase 2: High-Priority Enhancements ✅
1. **Dual Firebase Configuration Fix** - Added validation to ensure Admin SDK and Client SDK use the same Firebase project
2. **Database Connection Monitoring** - Added `/db_heartbeat` endpoint for connection health checks
3. **CORS Configuration** - Implemented Flask-CORS for secure cross-origin requests
4. **Rate Limiting** - Implemented Flask-Limiter to prevent abuse and DoS attacks
5. **Read-Only Mode UI** - Added visual indicator and improved error messages for write operations

### What Changed:
- **config.py** - Added Firebase project consistency validation, CORS and rate limiting configuration
- **app.py** - Integrated CORS and rate limiting middleware
- **requirements.txt** - Added Flask-CORS and Flask-Limiter
- **api/routes.py** - Added database heartbeat endpoint
- **services/gemini_service.py** - Enhanced system prompt with read-only mode emphasis
- **database/operations.py** - Improved error messages for blocked write operations
- **templates/fragments/header.html** - Added read-only mode badge
- **.env.example** - Added CORS and rate limiting configuration options
- **SETUP.md** - Comprehensive documentation for all new features

## Troubleshooting

### Firebase Authentication Errors
- Ensure Firebase credentials are correct in `.env`
- Check that authentication methods are enabled in Firebase Console
- Verify domain is authorized in Firebase settings

### Database Connection Fails
- Verify MySQL server is running
- Check credentials and network connectivity
- Ensure user has appropriate database permissions

### Gemini API Errors
- Verify API key is valid
- Check API quota limits
- Ensure billing is enabled (if required)

### Application Won't Start
- Check all required environment variables are set
- Verify Python dependencies are installed
- Check port 5000 is not already in use

## Development

### Project Structure
```
abn_db_genie/
├── api/                    # API routes
│   └── routes.py
├── auth/                   # Authentication
│   ├── routes.py
│   └── decorators.py
├── database/               # Database operations
│   ├── connection.py
│   ├── operations.py
│   └── security.py
├── services/               # External services
│   ├── gemini_service.py
│   └── firestore_service.py
├── static/                 # Frontend assets
│   ├── js/                # JavaScript modules
│   ├── images/
│   └── styles.css
├── templates/              # HTML templates
├── app.py                 # Application entry point
├── config.py              # Configuration
└── .env                   # Environment variables (create from .env.example)
```

### Running Tests
```bash
# Add when tests are implemented
pytest
```

## Production Deployment

### Recommended Stack
- **Web Server**: Nginx (reverse proxy)
- **WSGI Server**: Gunicorn
- **SSL**: Let's Encrypt
- **Process Manager**: Systemd or Supervisor

### Environment Variables for Production
```
FLASK_ENV=production
LOG_LEVEL=WARNING
SECRET_KEY=<use-very-strong-key>
```

### Security Checklist
- [ ] Set strong SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up firewall rules
- [ ] Enable Firebase App Check
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## Support
For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review logs for error messages

## License
See LICENSE file for details.
