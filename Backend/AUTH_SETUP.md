# Authentication System Setup Guide

This guide will help you set up the complete authentication system with Google OAuth, GitHub OAuth, and local authentication for your code analysis application.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [OAuth Setup](#oauth-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)

## Features

### Authentication Methods
- **Local Authentication**: Email/password registration and login
- **Google OAuth**: Sign in with Google account
- **GitHub OAuth**: Sign in with GitHub account
- **JWT Tokens**: Secure token-based authentication
- **Account Linking**: Link multiple auth methods to same account

### File Management
- **File Upload**: Upload code files for analysis (local users)
- **Repository Integration**: Fetch repositories from GitHub (OAuth users)
- **File Management**: Download, delete, and manage uploaded files

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Refresh token rotation
- Session management for OAuth
- File type validation
- User-specific file isolation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Google Developer Account (for Google OAuth)
- GitHub Developer Account (for GitHub OAuth)

## Installation

1. **Install Dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

## OAuth Setup

### Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Set authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)

4. **Copy Credentials**
   - Copy Client ID and Client Secret to your `.env` file

### GitHub OAuth Setup

1. **Create GitHub OAuth App**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"

2. **Configure OAuth App**
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000` (development)
   - Authorization callback URL: `http://localhost:8000/auth/github/callback`

3. **Copy Credentials**
   - Copy Client ID and Client Secret to your `.env` file

## Environment Configuration

Update your `.env` file with the following configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=CODIFYAUTOMATER

# Server Configuration
PORT=8000
NODE_ENV=development

# Client Configuration
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here_also_long_and_random

# Session Configuration
SESSION_SECRET=your_session_secret_here_also_long_and_random

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### Important Security Notes:
- Generate strong, random secrets for JWT and session
- Never commit `.env` file to version control
- Use different secrets for development and production
- In production, use HTTPS and set `NODE_ENV=production`

## Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

## API Endpoints

### Authentication Endpoints

#### Local Authentication
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/logout` - Logout user

#### OAuth Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback

#### User Management
- `GET /auth/me` - Get current user info (requires auth)
- `PUT /auth/profile` - Update user profile (requires auth)

### File Management Endpoints
- `POST /files/upload` - Upload files (requires auth)
- `GET /files` - Get user's uploaded files (requires auth)
- `GET /files/download/:filename` - Download file (requires auth)
- `DELETE /files/:filename` - Delete file (requires auth)
- `DELETE /files` - Clear all files (requires auth)

### Example API Usage

#### Register User
```javascript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    fullName: 'John Doe',
    username: 'johndoe'
  })
});

const data = await response.json();
// Returns: { success: true, data: { user, token, refreshToken } }
```

#### Login User
```javascript
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123'
  })
});

const data = await response.json();
// Returns: { success: true, data: { user, token, refreshToken } }
```

#### Upload Files
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('http://localhost:8000/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
// Returns: { success: true, data: { files, totalFiles } }
```

## Frontend Integration

### OAuth Flow

#### Google OAuth
```javascript
// Redirect to Google OAuth
window.location.href = 'http://localhost:8000/auth/google';

// Handle OAuth success (on redirect page)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const refreshToken = urlParams.get('refreshToken');

if (token) {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  // Redirect to dashboard
}
```

#### GitHub OAuth
```javascript
// Redirect to GitHub OAuth
window.location.href = 'http://localhost:8000/auth/github';

// Handle OAuth success (same as Google)
```

### Authenticated Requests

```javascript
// Make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Example: Get current user
const user = await makeAuthenticatedRequest('http://localhost:8000/auth/me');
```

### Token Management

```javascript
// Refresh token when expired
const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:8000/auth/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.token;
  }
  
  // Redirect to login if refresh fails
  window.location.href = '/login';
};
```

## User Model Schema

```javascript
{
  email: String (required, unique),
  username: String (required, unique),
  fullName: String (required),
  avatar: String,
  password: String (required for local auth),
  authMethod: String (local/google/github),
  googleId: String,
  githubId: String,
  githubUsername: String,
  isVerified: Boolean,
  repositories: [{
    name: String,
    url: String,
    provider: String (github/uploaded),
    uploadedFiles: [String]
  }],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  success: false,
  message: "Error description"
}
```

Common error codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS in production
2. **Environment Variables**: Never expose secrets in client-side code
3. **Token Storage**: Store JWT tokens securely (consider httpOnly cookies)
4. **Input Validation**: Validate all user inputs
5. **File Upload Security**: Validate file types and sizes
6. **Rate Limiting**: Implement rate limiting for API endpoints
7. **CORS Configuration**: Configure CORS properly for your domain

## Next Steps

1. **Repository Integration**: Implement GitHub API integration to fetch user repositories
2. **LLM Integration**: Add AI-powered code analysis features
3. **Code Analysis**: Implement bug detection and suggestion algorithms
4. **Real-time Features**: Add WebSocket support for real-time analysis
5. **Caching**: Implement Redis for session and data caching
6. **Testing**: Add comprehensive unit and integration tests

## Troubleshooting

### Common Issues

1. **OAuth Callback Error**
   - Check redirect URLs in OAuth app settings
   - Ensure CLIENT_URL is correctly set
   - Verify OAuth credentials

2. **Database Connection Error**
   - Check MongoDB is running
   - Verify MONGODB_URI in .env
   - Check database permissions

3. **JWT Token Error**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format in Authorization header

4. **File Upload Error**
   - Check file size limits
   - Verify file type restrictions
   - Ensure uploads directory permissions

For more help, check the server logs and ensure all environment variables are properly configured.